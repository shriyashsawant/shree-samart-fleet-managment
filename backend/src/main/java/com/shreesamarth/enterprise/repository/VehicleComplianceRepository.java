package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.VehicleCompliance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleComplianceRepository extends JpaRepository<VehicleCompliance, Long> {
    List<VehicleCompliance> findByVehicleId(Long vehicleId);
    List<VehicleCompliance> findByTenantId(Long tenantId);
}
