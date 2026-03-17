package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.VehicleTelematics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleTelematicsRepository extends JpaRepository<VehicleTelematics, Long> {
    List<VehicleTelematics> findByVehicleId(Long vehicleId);
    List<VehicleTelematics> findByTenantId(Long tenantId);
    Optional<VehicleTelematics> findFirstByVehicleIdOrderByCreatedAtDesc(Long vehicleId);
}
