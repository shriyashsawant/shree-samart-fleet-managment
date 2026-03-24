package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.dto.TripRequest;
import com.shreesamarth.enterprise.entity.*;
import com.shreesamarth.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        // Validate and set relationships using object or transient ID fields
        if (trip.getVehicle() != null && trip.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(trip.getVehicle().getId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            trip.setVehicle(vehicle);
        } else if (trip.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(trip.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            trip.setVehicle(vehicle);
        }

        if (trip.getDriver() != null && trip.getDriver().getId() != null) {
            Driver driver = driverRepository.findById(trip.getDriver().getId())
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            trip.setDriver(driver);
        } else if (trip.getDriverId() != null) {
            Driver driver = driverRepository.findById(trip.getDriverId())
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            trip.setDriver(driver);
        }

        if (trip.getClient() != null && trip.getClient().getId() != null) {
            Client client = clientRepository.findById(trip.getClient().getId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            trip.setClient(client);
        } else if (trip.getClientId() != null) {
            Client client = clientRepository.findById(trip.getClientId())
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

    public Trip createTripFromRequest(TripRequest request, Long tenantId) {
        Trip trip = new Trip();
        
        // Generate trip number
        String tripNumber = generateTripNumber(tenantId);
        trip.setTripNumber(tripNumber);
        
        // Set default status
        if (request.getStatus() == null || request.getStatus().isEmpty()) {
            trip.setStatus("COMPLETED");
        } else {
            trip.setStatus(request.getStatus());
        }
        
        // Set default trip date
        if (request.getTripDate() == null) {
            trip.setTripDate(LocalDate.now());
        } else {
            trip.setTripDate(request.getTripDate());
        }
        
        // Set other fields
        trip.setSiteLocation(request.getSiteLocation());
        trip.setMaterialType(request.getMaterialType());
        trip.setQuantity(request.getQuantity());
        trip.setTripCharges(request.getTripCharges());
        trip.setDistance(request.getDistance());
        trip.setStartTime(request.getStartTime());
        trip.setEndTime(request.getEndTime());
        trip.setNotes(request.getNotes());
        
        // Load and set relationships
        if (request.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            trip.setVehicle(vehicle);
        }
        
        if (request.getDriverId() != null) {
            Driver driver = driverRepository.findById(request.getDriverId())
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            trip.setDriver(driver);
        }
        
        if (request.getClientId() != null) {
            Client client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            trip.setClient(client);
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

    @Transactional
    public Trip updateTripEntity(Trip trip) {
        return tripRepository.save(trip);
    }

    private String generateTripNumber(Long tenantId) {
        int year = LocalDate.now().getYear();
        long count = tripRepository.countByTenantIdAndTripNumberStartingWith(tenantId, "TR-" + year);
        return String.format("TR-%d-%04d", year, count + 1);
    }
}
