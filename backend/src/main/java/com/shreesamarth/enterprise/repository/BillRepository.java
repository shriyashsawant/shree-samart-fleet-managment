package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByClientId(Long clientId);
    List<Bill> findByVehicleId(Long vehicleId);
    List<Bill> findByBillDateBetween(LocalDate start, LocalDate end);
    Optional<Bill> findTopByOrderByBillNoDesc();
    
    @Query("SELECT SUM(b.totalAmount) FROM Bill b WHERE b.billDate BETWEEN :start AND :end")
    BigDecimal sumByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(b.totalAmount) FROM Bill b WHERE b.tenant.id = :tenantId AND b.billDate BETWEEN :start AND :end")
    BigDecimal sumByTenantIdAndDateBetween(@Param("tenantId") Long tenantId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(b.totalAmount) FROM Bill b WHERE b.vehicle.id = :vehicleId AND b.billDate BETWEEN :start AND :end")
    BigDecimal sumByVehicleAndDateBetween(@Param("vehicleId") Long vehicleId, @Param("start") LocalDate start, @Param("end") LocalDate end);
    
    // Duplicate bill detection
    Optional<Bill> findByBillNoAndClientId(String billNo, Long clientId);
    
    @Query("SELECT b FROM Bill b WHERE b.client.id = :clientId AND b.basicAmount = :amount AND YEAR(b.billDate) = :year AND MONTH(b.billDate) = :month")
    List<Bill> findPotentialDuplicates(@Param("clientId") Long clientId, @Param("amount") BigDecimal amount, @Param("year") int year, @Param("month") int month);
}
