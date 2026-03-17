package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Tyre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TyreRepository extends JpaRepository<Tyre, Long> {
    List<Tyre> findByVehicleId(Long vehicleId);
    List<Tyre> findByStatus(String status);
}
