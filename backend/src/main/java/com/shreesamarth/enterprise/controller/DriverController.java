package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Driver;
import com.shreesamarth.enterprise.entity.Reminder;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.DriverRepository;
import com.shreesamarth.enterprise.repository.ReminderRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import com.shreesamarth.enterprise.dto.DriverDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

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
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;

    private DriverDTO toDTO(Driver d) {
        return new DriverDTO(
            d.getId(),
            d.getName(),
            d.getPhone(),
            d.getAddress(),
            d.getAadhaarNumber(),
            d.getDrivingLicense(),
            d.getLicenseExpiry(),
            d.getJoiningDate(),
            d.getEndDate(),
            d.getSalary(),
            d.getStatus(),
            d.getAssignedVehicle() != null ? d.getAssignedVehicle().getId() : null,
            d.getAssignedVehicle() != null ? d.getAssignedVehicle().getVehicleNumber() : null,
            d.getLicenseFilePath(),
            d.getAadhaarFilePath(),
            d.getCreatedAt()
        );
    }

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsernameWithTenant(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<DriverDTO>> getAllDrivers(Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        List<DriverDTO> drivers;
        if (tenant != null) {
            drivers = driverRepository.findByTenantId(tenant.getId()).stream().map(this::toDTO).collect(java.util.stream.Collectors.toList());
        } else {
            drivers = driverRepository.findAll().stream().map(this::toDTO).collect(java.util.stream.Collectors.toList());
        }
        System.out.println("👤 [DRIVER] Found " + drivers.size() + " drivers");
        drivers.forEach(d -> System.out.println("  - ID: " + d.getId() + ", Name: " + d.getName()));
        return ResponseEntity.ok(drivers);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<DriverDTO> getDriverById(@PathVariable Long id) {
        return driverRepository.findById(id)
                .map(d -> ResponseEntity.ok(toDTO(d)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/vehicle/{vehicleId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Driver>> getDriversByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(driverRepository.findByAssignedVehicle_Id(vehicleId));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<DriverDTO> createDriver(@RequestBody Driver driver, Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        if (tenant != null) {
            driver.setTenant(tenant);
        }

        if (driver.getAssignedVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(driver.getAssignedVehicleId())
                    .orElse(null);
            driver.setAssignedVehicle(vehicle);
        }

        Driver saved = driverRepository.save(driver);

        if (saved.getLicenseExpiry() != null) {
            String title = "Driver License Expiring - " + (saved.getName() != null ? saved.getName() : "");
            if (title.length() > 95) title = title.substring(0, 95) + "...";
            
            Reminder reminder = new Reminder();
            reminder.setReminderType("LICENSE");
            reminder.setReferenceId(saved.getId());
            reminder.setReferenceType("DRIVER");
            reminder.setTitle(title);
            reminder.setDescription("License number: " + (saved.getDrivingLicense() != null ? saved.getDrivingLicense() : "N/A"));
            reminder.setExpiryDate(saved.getLicenseExpiry());
            reminder.setStatus("PENDING");
            if (tenant != null) reminder.setTenant(tenant);
            reminderRepository.save(reminder);
        }

        return ResponseEntity.ok(toDTO(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<DriverDTO> updateDriver(@PathVariable Long id, @RequestBody Driver driver) {
        return driverRepository.findById(id)
                .map(existing -> {
                    driver.setId(id);
                    driver.setCreatedAt(existing.getCreatedAt());
                    driver.setTenant(existing.getTenant());
                    driver.setLicenseFilePath(existing.getLicenseFilePath());
                    driver.setAadhaarFilePath(existing.getAadhaarFilePath());

                    if (driver.getAssignedVehicleId() != null) {
                        Vehicle vehicle = vehicleRepository.findById(driver.getAssignedVehicleId())
                                .orElse(null);
                        driver.setAssignedVehicle(vehicle);
                    }

                    return ResponseEntity.ok(toDTO(driverRepository.save(driver)));
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
    @Transactional
    public ResponseEntity<DriverDTO> uploadLicenseFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        String fileUrl = fileUploadService.uploadFile(file, "driver-documents/license");
        driver.setLicenseFilePath(fileUrl);
        return ResponseEntity.ok(toDTO(driverRepository.save(driver)));
    }

    @PostMapping("/{id}/aadhaar-file")
    @Transactional
    public ResponseEntity<DriverDTO> uploadAadhaarFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        String fileUrl = fileUploadService.uploadFile(file, "driver-documents/aadhaar");
        driver.setAadhaarFilePath(fileUrl);
        return ResponseEntity.ok(toDTO(driverRepository.save(driver)));
    }
}
