package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.entity.*;
import com.shreesamarth.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final ClientRepository clientRepository;
    private final BillRepository billRepository;

    public Trip createTrip(Trip trip, Long tenantId) {
        // Generate trip number
        String tripNumber = generateTripNumber(tenantId);
        trip.setTripNumber(tripNumber);
        
        // Set default status
        if (trip.getStatus() == null) {
            trip.setStatus("COMPLETED");
        }
        
        // Set default trip date
        if (trip.getTripDate() == null) {
            trip.setTripDate(LocalDate.now());
        }

        // Validate and set relationships
        if (trip.getVehicle() != null && trip.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(trip.getVehicle().getId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            trip.setVehicle(vehicle);
        }

        if (trip.getDriver() != null && trip.getDriver().getId() != null) {
            Driver driver = driverRepository.findById(trip.getDriver().getId())
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            trip.setDriver(driver);
        }

        if (trip.getClient() != null && trip.getClient().getId() != null) {
            Client client = clientRepository.findById(trip.getClient().getId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            trip.setClient(client);
        }

        // Link to bill if provided
        if (trip.getBill() != null && trip.getBill().getId() != null) {
            Bill bill = billRepository.findById(trip.getBill().getId())
                    .orElseThrow(() -> new RuntimeException("Bill not found"));
            trip.setBill(bill);
        }

        // Set tenant
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        trip.setTenant(tenant);

        return tripRepository.save(trip);
    }

    public List<Trip> getAllTrips(Long tenantId) {
        return tripRepository.findByTenantId(tenantId);
    }

    public Trip getTripById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
    }

    public List<Trip> getTripsByVehicle(Long vehicleId) {
        return tripRepository.findByVehicleId(vehicleId);
    }

    public List<Trip> getTripsByDriver(Long driverId) {
        return tripRepository.findByDriverId(driverId);
    }

    public List<Trip> getTripsByClient(Long clientId) {
        return tripRepository.findByClientId(clientId);
    }

    public Trip updateTrip(Long id, Trip tripDetails) {
        Trip trip = getTripById(id);
        
        trip.setTripDate(tripDetails.getTripDate());
        trip.setSiteLocation(tripDetails.getSiteLocation());
        trip.setMaterialType(tripDetails.getMaterialType());
        trip.setQuantity(tripDetails.getQuantity());
        trip.setTripCharges(tripDetails.getTripCharges());
        trip.setDistance(tripDetails.getDistance());
        trip.setStartTime(tripDetails.getStartTime());
        trip.setEndTime(tripDetails.getEndTime());
        trip.setStatus(tripDetails.getStatus());
        trip.setNotes(tripDetails.getNotes());

        return tripRepository.save(trip);
    }

    public void deleteTrip(Long id) {
        Trip trip = getTripById(id);
        tripRepository.delete(trip);
    }

    private String generateTripNumber(Long tenantId) {
        String prefix = "TRP";
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        Random random = new Random();
        int number = 1000 + random.nextInt(9000);
        return prefix + datePart + number;
    }
}
