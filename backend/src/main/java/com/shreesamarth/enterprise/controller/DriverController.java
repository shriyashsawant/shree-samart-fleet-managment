package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Driver;
import com.shreesamarth.enterprise.entity.Reminder;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.DriverRepository;
import com.shreesamarth.enterprise.repository.ReminderRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
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
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final ReminderRepository reminderRepository;
    private final FileUploadService fileUploadService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Driver>> getAllDrivers() {
        List<Driver> drivers = driverRepository.findAll();
        System.out.println("👤 [DRIVER] Found " + drivers.size() + " drivers");
        drivers.forEach(d -> System.out.println("  - ID: " + d.getId() + ", Name: " + d.getName()));
        return ResponseEntity.ok(drivers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Driver> getDriverById(@PathVariable Long id) {
        return driverRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<Driver>> getDriversByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(driverRepository.findByAssignedVehicle_Id(vehicleId));
    }

    @PostMapping
    public ResponseEntity<Driver> createDriver(@RequestBody Driver driver) {
        if (driver.getAssignedVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(driver.getAssignedVehicleId())
                    .orElse(null);
            driver.setAssignedVehicle(vehicle);
        }
        
        Driver saved = driverRepository.save(driver);
        
        // Create reminder for license expiry if set
        if (saved.getLicenseExpiry() != null) {
            Reminder reminder = new Reminder();
            reminder.setReminderType("LICENSE");
            reminder.setReferenceId(saved.getId());
            reminder.setReferenceType("DRIVER");
            reminder.setTitle("Driver License Expiring - " + saved.getName());
            reminder.setDescription("License number: " + saved.getDrivingLicense());
            reminder.setExpiryDate(saved.getLicenseExpiry());
            reminder.setStatus("PENDING");
            reminderRepository.save(reminder);
        }
        
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Driver> updateDriver(@PathVariable Long id, @RequestBody Driver driver) {
        return driverRepository.findById(id)
                .map(existing -> {
                    driver.setId(id);
                    driver.setCreatedAt(existing.getCreatedAt());
                    
                    if (driver.getAssignedVehicleId() != null) {
                        Vehicle vehicle = vehicleRepository.findById(driver.getAssignedVehicleId())
                                .orElse(null);
                        driver.setAssignedVehicle(vehicle);
                    }
                    
                    return ResponseEntity.ok(driverRepository.save(driver));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable Long id) {
        if (driverRepository.existsById(id)) {
            driverRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/license-file")
    public ResponseEntity<Driver> uploadLicenseFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        // Upload to Firebase or local storage
        String fileUrl = fileUploadService.uploadFile(file, "driver-documents/license");
        driver.setLicenseFilePath(fileUrl);
        return ResponseEntity.ok(driverRepository.save(driver));
    }

    @PostMapping("/{id}/aadhaar-file")
    public ResponseEntity<Driver> uploadAadhaarFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        // Upload to Firebase or local storage
        String fileUrl = fileUploadService.uploadFile(file, "driver-documents/aadhaar");
        driver.setAadhaarFilePath(fileUrl);
        return ResponseEntity.ok(driverRepository.save(driver));
    }
}
