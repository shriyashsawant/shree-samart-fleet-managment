package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Maintenance;
import com.shreesamarth.enterprise.entity.Reminder;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.MaintenanceRepository;
import com.shreesamarth.enterprise.repository.ReminderRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final ReminderRepository reminderRepository;
    private final FileUploadService fileUploadService;

    @GetMapping
    public ResponseEntity<List<Maintenance>> getAllMaintenance(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        
        List<Maintenance> maintenance;
        if (vehicleId != null) {
            if (startDate != null && endDate != null) {
                maintenance = maintenanceRepository.findByVehicleIdAndDateBetween(vehicleId, startDate, endDate);
            } else {
                maintenance = maintenanceRepository.findByVehicleId(vehicleId);
            }
        } else {
            maintenance = maintenanceRepository.findAll();
        }
        return ResponseEntity.ok(maintenance);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Maintenance> getMaintenanceById(@PathVariable Long id) {
        return maintenanceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Maintenance> createMaintenance(@RequestBody Maintenance maintenance) {
        Vehicle vehicle = vehicleRepository.findById(maintenance.getVehicle().getId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        maintenance.setVehicle(vehicle);
        
        Maintenance saved = maintenanceRepository.save(maintenance);
        
        // Create reminder for next due if set
        if (saved.getNextDueDate() != null) {
            Reminder reminder = new Reminder();
            reminder.setReminderType("MAINTENANCE");
            reminder.setReferenceId(saved.getId());
            reminder.setReferenceType("MAINTENANCE");
            reminder.setTitle("Maintenance Due - " + saved.getMaintenanceType());
            reminder.setDescription("Vehicle: " + vehicle.getVehicleNumber());
            reminder.setExpiryDate(saved.getNextDueDate());
            reminder.setStatus("PENDING");
            reminderRepository.save(reminder);
        }
        
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Maintenance> updateMaintenance(@PathVariable Long id, @RequestBody Maintenance maintenance) {
        return maintenanceRepository.findById(id)
                .map(existing -> {
                    maintenance.setId(id);
                    maintenance.setCreatedAt(existing.getCreatedAt());
                    return ResponseEntity.ok(maintenanceRepository.save(maintenance));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaintenance(@PathVariable Long id) {
        if (maintenanceRepository.existsById(id)) {
            maintenanceRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/bill")
    public ResponseEntity<Maintenance> uploadBill(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        
        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance not found"));

        // Upload to Firebase or local storage
        String fileUrl = fileUploadService.uploadFile(file, "maintenance-bills");
        maintenance.setBillFilePath(fileUrl);
        return ResponseEntity.ok(maintenanceRepository.save(maintenance));
    }
}
