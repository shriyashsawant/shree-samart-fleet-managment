package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByVehicleNumber(String vehicleNumber);
    boolean existsByVehicleNumber(String vehicleNumber);
    List<Vehicle> findByTenantId(Long tenantId);
}
