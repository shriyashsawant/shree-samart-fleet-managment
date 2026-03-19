package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Maintenance;
import com.shreesamarth.enterprise.entity.Reminder;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.MaintenanceRepository;
import com.shreesamarth.enterprise.repository.ReminderRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsernameWithTenant(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Maintenance>> getAllMaintenance(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Authentication auth) {

        Tenant tenant = getCurrentTenant(auth);
        List<Maintenance> allTenant = tenant != null
            ? maintenanceRepository.findByTenantId(tenant.getId())
            : maintenanceRepository.findAll();

        List<Maintenance> maintenance;
        if (vehicleId != null) {
            if (startDate != null && endDate != null) {
                maintenance = allTenant.stream()
                    .filter(m -> m.getVehicle() != null && m.getVehicle().getId().equals(vehicleId))
                    .filter(m -> m.getDate() != null && !m.getDate().isBefore(startDate) && !m.getDate().isAfter(endDate))
                    .collect(Collectors.toList());
            } else {
                maintenance = allTenant.stream()
                    .filter(m -> m.getVehicle() != null && m.getVehicle().getId().equals(vehicleId))
                    .collect(Collectors.toList());
            }
        } else {
            maintenance = allTenant;
        }
        return ResponseEntity.ok(maintenance);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Maintenance> getMaintenanceById(@PathVariable Long id) {
        return maintenanceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Maintenance> createMaintenance(@RequestBody Maintenance maintenance, Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        Vehicle vehicle = vehicleRepository.findById(maintenance.getVehicle().getId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        maintenance.setVehicle(vehicle);
        if (tenant != null) maintenance.setTenant(tenant);

        Maintenance saved = maintenanceRepository.save(maintenance);

        if (saved.getNextDueDate() != null) {
            Reminder reminder = new Reminder();
            reminder.setReminderType("MAINTENANCE");
            reminder.setReferenceId(saved.getId());
            reminder.setReferenceType("MAINTENANCE");
            reminder.setTitle("Maintenance Due - " + saved.getMaintenanceType());
            reminder.setDescription("Vehicle: " + vehicle.getVehicleNumber());
            reminder.setExpiryDate(saved.getNextDueDate());
            reminder.setStatus("PENDING");
            if (tenant != null) reminder.setTenant(tenant);
            reminderRepository.save(reminder);
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Maintenance> updateMaintenance(@PathVariable Long id, @RequestBody Maintenance maintenance) {
        return maintenanceRepository.findById(id)
                .map(existing -> {
                    maintenance.setId(id);
                    maintenance.setCreatedAt(existing.getCreatedAt());
                    maintenance.setTenant(existing.getTenant());
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
    @Transactional
    public ResponseEntity<Maintenance> uploadBill(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance not found"));

        String fileUrl = fileUploadService.uploadFile(file, "maintenance-bills");
        maintenance.setBillFilePath(fileUrl);
        return ResponseEntity.ok(maintenanceRepository.save(maintenance));
    }
}
