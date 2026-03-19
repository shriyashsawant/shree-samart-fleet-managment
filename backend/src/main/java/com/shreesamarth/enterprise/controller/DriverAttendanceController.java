package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Driver;
import com.shreesamarth.enterprise.entity.DriverAttendance;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.repository.DriverAttendanceRepository;
import com.shreesamarth.enterprise.repository.DriverRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class DriverAttendanceController {

    private final DriverAttendanceRepository attendanceRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsernameWithTenant(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping
    public ResponseEntity<List<DriverAttendance>> getAllAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        List<DriverAttendance> allTenant = tenant != null
            ? attendanceRepository.findByTenantId(tenant.getId())
            : attendanceRepository.findAll();

        if (date != null) {
            return ResponseEntity.ok(allTenant.stream()
                .filter(a -> date.equals(a.getDate()))
                .collect(Collectors.toList()));
        }
        return ResponseEntity.ok(allTenant);
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<DriverAttendance>> getAttendanceByDriver(
            @PathVariable Long driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        List<DriverAttendance> allTenant = tenant != null
            ? attendanceRepository.findByTenantId(tenant.getId())
            : attendanceRepository.findAll();

        List<DriverAttendance> filtered = allTenant.stream()
            .filter(a -> a.getDriver() != null && a.getDriver().getId().equals(driverId))
            .collect(Collectors.toList());

        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(filtered.stream()
                .filter(a -> a.getDate() != null && !a.getDate().isBefore(startDate) && !a.getDate().isAfter(endDate))
                .collect(Collectors.toList()));
        }
        return ResponseEntity.ok(filtered);
    }

    @PostMapping("/mark")
    @Transactional
    public ResponseEntity<DriverAttendance> markAttendance(@RequestBody Map<String, Object> payload, Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        Long driverId = Long.valueOf(payload.get("driverId").toString());
        LocalDate date = LocalDate.parse(payload.get("date").toString());
        String status = payload.get("status").toString();
        String notes = payload.get("notes") != null ? payload.get("notes").toString() : null;

        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        DriverAttendance attendance = attendanceRepository.findByDriverIdAndDate(driverId, date)
                .orElse(new DriverAttendance());

        attendance.setDriver(driver);
        attendance.setDate(date);
        attendance.setStatus(status);
        attendance.setNotes(notes);
        if (tenant != null) attendance.setTenant(tenant);

        return ResponseEntity.ok(attendanceRepository.save(attendance));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Long id) {
        attendanceRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
