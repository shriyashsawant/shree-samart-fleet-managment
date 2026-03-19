package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.DriverAdvance;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.service.DriverAdvanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/advances")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DriverAdvanceController {
    private final DriverAdvanceService advanceService;
    private final UserRepository userRepository;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping
    public ResponseEntity<List<DriverAdvance>> getAllAdvances(Authentication auth) {
        return ResponseEntity.ok(advanceService.getAllAdvances(getCurrentTenant(auth)));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<DriverAdvance>> getPendingAdvances(Authentication auth) {
        return ResponseEntity.ok(advanceService.getPendingAdvances(getCurrentTenant(auth)));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<DriverAdvance>> getAdvancesByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(advanceService.getAdvancesByDriver(driverId));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<DriverAdvance> createAdvance(@RequestBody DriverAdvance advance, Authentication auth) {
        return ResponseEntity.ok(advanceService.saveAdvance(advance, getCurrentTenant(auth)));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<DriverAdvance> updateAdvance(@PathVariable Long id, @RequestBody DriverAdvance advance) {
        advance.setId(id);
        return ResponseEntity.ok(advanceService.updateAdvance(advance));
    }

    @PostMapping("/{id}/settle")
    @Transactional
    public ResponseEntity<DriverAdvance> settleAdvance(@PathVariable Long id) {
        return ResponseEntity.ok(advanceService.settleAdvance(id));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteAdvance(@PathVariable Long id) {
        advanceService.deleteAdvance(id);
        return ResponseEntity.noContent().build();
    }
}
