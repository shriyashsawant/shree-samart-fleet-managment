package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.dto.ComplianceDTO;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.entity.VehicleCompliance;
import com.shreesamarth.enterprise.entity.VehicleDocument;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.repository.VehicleComplianceRepository;
import com.shreesamarth.enterprise.repository.VehicleDocumentRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
public class VehicleComplianceController {

    private final VehicleComplianceRepository complianceRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final com.shreesamarth.enterprise.service.OcrService ocrService;
    private final VehicleDocumentRepository vehicleDocumentRepository;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsernameWithTenant(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    private ComplianceDTO toDTO(VehicleCompliance c) {
        ComplianceDTO dto = new ComplianceDTO();
        dto.setId(c.getId());
        dto.setType(c.getType());
        dto.setIssueDate(c.getIssueDate());
        dto.setExpiryDate(c.getExpiryDate());
        dto.setAmount(c.getAmount());
        dto.setDocumentPath(c.getDocumentPath());
        dto.setStatus(c.getStatus());
        dto.setRemarks(c.getRemarks());
        dto.setCreatedAt(c.getCreatedAt());
        if (c.getVehicle() != null) {
            dto.setVehicleId(c.getVehicle().getId());
            dto.setVehicleNumber(c.getVehicle().getVehicleNumber());
            dto.setVehicleModel(c.getVehicle().getModel());
        }
        return dto;
    }

    private String mapDocTypeToCompliance(String docType) {
        if (docType == null) return "Other";
        String upper = docType.toUpperCase();
        if (upper.contains("RC")) return "RC Book";
        if (upper.contains("TAX")) return "Road Tax";
        if (upper.contains("FITNESS")) return "Fitness Certificate";
        if (upper.contains("INSURANCE")) return "Insurance";
        if (upper.contains("PUC")) return "PUC";
        if (upper.contains("PERMIT")) return "Permit";
        return docType;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<ComplianceDTO>> getAllCompliance(Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        List<VehicleCompliance> all = tenant != null
            ? complianceRepository.findByTenantId(tenant.getId())
            : complianceRepository.findAll();
        List<ComplianceDTO> dtos = all.stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/vehicle/{vehicleId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<ComplianceDTO>> getComplianceByVehicle(@PathVariable Long vehicleId) {
        List<ComplianceDTO> dtos = complianceRepository.findByVehicleId(vehicleId)
                .stream().map(this::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Backfill: Scans all VehicleDocuments and creates missing compliance records.
     * Safe to call multiple times — it skips documents that already have compliance.
     */
    @PostMapping("/sync-from-documents")
    @Transactional
    public ResponseEntity<Map<String, Object>> syncFromDocuments() {
        List<VehicleDocument> allDocs = vehicleDocumentRepository.findAll();
        int created = 0;

        for (VehicleDocument doc : allDocs) {
            Vehicle vehicle = doc.getVehicle();
            if (vehicle == null) continue;

            String compType = mapDocTypeToCompliance(doc.getDocumentType());

            // Check if compliance already exists for this vehicle + type
            boolean exists = complianceRepository.findByVehicleId(vehicle.getId()).stream()
                    .anyMatch(c -> c.getType().equalsIgnoreCase(compType));
            if (exists) continue;

            VehicleCompliance compliance = new VehicleCompliance();
            compliance.setVehicle(vehicle);
            compliance.setTenant(vehicle.getTenant());
            compliance.setType(compType);
            compliance.setExpiryDate(doc.getExpiryDate() != null ? doc.getExpiryDate() : LocalDate.now().plusMonths(12));
            compliance.setDocumentPath(doc.getFilePath());
            compliance.setStatus("ACTIVE");
            compliance.setRemarks(doc.getRemarks());
            complianceRepository.save(compliance);
            created++;
        }

        return ResponseEntity.ok(Map.of(
            "synced", created,
            "totalDocuments", allDocs.size(),
            "message", "Compliance records synchronized from vehicle documents"
        ));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<VehicleCompliance> createCompliance(
            @RequestParam("vehicleId") Long vehicleId,
            @RequestParam("type") String type,
            @RequestParam(value = "issueDate", required = false) String issueDate,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam(value = "amount", required = false) BigDecimal amount,
            @RequestParam(value = "remarks", required = false) String remarks,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication auth) throws IOException {

        Tenant tenant = getCurrentTenant(auth);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        VehicleCompliance compliance = new VehicleCompliance();
        compliance.setVehicle(vehicle);
        compliance.setType(type);
        compliance.setIssueDate(issueDate != null && !issueDate.isEmpty() ? LocalDate.parse(issueDate) : null);
        compliance.setExpiryDate(expiryDate != null && !expiryDate.isEmpty() ? LocalDate.parse(expiryDate) : null);
        compliance.setAmount(amount != null ? amount : BigDecimal.ZERO);
        compliance.setRemarks(remarks);
        if (tenant != null) compliance.setTenant(tenant);

        if (file != null && !file.isEmpty()) {
            String fileUrl = fileUploadService.uploadFile(file, "compliance-documents/" + vehicle.getVehicleNumber());
            compliance.setDocumentPath(fileUrl);
            
            // Automatic OCR Integration
            try {
                Map<String, Object> ocrResponse = ocrService.extractDocument(file);
                if (ocrResponse != null && ocrResponse.containsKey("documents")) {
                    List<Map<String, Object>> docs = (List<Map<String, Object>>) ocrResponse.get("documents");
                    if (!docs.isEmpty()) {
                        Map<String, Object> ocrData = (Map<String, Object>) docs.get(0).get("data");
                        String detectedType = (String) docs.get(0).get("type");
                        
                        if (detectedType != null) {
                            compliance.setType(mapDocTypeToCompliance(detectedType));
                        }

                        if (ocrData != null && !ocrData.isEmpty()) {
                            if (compliance.getExpiryDate() == null) {
                                String exp = (String) ocrData.getOrDefault("expiry_date", ocrData.get("valid_to"));
                                if (exp != null) {
                                    try {
                                        compliance.setExpiryDate(LocalDate.parse(exp.split("T")[0]));
                                    } catch (Exception e) {}
                                }
                            }
                            
                            StringBuilder sb = new StringBuilder();
                            if (compliance.getRemarks() != null) sb.append(compliance.getRemarks()).append(" | ");
                            sb.append("Extracted Meta: ");
                            ocrData.forEach((k, v) -> {
                                if (v != null && !v.toString().isEmpty() && !k.contains("date")) {
                                    sb.append(k).append(": ").append(v).append(", ");
                                }
                            });
                            compliance.setRemarks(sb.toString().replaceAll(", $", ""));
                        }
                    }
                }
            } catch (Exception e) {
                // Best effort OCR 
            }
        }

        if (compliance.getExpiryDate() == null) {
            compliance.setExpiryDate(LocalDate.now().plusMonths(12));
        }

        return ResponseEntity.ok(complianceRepository.save(compliance));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<VehicleCompliance> updateCompliance(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        return complianceRepository.findById(id)
                .map(existing -> {
                    if (updates.containsKey("type")) existing.setType((String) updates.get("type"));
                    if (updates.containsKey("expiryDate") && updates.get("expiryDate") != null) {
                        existing.setExpiryDate(LocalDate.parse(updates.get("expiryDate").toString().split("T")[0]));
                    }
                    if (updates.containsKey("amount") && updates.get("amount") != null) {
                        existing.setAmount(new BigDecimal(updates.get("amount").toString()));
                    }
                    if (updates.containsKey("remarks")) existing.setRemarks((String) updates.get("remarks"));
                    if (updates.containsKey("status")) existing.setStatus((String) updates.get("status"));
                    return ResponseEntity.ok(complianceRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteCompliance(@PathVariable Long id) {
        complianceRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
