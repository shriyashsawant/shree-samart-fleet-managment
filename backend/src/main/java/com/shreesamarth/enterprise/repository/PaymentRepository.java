package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByVehicleId(Long vehicleId);
    List<Payment> findByDriverId(Long driverId);
    List<Payment> findByPaymentType(String paymentType);
    List<Payment> findByPaymentDateBetween(LocalDate start, LocalDate end);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentDate BETWEEN :start AND :end")
    BigDecimal sumByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.tenant.id = :tenantId AND p.paymentDate BETWEEN :start AND :end")
    BigDecimal sumByTenantIdAndDateBetween(@Param("tenantId") Long tenantId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentType = 'SALARY' AND p.paymentDate BETWEEN :start AND :end")
    BigDecimal sumSalaryByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.tenant.id = :tenantId AND p.paymentType = 'SALARY' AND p.paymentDate BETWEEN :start AND :end")
    BigDecimal sumSalaryByTenantIdAndDateBetween(@Param("tenantId") Long tenantId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentType = 'EMI' AND p.paymentDate BETWEEN :start AND :end")
    BigDecimal sumEmiByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.tenant.id = :tenantId AND p.paymentType = 'EMI' AND p.paymentDate BETWEEN :start AND :end")
    BigDecimal sumEmiByTenantIdAndDateBetween(@Param("tenantId") Long tenantId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    List<Payment> findByTenantId(Long tenantId);
}
