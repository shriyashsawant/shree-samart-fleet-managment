package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {
    List<Maintenance> findByVehicleId(Long vehicleId);
    List<Maintenance> findByVehicleIdAndDateBetween(Long vehicleId, LocalDate start, LocalDate end);
    List<Maintenance> findByNextDueDateBefore(LocalDate date);
    
    @Query("SELECT SUM(m.cost) FROM Maintenance m WHERE m.date BETWEEN :start AND :end")
    BigDecimal sumByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(m.cost) FROM Maintenance m WHERE m.tenant.id = :tenantId AND m.date BETWEEN :start AND :end")
    BigDecimal sumByTenantIdAndDateBetween(@Param("tenantId") Long tenantId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(m.cost) FROM Maintenance m WHERE m.vehicle.id = :vehicleId AND m.date BETWEEN :start AND :end")
    BigDecimal sumByVehicleAndDateBetween(@Param("vehicleId") Long vehicleId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    List<Maintenance> findByTenantId(Long tenantId);
}
