package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.entity.VehicleDocument;
import com.shreesamarth.enterprise.repository.VehicleDocumentRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final VehicleDocumentRepository documentRepository;
    private final FileUploadService fileUploadService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<VehicleDTO>> getAllVehicles() {
        List<VehicleDTO> vehicles = vehicleRepository.findAll().stream()
            .map(v -> new VehicleDTO(
                v.getId(),
                v.getVehicleNumber(),
                v.getModel(),
                v.getManufacturer(),
                v.getRegistrationDate(),
                v.getPurchaseDate(),
                v.getChassisNumber(),
                v.getEngineNumber(),
                v.getOwnerName(),
                v.getInsuranceCompany(),
                v.getInsuranceExpiry(),
                v.getEmiAmount(),
                v.getEmiBank(),
                v.getEmiStartDate(),
                v.getEmiEndDate(),
                v.getStatus(),
                v.getCreatedAt()
            ))
            .collect(java.util.stream.Collectors.toList());
        System.out.println("🚗 [VEHICLE] Found " + vehicles.size() + " vehicles");
        vehicles.forEach(v -> System.out.println("  - ID: " + v.getId() + ", Number: " + v.getVehicleNumber()));
        return ResponseEntity.ok(vehicles);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable Long id) {
        return vehicleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Vehicle> createVehicle(@RequestBody Vehicle vehicle) {
        if (vehicleRepository.existsByVehicleNumber(vehicle.getVehicleNumber())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(vehicleRepository.save(vehicle));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @RequestBody Vehicle vehicle) {
        return vehicleRepository.findById(id)
                .map(existing -> {
                    vehicle.setId(id);
                    vehicle.setCreatedAt(existing.getCreatedAt());
                    return ResponseEntity.ok(vehicleRepository.save(vehicle));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        System.out.println("🗑️ [VEHICLE] Delete request for ID: " + id);
        if (vehicleRepository.existsById(id)) {
            vehicleRepository.deleteById(id);
            System.out.println("🗑️ [VEHICLE] Deleted successfully: " + id);
            return ResponseEntity.ok().build();
        }
        System.out.println("🗑️ [VEHICLE] Not found: " + id);
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/documents")
    public ResponseEntity<List<VehicleDocument>> getVehicleDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(documentRepository.findByVehicleId(id));
    }

    @PostMapping("/{id}/documents")
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

    @DeleteMapping("/documents/{docId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long docId) {
        documentRepository.deleteById(docId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getVehicleStats() {
        List<Vehicle> allVehicles = vehicleRepository.findAll();

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
