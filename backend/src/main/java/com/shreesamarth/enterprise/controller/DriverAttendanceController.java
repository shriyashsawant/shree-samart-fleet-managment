package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Driver;
import com.shreesamarth.enterprise.entity.DriverAttendance;
import com.shreesamarth.enterprise.repository.DriverAttendanceRepository;
import com.shreesamarth.enterprise.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class DriverAttendanceController {

    private final DriverAttendanceRepository attendanceRepository;
    private final DriverRepository driverRepository;

    @GetMapping
    public ResponseEntity<List<DriverAttendance>> getAllAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date != null) {
            return ResponseEntity.ok(attendanceRepository.findByDate(date));
        }
        return ResponseEntity.ok(attendanceRepository.findAll());
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<DriverAttendance>> getAttendanceByDriver(
            @PathVariable Long driverId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(attendanceRepository.findByDriverIdAndDateBetween(driverId, startDate, endDate));
        }
        return ResponseEntity.ok(attendanceRepository.findByDriverId(driverId));
    }

    @PostMapping("/mark")
    public ResponseEntity<DriverAttendance> markAttendance(@RequestBody Map<String, Object> payload) {
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
        
        return ResponseEntity.ok(attendanceRepository.save(attendance));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Long id) {
        attendanceRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
