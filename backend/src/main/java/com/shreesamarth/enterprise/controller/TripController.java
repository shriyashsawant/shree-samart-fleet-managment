package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.dto.TripDTO;
import com.shreesamarth.enterprise.entity.Trip;
import com.shreesamarth.enterprise.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
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
    @Transactional
    public ResponseEntity<TripDTO> createTrip(
            @RequestBody Trip trip,
            @AuthenticationPrincipal UserDetails userDetails) {
        Trip created = tripService.createTrip(trip, 1L);
        return ResponseEntity.ok(toDTO(created));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<TripDTO>> getAllTrips(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<Trip> trips = tripService.getAllTrips(1L);
        List<TripDTO> dtos = trips.stream().map(this::toDTO).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<TripDTO> getTripById(@PathVariable Long id) {
        Trip trip = tripService.getTripById(id);
        return ResponseEntity.ok(toDTO(trip));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<TripDTO>> getTripsByVehicle(@PathVariable Long vehicleId) {
        List<Trip> trips = tripService.getTripsByVehicle(vehicleId);
        List<TripDTO> dtos = trips.stream().map(this::toDTO).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/driver/{driverId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<TripDTO>> getTripsByDriver(@PathVariable Long driverId) {
        List<Trip> trips = tripService.getTripsByDriver(driverId);
        List<TripDTO> dtos = trips.stream().map(this::toDTO).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/client/{clientId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<TripDTO>> getTripsByClient(@PathVariable Long clientId) {
        List<Trip> trips = tripService.getTripsByClient(clientId);
        List<TripDTO> dtos = trips.stream().map(this::toDTO).toList();
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripDTO> updateTrip(
            @PathVariable Long id,
            @RequestBody Trip trip) {
        Trip updated = tripService.updateTrip(id, trip);
        return ResponseEntity.ok(toDTO(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.noContent().build();
    }

    private TripDTO toDTO(Trip trip) {
        return new TripDTO(
            trip.getId(),
            trip.getTripNumber(),
            trip.getTripDate(),
            trip.getVehicle() != null ? trip.getVehicle().getId() : null,
            trip.getVehicle() != null ? trip.getVehicle().getVehicleNumber() : null,
            trip.getDriver() != null ? trip.getDriver().getId() : null,
            trip.getDriver() != null ? trip.getDriver().getName() : null,
            trip.getClient() != null ? trip.getClient().getId() : null,
            trip.getClient() != null ? trip.getClient().getPartyName() : null,
            trip.getSiteLocation(),
            trip.getMaterialType(),
            trip.getQuantity(),
            trip.getTripCharges(),
            trip.getDistance(),
            trip.getStartTime(),
            trip.getEndTime(),
            trip.getStatus(),
            trip.getNotes(),
            trip.getCreatedAt()
        );
    }
}
