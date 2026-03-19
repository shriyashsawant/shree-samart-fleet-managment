package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.entity.VehicleCompliance;
import com.shreesamarth.enterprise.repository.VehicleComplianceRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
public class VehicleComplianceController {

    private final VehicleComplianceRepository complianceRepository;
    private final VehicleRepository vehicleRepository;
    private final FileUploadService fileUploadService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<VehicleCompliance>> getAllCompliance() {
        return ResponseEntity.ok(complianceRepository.findAll());
    }

    @GetMapping("/vehicle/{vehicleId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<VehicleCompliance>> getComplianceByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(complianceRepository.findByVehicleId(vehicleId));
    }

    @PostMapping
    public ResponseEntity<VehicleCompliance> createCompliance(
            @RequestParam("vehicleId") Long vehicleId,
            @RequestParam("type") String type,
            @RequestParam("issueDate") String issueDate,
            @RequestParam("expiryDate") String expiryDate,
            @RequestParam("amount") BigDecimal amount,
            @RequestParam(value = "remarks", required = false) String remarks,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        VehicleCompliance compliance = new VehicleCompliance();
        compliance.setVehicle(vehicle);
        compliance.setType(type);
        compliance.setIssueDate(issueDate != null && !issueDate.isEmpty() ? LocalDate.parse(issueDate) : null);
        compliance.setExpiryDate(LocalDate.parse(expiryDate));
        compliance.setAmount(amount);
        compliance.setRemarks(remarks);

        if (file != null && !file.isEmpty()) {
            // Upload to Firebase or local storage
            String fileUrl = fileUploadService.uploadFile(file, "compliance-documents");
            compliance.setDocumentPath(fileUrl);
        }

        return ResponseEntity.ok(complianceRepository.save(compliance));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleCompliance> updateCompliance(@PathVariable Long id, @RequestBody VehicleCompliance compliance) {
        return complianceRepository.findById(id)
                .map(existing -> {
                    compliance.setId(id);
                    compliance.setCreatedAt(existing.getCreatedAt());
                    return ResponseEntity.ok(complianceRepository.save(compliance));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompliance(@PathVariable Long id) {
        complianceRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
