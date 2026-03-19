package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByVehicleId(Long vehicleId);
    List<Expense> findByVehicleIdAndDateBetween(Long vehicleId, LocalDate start, LocalDate end);
    List<Expense> findByExpenseType(String expenseType);
    List<Expense> findByCategory(String category);
    List<Expense> findByCategoryAndDateBetween(String category, LocalDate start, LocalDate end);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.date BETWEEN :start AND :end")
    BigDecimal sumByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.vehicle.id = :vehicleId AND e.date BETWEEN :start AND :end")
    BigDecimal sumByVehicleAndDateBetween(@Param("vehicleId") Long vehicleId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.category = :category AND e.date BETWEEN :start AND :end")
    BigDecimal sumByCategoryAndDateBetween(@Param("category") String category, @Param("start") LocalDate start, @Param("end") LocalDate end);
}
