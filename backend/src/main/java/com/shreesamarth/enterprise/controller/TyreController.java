package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.Tyre;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.service.TyreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/tyres")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TyreController {
    private final TyreService tyreService;
    private final UserRepository userRepository;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping
    public ResponseEntity<List<Tyre>> getAllTyres(Authentication auth) {
        return ResponseEntity.ok(tyreService.getAllTyres(getCurrentTenant(auth)));
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<Tyre>> getTyresByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(tyreService.getTyresByVehicle(vehicleId));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Tyre> createTyre(@RequestBody Tyre tyre, Authentication auth) {
        return ResponseEntity.ok(tyreService.saveTyre(tyre, getCurrentTenant(auth)));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Tyre> updateTyre(@PathVariable Long id, @RequestBody Tyre tyre) {
        tyre.setId(id);
        return ResponseEntity.ok(tyreService.updateTyre(tyre));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteTyre(@PathVariable Long id) {
        tyreService.deleteTyre(id);
        return ResponseEntity.noContent().build();
    }
}
