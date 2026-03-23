package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByVehicleId(Long vehicleId);
    List<Trip> findByDriverId(Long driverId);
    List<Trip> findByClientId(Long clientId);
    List<Trip> findByTenantId(Long tenantId);
    Optional<Trip> findByTripNumber(String tripNumber);
    List<Trip> findByVehicleIdAndTripDateBetween(Long vehicleId, java.time.LocalDate start, java.time.LocalDate end);
    long countByTenantIdAndTripNumberStartingWith(Long tenantId, String prefix);
}
