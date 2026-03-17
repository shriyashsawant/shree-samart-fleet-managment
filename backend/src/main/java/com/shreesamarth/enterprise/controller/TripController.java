package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Trip;
import com.shreesamarth.enterprise.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @PostMapping
    public ResponseEntity<Trip> createTrip(
            @RequestBody Trip trip,
            @AuthenticationPrincipal UserDetails userDetails) {
        // For now, use default tenant ID
        Trip created = tripService.createTrip(trip, 1L);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<List<Trip>> getAllTrips(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(tripService.getAllTrips(1L));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTripById(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<Trip>> getTripsByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(tripService.getTripsByVehicle(vehicleId));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Trip>> getTripsByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(tripService.getTripsByDriver(driverId));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<Trip>> getTripsByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(tripService.getTripsByClient(clientId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Trip> updateTrip(
            @PathVariable Long id,
            @RequestBody Trip trip) {
        return ResponseEntity.ok(tripService.updateTrip(id, trip));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.noContent().build();
    }
}
