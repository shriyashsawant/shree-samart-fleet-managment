package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.DriverAdvance;
import com.shreesamarth.enterprise.service.DriverAdvanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/advances")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DriverAdvanceController {
    private final DriverAdvanceService advanceService;

    @GetMapping
    public ResponseEntity<List<DriverAdvance>> getAllAdvances() {
        return ResponseEntity.ok(advanceService.getAllAdvances());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<DriverAdvance>> getPendingAdvances() {
        return ResponseEntity.ok(advanceService.getPendingAdvances());
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<DriverAdvance>> getAdvancesByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(advanceService.getAdvancesByDriver(driverId));
    }

    @PostMapping
    public ResponseEntity<DriverAdvance> createAdvance(@RequestBody DriverAdvance advance) {
        return ResponseEntity.ok(advanceService.saveAdvance(advance));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DriverAdvance> updateAdvance(@PathVariable Long id, @RequestBody DriverAdvance advance) {
        advance.setId(id);
        return ResponseEntity.ok(advanceService.saveAdvance(advance));
    }

    @PostMapping("/{id}/settle")
    public ResponseEntity<DriverAdvance> settleAdvance(@PathVariable Long id) {
        return ResponseEntity.ok(advanceService.settleAdvance(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdvance(@PathVariable Long id) {
        advanceService.deleteAdvance(id);
        return ResponseEntity.noContent().build();
    }
}
