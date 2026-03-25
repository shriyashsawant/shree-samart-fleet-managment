package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.*;
import com.shreesamarth.enterprise.repository.*;
import com.shreesamarth.enterprise.service.FileUploadService;
import com.shreesamarth.enterprise.service.OcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OcrController {

    private final OcrService ocrService;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final VehicleDocumentRepository vehicleDocumentRepository;
    private final VehicleComplianceRepository complianceRepository;
    private final DriverDocumentRepository driverDocumentRepository;
    private final FileUploadService fileUploadService;

    @PostMapping("/extract")
    public ResponseEntity<Map<String, Object>> extractDocument(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> result = ocrService.extractDocument(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/upload-and-map")
    @Transactional
    public ResponseEntity<Map<String, Object>> uploadAndMap(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> ocrResponse = ocrService.extractDocument(file);
            if (ocrResponse == null || !ocrResponse.containsKey("documents")) {
                return ResponseEntity.badRequest().body(Map.of("error", "AI Extraction Failed"));
            }

            List<Map<String, Object>> docs = (List<Map<String, Object>>) ocrResponse.get("documents");
            if (docs.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "No data found in scan"));

            Map<String, Object> data = (Map<String, Object>) docs.get(0).get("data");
            String type = (String) docs.get(0).get("type");

            Vehicle vehicle = findVehicle(data);
            Driver driver = findDriver(data);

            String folder = "inbox";
            if (vehicle != null) folder = "vehicle-documents/" + vehicle.getVehicleNumber();
            else if (driver != null) folder = "driver-documents/" + driver.getId();

            String fileUrl = fileUploadService.uploadFile(file, folder);

            if (vehicle != null) {
                mapToVehicle(vehicle, type, data, fileUrl, file.getOriginalFilename());
                response.put("mappedTo", "VEHICLE");
                response.put("target", vehicle.getVehicleNumber());
            } else if (driver != null) {
                mapToDriver(driver, type, data, fileUrl, file.getOriginalFilename());
                response.put("mappedTo", "DRIVER");
                response.put("target", driver.getName());
            } else {
                response.put("mappedTo", "UNKNOWN");
            }

            response.put("type", type);
            response.put("data", data);
            response.put("url", fileUrl);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private Vehicle findVehicle(Map<String, Object> data) {
        String vn = (String) data.get("vehicle_number");
        if (vn != null) {
            // Normalize to match the DB format (XX-00-XX-0000)
            String clean = vn.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
            if (clean.length() >= 8) {
                StringBuilder sb = new StringBuilder();
                sb.append(clean, 0, 2).append("-");
                sb.append(clean, 2, 4).append("-");
                int seriesEnd = clean.length() - 4;
                sb.append(clean, 4, seriesEnd).append("-");
                sb.append(clean.substring(seriesEnd));
                clean = sb.toString();
            }
            Optional<Vehicle> v = vehicleRepository.findByVehicleNumber(clean);
            if (v.isPresent()) return v.get();
        }
        String cn = (String) data.get("chassis_number");
        if (cn != null) {
            Optional<Vehicle> v = vehicleRepository.findByChassisNumber(cn);
            if (v.isPresent()) return v.get();
        }
        return null;
    }

    private Driver findDriver(Map<String, Object> data) {
        String name = (String) data.get("name");
        if (name != null) {
            Optional<Driver> d = driverRepository.findByName(name);
            if (d.isPresent()) return d.get();
        }
        String dl = (String) data.get("dl_no");
        if (dl != null) {
            Optional<Driver> d = driverRepository.findByDrivingLicense(dl);
            if (d.isPresent()) return d.get();
        }
        return null;
    }

    private void mapToVehicle(Vehicle v, String type, Map<String, Object> data, String url, String name) {
        String effectiveType = "OTHER";
        if (type.equals("vehicle_rc")) effectiveType = "RC";
        else if (type.equals("fitness")) effectiveType = "FITNESS";
        else if (type.equals("permit")) effectiveType = "PERMIT";
        else if (type.equals("tax_receipt")) effectiveType = "TAX";
        else if (type.equals("insurance")) effectiveType = "INSURANCE";
        else if (type.equals("puc")) effectiveType = "PUC";

        VehicleDocument doc = new VehicleDocument();
        doc.setVehicle(v);
        doc.setDocumentType(effectiveType);
        doc.setDocumentName(name);
        doc.setFilePath(url);
        
        String exp = (String) data.getOrDefault("expiry_date", data.get("valid_to"));
        if (exp != null) {
            try { doc.setExpiryDate(LocalDate.parse(exp.split("T")[0])); } catch (Exception e) {}
        }
        
        StringBuilder sb = new StringBuilder("AI Map: ");
        data.forEach((k, val) -> {
            if (val != null) sb.append(k).append(": ").append(val).append(", ");
        });
        doc.setRemarks(sb.toString().replaceAll(", $", ""));

        vehicleDocumentRepository.save(doc);
        syncCompliance(v, doc);
    }

    private void mapToDriver(Driver d, String type, Map<String, Object> data, String url, String name) {
        DriverDocument doc = new DriverDocument();
        doc.setDriver(d);
        doc.setDocumentType(type);
        doc.setDocumentName(name);
        doc.setFilePath(url);
        String exp = (String) data.getOrDefault("expiry_date", data.get("valid_to"));
        if (exp != null) {
            try { doc.setExpiryDate(LocalDate.parse(exp.split("T")[0])); } catch (Exception e) {}
        }
        driverDocumentRepository.save(doc);
    }

    private void syncCompliance(Vehicle v, VehicleDocument d) {
        // Find existing compliance of same type for this vehicle, or create new
        String docType = d.getDocumentType();
        List<VehicleCompliance> existing = complianceRepository.findByVehicleId(v.getId()).stream()
                .filter(c -> c.getType().equalsIgnoreCase(docType))
                .toList();
        
        VehicleCompliance c = existing.isEmpty() ? new VehicleCompliance() : existing.get(0);
        c.setVehicle(v);
        c.setType(docType);
        c.setExpiryDate(d.getExpiryDate() != null ? d.getExpiryDate() : LocalDate.now().plusMonths(12));
        c.setDocumentPath(d.getFilePath());
        c.setStatus("ACTIVE");
        c.setRemarks(d.getRemarks());
        complianceRepository.save(c);
    }

    @PostMapping("/learn")
    public ResponseEntity<Map<String, Object>> learnCorrection(@RequestBody Map<String, String> data) {
        try {
            return ResponseEntity.ok(ocrService.learnCorrection(data.get("wrong"), data.get("correct"), data.get("field_type")));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, Object>> getSuggestions(@RequestParam String fieldType, @RequestParam(required = false) String prefix) {
        try {
            return ResponseEntity.ok(ocrService.getSuggestions(fieldType, prefix));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "healthy"));
    }
}
