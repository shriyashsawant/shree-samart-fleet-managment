package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    List<Driver> findByAssignedVehicle_Id(Long vehicleId);
    List<Driver> findByStatus(String status);
    List<Driver> findByAssignedVehicle_IdAndStatus(Long vehicleId, String status);
    boolean existsByName(String name);
    java.util.Optional<Driver> findByName(String name);
    java.util.Optional<Driver> findByDrivingLicense(String drivingLicense);
    List<Driver> findByTenantId(Long tenantId);
    List<Driver> findByTenantIdAndStatus(Long tenantId, String status);
}
