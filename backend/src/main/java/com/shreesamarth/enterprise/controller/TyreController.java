package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Tyre;
import com.shreesamarth.enterprise.service.TyreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tyres")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TyreController {
    private final TyreService tyreService;

    @GetMapping
    public ResponseEntity<List<Tyre>> getAllTyres() {
        return ResponseEntity.ok(tyreService.getAllTyres());
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<Tyre>> getTyresByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(tyreService.getTyresByVehicle(vehicleId));
    }

    @PostMapping
    public ResponseEntity<Tyre> createTyre(@RequestBody Tyre tyre) {
        return ResponseEntity.ok(tyreService.saveTyre(tyre));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tyre> updateTyre(@PathVariable Long id, @RequestBody Tyre tyre) {
        tyre.setId(id);
        return ResponseEntity.ok(tyreService.saveTyre(tyre));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTyre(@PathVariable Long id) {
        tyreService.deleteTyre(id);
        return ResponseEntity.noContent().build();
    }
}
