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
}
