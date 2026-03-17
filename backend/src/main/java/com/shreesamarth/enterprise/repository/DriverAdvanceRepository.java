package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.DriverAdvance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverAdvanceRepository extends JpaRepository<DriverAdvance, Long> {
    List<DriverAdvance> findByDriverId(Long driverId);
    List<DriverAdvance> findByIsSettled(Boolean isSettled);
}
