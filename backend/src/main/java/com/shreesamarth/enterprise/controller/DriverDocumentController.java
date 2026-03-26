package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Driver;
import com.shreesamarth.enterprise.entity.DriverDocument;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.repository.DriverDocumentRepository;
import com.shreesamarth.enterprise.repository.DriverRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import com.shreesamarth.enterprise.service.OcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/driver-documents")
@RequiredArgsConstructor
public class DriverDocumentController {

    private final DriverDocumentRepository documentRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final OcrService ocrService;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsernameWithTenant(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping("/driver/{driverId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<DriverDocument>> getByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(documentRepository.findByDriverId(driverId));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<DriverDocument> uploadDocument(
            @RequestParam("driverId") Long driverId,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "documentNumber", required = false) String documentNumber,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication auth) throws IOException {

        Tenant tenant = getCurrentTenant(auth);
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        DriverDocument doc = new DriverDocument();
        doc.setDriver(driver);
        doc.setDocumentType(documentType);
        doc.setDocumentNumber(documentNumber);
        if (expiryDate != null && !expiryDate.isEmpty()) {
            doc.setExpiryDate(LocalDate.parse(expiryDate));
        }

        if (file != null && !file.isEmpty()) {
            String fileUrl = fileUploadService.uploadFile(file, "driver-documents");
            doc.setFilePath(fileUrl);
            doc.setDocumentName(file.getOriginalFilename());
        }

        return ResponseEntity.ok(documentRepository.save(doc));
    }

    @PostMapping("/extract-ocr")
    @Transactional
    public ResponseEntity<Map<String, Object>> uploadDocumentWithOcr(
            @RequestParam("driverId") Long driverId,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "documentNumber", required = false) String documentNumber,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication auth) throws IOException {

        Tenant tenant = getCurrentTenant(auth);
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        String fileUrl = null;
        Map<String, Object> ocrData = new HashMap<>();
        boolean ocrSuccess = false;

        if (file != null && !file.isEmpty()) {
            fileUrl = fileUploadService.uploadFile(file, "driver-documents");
            
            try {
                Map<String, Object> ocrResponse = ocrService.extractDocument(file);
                if (ocrResponse != null && ocrResponse.containsKey("documents")) {
                    List<Map<String, Object>> docs = (List<Map<String, Object>>) ocrResponse.get("documents");
                    if (!docs.isEmpty()) {
                        ocrData = (Map<String, Object>) docs.get(0).get("data");
                        ocrSuccess = (ocrData != null && !ocrData.isEmpty());
                    }
                }
            } catch (Exception e) {
                // OCR failed, continue without OCR data
            }
        }

        if (ocrSuccess) {
            applyOcrToDriver(driver, documentType, ocrData);
            driverRepository.save(driver);
        }

        DriverDocument doc = new DriverDocument();
        doc.setDriver(driver);
        doc.setDocumentType(documentType);
        
        if (documentNumber != null && !documentNumber.isEmpty()) {
            doc.setDocumentNumber(documentNumber);
        } else if (ocrSuccess && ocrData.get("license_number") != null) {
            doc.setDocumentNumber(ocrData.get("license_number").toString());
        }

        if (expiryDate != null && !expiryDate.isEmpty()) {
            doc.setExpiryDate(LocalDate.parse(expiryDate));
        } else if (ocrSuccess) {
            LocalDate extractedExpiry = parseOcrDate(ocrData.get("expiry_date"));
            if (extractedExpiry == null) {
                extractedExpiry = parseOcrDate(ocrData.get("valid_to"));
            }
            if (extractedExpiry == null) {
                extractedExpiry = parseOcrDate(ocrData.get("license_expiry"));
            }
            if (extractedExpiry != null) {
                doc.setExpiryDate(extractedExpiry);
            }
        }

        if (fileUrl != null) {
            doc.setFilePath(fileUrl);
            doc.setDocumentName(file.getOriginalFilename());
        }

        DriverDocument savedDoc = documentRepository.save(doc);

        Map<String, Object> response = new HashMap<>();
        response.put("document", savedDoc);
        response.put("ocrData", ocrData);
        response.put("driverUpdated", ocrSuccess);

        return ResponseEntity.ok(response);
    }

    private void applyOcrToDriver(Driver driver, String documentType, Map<String, Object> ocrData) {
        String docType = documentType.toUpperCase();
        
        if (docType.contains("LICENSE") || docType.contains("DL")) {
            if (ocrData.get("license_number") != null && (driver.getDrivingLicense() == null || driver.getDrivingLicense().isEmpty())) {
                driver.setDrivingLicense(ocrData.get("license_number").toString());
            }
            if (ocrData.get("expiry_date") != null) {
                driver.setLicenseExpiry(parseOcrDate(ocrData.get("expiry_date")));
            }
            if (ocrData.get("valid_to") != null) {
                driver.setLicenseExpiry(parseOcrDate(ocrData.get("valid_to")));
            }
            if (ocrData.get("name") != null && (driver.getName() == null || driver.getName().isEmpty())) {
                driver.setName(ocrData.get("name").toString());
            }
            if (ocrData.get("dob") != null) {
                driver.setDateOfBirth(parseOcrDate(ocrData.get("dob")));
            }
            if (ocrData.get("blood_group") != null) {
                driver.setBloodGroup(ocrData.get("blood_group").toString());
            }
            if (ocrData.get("state") != null) {
                driver.setState(ocrData.get("state").toString());
            }
        } else if (docType.contains("AADHAAR") || docType.contains("AADHAR")) {
            if (ocrData.get("aadhaar_number") != null && (driver.getAadhaarNumber() == null || driver.getAadhaarNumber().isEmpty())) {
                driver.setAadhaarNumber(ocrData.get("aadhaar_number").toString());
            }
            if (ocrData.get("dob") != null) {
                driver.setDateOfBirth(parseOcrDate(ocrData.get("dob")));
            }
            if (ocrData.get("name") != null && (driver.getName() == null || driver.getName().isEmpty())) {
                driver.setName(ocrData.get("name").toString());
            }
        }
    }

    private LocalDate parseOcrDate(Object dateValue) {
        if (dateValue == null) return null;
        try {
            if (dateValue instanceof String) {
                String dateStr = (String) dateValue;
                if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    return LocalDate.parse(dateStr);
                } else if (dateStr.matches("\\d{2}/\\d{2}/\\d{4}")) {
                    String[] parts = dateStr.split("/");
                    return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
                }
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentRepository.findById(id).ifPresent(doc -> {
            // Delete file from Firebase/local storage
            fileUploadService.deleteFile(doc.getFilePath());
            documentRepository.delete(doc);
        });
        return ResponseEntity.ok().build();
    }
}
