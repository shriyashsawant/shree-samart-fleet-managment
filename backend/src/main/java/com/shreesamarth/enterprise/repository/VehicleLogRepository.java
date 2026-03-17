package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.VehicleLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleLogRepository extends JpaRepository<VehicleLog, Long> {
    List<VehicleLog> findByVehicleIdOrderByLogDateDesc(Long vehicleId);
    List<VehicleLog> findByVehicleIdAndLogTypeOrderByLogDateDesc(Long vehicleId, String logType);
}
