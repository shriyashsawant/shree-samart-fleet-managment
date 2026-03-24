package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.DriverAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DriverAttendanceRepository extends JpaRepository<DriverAttendance, Long> {
    List<DriverAttendance> findByDriverId(Long driverId);
    List<DriverAttendance> findByDate(LocalDate date);
    Optional<DriverAttendance> findByDriverIdAndDate(Long driverId, LocalDate date);
    List<DriverAttendance> findByDriverIdAndDateBetween(Long driverId, LocalDate startDate, LocalDate endDate);
    List<DriverAttendance> findByTenantId(Long tenantId);
    List<DriverAttendance> findByTenantIdAndDate(Long tenantId, LocalDate date);
    List<DriverAttendance> findByTenantIdAndDriverId(Long tenantId, Long driverId);
    List<DriverAttendance> findByTenantIdAndDriverIdAndDateBetween(Long tenantId, Long driverId, LocalDate startDate, LocalDate endDate);
}
