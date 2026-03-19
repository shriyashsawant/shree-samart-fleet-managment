package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.entity.VehicleDocument;
import com.shreesamarth.enterprise.repository.VehicleDocumentRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
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
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final VehicleDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsername(username).orElse(null);
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
