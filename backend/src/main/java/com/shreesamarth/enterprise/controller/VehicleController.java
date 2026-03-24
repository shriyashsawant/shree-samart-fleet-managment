package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.entity.VehicleDocument;
import com.shreesamarth.enterprise.repository.VehicleDocumentRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import com.shreesamarth.enterprise.service.OcrService;
import com.shreesamarth.enterprise.dto.VehicleDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final VehicleDocumentRepository documentRepository;
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

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<VehicleDTO>> getAllVehicles(Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        List<Vehicle> vehicles = tenant != null
            ? vehicleRepository.findByTenantId(tenant.getId())
            : vehicleRepository.findAll();

        List<VehicleDTO> dtos = vehicles.stream()
            .map(v -> new VehicleDTO(
                v.getId(),
                v.getVehicleNumber(),
                v.getModel(),
                v.getManufacturer(),
                v.getRegistrationDate(),
                v.getManufacturingYear(),
                v.getPurchaseDate(),
                v.getChassisNumber(),
                v.getEngineNumber(),
                v.getOwnerName(),
                v.getInsuranceCompany(),
                v.getInsuranceExpiry(),
                v.getPermitNumber(),
                v.getPermitExpiry(),
                v.getPermitIssueDate(),
                v.getFitnessExpiry(),
                v.getPucExpiry(),
                v.getEmissionLevel(),
                v.getTaxReceiptDate(),
                v.getTaxPeriodFrom(),
                v.getTaxPeriodTo(),
                v.getTaxAmount(),
                v.getEmiAmount(),
                v.getEmiBank(),
                v.getEmiStartDate(),
                v.getEmiEndDate(),
                v.getStatus(),
                v.getCreatedAt()
            ))
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable Long id) {
        return vehicleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Vehicle> createVehicle(@RequestBody Vehicle vehicle, Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        if (tenant != null) vehicle.setTenant(tenant);
        if (vehicleRepository.existsByVehicleNumber(vehicle.getVehicleNumber())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(vehicleRepository.save(vehicle));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @RequestBody Vehicle vehicle) {
        return vehicleRepository.findById(id)
                .map(existing -> {
                    vehicle.setId(id);
                    vehicle.setCreatedAt(existing.getCreatedAt());
                    vehicle.setTenant(existing.getTenant());
                    return ResponseEntity.ok(vehicleRepository.save(vehicle));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        if (vehicleRepository.existsById(id)) {
            vehicleRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/documents")
    @Transactional(readOnly = true)
    public ResponseEntity<List<VehicleDocument>> getVehicleDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(documentRepository.findByVehicleId(id));
    }

    @PostMapping("/{id}/documents")
    @Transactional
    public ResponseEntity<VehicleDocument> uploadDocument(
            @PathVariable Long id,
            @RequestParam("documentType") String documentType,
            @RequestParam("expiryDate") String expiryDate,
            @RequestParam("file") MultipartFile file) throws IOException {

        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        String fileUrl = fileUploadService.uploadFile(file, "vehicle-documents/" + vehicle.getVehicleNumber());

        VehicleDocument document = new VehicleDocument();
        document.setVehicle(vehicle);
        document.setDocumentType(documentType);
        document.setDocumentName(file.getOriginalFilename());
        document.setFilePath(fileUrl);
        document.setExpiryDate(expiryDate != null && !expiryDate.isEmpty() ? LocalDate.parse(expiryDate) : null);

        return ResponseEntity.ok(documentRepository.save(document));
    }

    @PostMapping("/{id}/documents/extract-ocr")
    @Transactional
    public ResponseEntity<Map<String, Object>> uploadDocumentWithOcr(
            @PathVariable Long id,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam("file") MultipartFile file) throws IOException {

        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        String fileUrl = fileUploadService.uploadFile(file, "vehicle-documents/" + vehicle.getVehicleNumber());

        Map<String, Object> ocrData = new HashMap<>();
        boolean ocrSuccess = false;

        try {
            Map<String, Object> ocrResponse = ocrService.extractDocument(file);
            if (ocrResponse != null && ocrResponse.containsKey("documents")) {
                List<Map<String, Object>> docs = (List<Map<String, Object>>) ocrResponse.get("documents");
                if (!docs.isEmpty()) {
                    ocrData = (Map<String, Object>) docs.get(0).get("data");
                    ocrSuccess = ocrData != null && !ocrData.isEmpty();
                }
            }
        } catch (Exception e) {
            // OCR failed, continue without OCR data
        }

        if (ocrSuccess && !ocrData.isEmpty()) {
            applyOcrToVehicle(vehicle, documentType, ocrData);
            vehicleRepository.save(vehicle);
        }

        VehicleDocument document = new VehicleDocument();
        document.setVehicle(vehicle);
        document.setDocumentType(documentType);
        document.setDocumentName(file.getOriginalFilename());
        document.setFilePath(fileUrl);
        
        if (expiryDate != null && !expiryDate.isEmpty()) {
            document.setExpiryDate(LocalDate.parse(expiryDate));
        } else if (ocrSuccess && !ocrData.isEmpty()) {
            LocalDate extractedExpiry = parseOcrDate(ocrData.get("expiry_date"));
            if (extractedExpiry == null) {
                extractedExpiry = parseOcrDate(ocrData.get("valid_to"));
            }
            if (extractedExpiry == null) {
                extractedExpiry = parseOcrDate(ocrData.get("certificate_expires"));
            }
            if (extractedExpiry == null) {
                extractedExpiry = parseOcrDate(ocrData.get("puc_validity"));
            }
            if (extractedExpiry != null) {
                document.setExpiryDate(extractedExpiry);
            }
        }

        VehicleDocument savedDoc = documentRepository.save(document);

        Map<String, Object> response = new HashMap<>();
        response.put("document", savedDoc);
        response.put("ocrData", ocrData);
        response.put("vehicleUpdated", ocrSuccess);

        return ResponseEntity.ok(response);
    }

    private void applyOcrToVehicle(Vehicle vehicle, String documentType, Map<String, Object> fields) {
        String docType = documentType.toUpperCase();
        
        if (docType.contains("RC") || docType.contains("REGISTRATION")) {
            if (fields.get("chassis_number") != null) vehicle.setChassisNumber(fields.get("chassis_number").toString());
            if (fields.get("engine_number") != null) vehicle.setEngineNumber(fields.get("engine_number").toString());
            if (fields.get("registration_date") != null) vehicle.setRegistrationDate(parseOcrDate(fields.get("registration_date")));
            if (fields.get("owner_name") != null) vehicle.setOwnerName(fields.get("owner_name").toString());
            if (fields.get("vehicle_number") != null && vehicle.getVehicleNumber() == null) vehicle.setVehicleNumber(fields.get("vehicle_number").toString());
            if (fields.get("manufacturing_year") != null) {
                try {
                    vehicle.setManufacturingYear(Integer.parseInt(fields.get("manufacturing_year").toString()));
                } catch(Exception e){}
            }
            
        } else if (docType.contains("INSURANCE")) {
            if (fields.get("insurance_company") != null) vehicle.setInsuranceCompany(fields.get("insurance_company").toString());
            if (fields.get("expiry_date") != null) vehicle.setInsuranceExpiry(parseOcrDate(fields.get("expiry_date")));
            
        } else if (docType.contains("FITNESS")) {
            if (fields.get("chassis_number") != null && (vehicle.getChassisNumber() == null || vehicle.getChassisNumber().isEmpty())) vehicle.setChassisNumber(fields.get("chassis_number").toString());
            if (fields.get("engine_number") != null && (vehicle.getEngineNumber() == null || vehicle.getEngineNumber().isEmpty())) vehicle.setEngineNumber(fields.get("engine_number").toString());
            if (fields.get("expiry_date") != null) vehicle.setFitnessExpiry(parseOcrDate(fields.get("expiry_date")));
            if (fields.get("certificate_expires") != null) vehicle.setFitnessExpiry(parseOcrDate(fields.get("certificate_expires")));
            
        } else if (docType.contains("PERMIT")) {
            if (fields.get("permit_number") != null) vehicle.setPermitNumber(fields.get("permit_number").toString());
            if (fields.get("permit_no") != null) vehicle.setPermitNumber(fields.get("permit_no").toString());
            if (fields.get("expiry_date") != null) vehicle.setPermitExpiry(parseOcrDate(fields.get("expiry_date")));
            if (fields.get("valid_to") != null) vehicle.setPermitExpiry(parseOcrDate(fields.get("valid_to")));
            if (fields.get("valid_from") != null) vehicle.setPermitIssueDate(parseOcrDate(fields.get("valid_from")));
            if (fields.get("owner_name") != null && (vehicle.getOwnerName() == null || vehicle.getOwnerName().isEmpty())) vehicle.setOwnerName(fields.get("owner_name").toString());

        } else if (docType.contains("TAX")) {
            if (fields.get("tax_amount") != null || fields.get("amount") != null) {
                try {
                    String amountStr = (fields.get("tax_amount") != null ? fields.get("tax_amount").toString() : fields.get("amount").toString()).replace(",", "").replace("₹", "").trim();
                    vehicle.setTaxAmount(new java.math.BigDecimal(amountStr));
                } catch (Exception e) {}
            }
            if (fields.get("tax_date") != null) vehicle.setTaxReceiptDate(parseOcrDate(fields.get("tax_date")));
            if (fields.get("payment_date") != null) vehicle.setTaxReceiptDate(parseOcrDate(fields.get("payment_date")));
            if (fields.get("period_from") != null) vehicle.setTaxPeriodFrom(parseOcrDate(fields.get("period_from")));
            if (fields.get("period_to") != null) vehicle.setTaxPeriodTo(parseOcrDate(fields.get("period_to")));

        } else if (docType.contains("PUC")) {
            if (fields.get("emission_level") != null) vehicle.setEmissionLevel(fields.get("emission_level").toString());
            if (fields.get("puc_validity") != null) vehicle.setPucExpiry(parseOcrDate(fields.get("puc_validity")));
            if (fields.get("expiry_date") != null) vehicle.setPucExpiry(parseOcrDate(fields.get("expiry_date")));
        }
    }

    private LocalDate parseOcrDate(Object dateValue) {
        if (dateValue == null) return null;
        try {
            if (dateValue instanceof String) {
                String dateStr = ((String) dateValue).trim();
                
                // ISO format: 2023-11-10
                if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    return LocalDate.parse(dateStr);
                }
                // US format: 11/10/2023 or 11-10-2023
                if (dateStr.matches("\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}")) {
                    String[] parts = dateStr.split("[/-]");
                    return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
                }
                // Indian format: 10-Nov-2023 or 10-Nov-2023
                if (dateStr.matches("\\d{1,2}-[A-Za-z]{3}-\\d{4}")) {
                    String[] parts = dateStr.split("-");
                    int day = Integer.parseInt(parts[0]);
                    int year = Integer.parseInt(parts[2]);
                    int month = switch (parts[1].toLowerCase()) {
                        case "jan" -> 1; case "feb" -> 2; case "mar" -> 3; case "apr" -> 4;
                        case "may" -> 5; case "jun" -> 6; case "jul" -> 7; case "aug" -> 8;
                        case "sep" -> 9; case "oct" -> 10; case "nov" -> 11; case "dec" -> 12;
                        default -> 1;
                    };
                    return LocalDate.of(year, month, day);
                }
                // Format: 13-02-2041 (from license)
                if (dateStr.matches("\\d{2}-\\d{2}-\\d{4}")) {
                    String[] parts = dateStr.split("-");
                    return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[1]), Integer.parseInt(parts[0]));
                }
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    @PostMapping("/{id}/documents/bulk")
    @Transactional
    public ResponseEntity<List<VehicleDocument>> uploadBulkDocuments(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("documentType") String documentType) throws IOException {

        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        List<VehicleDocument> documents = new ArrayList<>();
        
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String fileUrl = fileUploadService.uploadFile(file, "vehicle-documents/" + vehicle.getVehicleNumber());
                
                VehicleDocument document = new VehicleDocument();
                document.setVehicle(vehicle);
                document.setDocumentType(documentType);
                document.setDocumentName(file.getOriginalFilename());
                document.setFilePath(fileUrl);
                
                documents.add(documentRepository.save(document));
            }
        }
        
        return ResponseEntity.ok(documents);
    }

    @DeleteMapping("/documents/{docId}")
    @Transactional
    public ResponseEntity<Void> deleteDocument(@PathVariable Long docId) {
        documentRepository.deleteById(docId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getVehicleStats(Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        List<Vehicle> allVehicles = tenant != null
            ? vehicleRepository.findByTenantId(tenant.getId())
            : vehicleRepository.findAll();

        int totalVehicles = allVehicles.size();
        int activeVehicles = (int) allVehicles.stream()
                .filter(v -> "ACTIVE".equals(v.getStatus()))
                .count();
        int underMaintenance = (int) allVehicles.stream()
                .filter(v -> "UNDER_MAINTENANCE".equals(v.getStatus()))
                .count();

        BigDecimal avgFuelEconomy = allVehicles.stream()
                .filter(v -> v.getFuelEconomy() != null)
                .map(Vehicle::getFuelEconomy)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalVehicles > 0) {
            avgFuelEconomy = avgFuelEconomy.divide(
                    new BigDecimal(totalVehicles),
                    2,
                    RoundingMode.HALF_UP
            );
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVehicles", totalVehicles);
        stats.put("activeVehicles", activeVehicles);
        stats.put("underMaintenance", underMaintenance);
        stats.put("avgFuelEconomy", avgFuelEconomy);

        return ResponseEntity.ok(stats);
    }
}
