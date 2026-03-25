package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.entity.*;
import com.shreesamarth.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutomationService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final ExpenseRepository expenseRepository;
    private final PaymentRepository paymentRepository;
    private final TenantRepository tenantRepository;

    /**
     * Runs on the 1st of every month at 1:00 AM.
     * Generates EMI expenses for vehicles and Salary payments for drivers.
     */
    @Scheduled(cron = "0 0 1 1 * ?")
    @Transactional
    public void runMonthlyAutomations() {
        log.info("Starting monthly automation tasks for EMI and Salaries...");
        LocalDate today = LocalDate.now();
        LocalDate lastMonthStart = today.minusMonths(1).withDayOfMonth(1);
        LocalDate lastMonthEnd = today.minusMonths(1).withDayOfMonth(today.minusMonths(1).lengthOfMonth());
        String monthLabel = lastMonthStart.format(DateTimeFormatter.ofPattern("MMM yyyy"));

        // 1. Process EMIs (Recurring Expenses)
        List<Vehicle> vehiclesWithEmi = vehicleRepository.findAll().stream()
                .filter(v -> v.getEmiAmount() != null && v.getEmiAmount().compareTo(BigDecimal.ZERO) > 0)
                .filter(v -> v.getEmiStartDate() != null && !today.isBefore(v.getEmiStartDate()))
                .filter(v -> v.getEmiEndDate() == null || !today.isAfter(v.getEmiEndDate()))
                .toList();

        for (Vehicle vehicle : vehiclesWithEmi) {
            generateEmiExpense(vehicle, today, monthLabel);
        }

        // 2. Process Salaries (Recurring Payments)
        List<Driver> activeDrivers = driverRepository.findAll().stream()
                .filter(d -> "ACTIVE".equalsIgnoreCase(d.getStatus()))
                .filter(d -> d.getSalary() != null && d.getSalary().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        for (Driver driver : activeDrivers) {
            generateCalculatedSalary(driver, today, lastMonthStart, lastMonthEnd, monthLabel);
        }

        log.info("Monthly automations completed.");
    }

    private final DriverAttendanceRepository attendanceRepository;
    private final DriverAdvanceRepository advanceRepository;

    private void generateCalculatedSalary(Driver driver, LocalDate today, LocalDate start, LocalDate end, String monthLabel) {
        // Prevent duplicates
        boolean exists = paymentRepository.findAll().stream()
                .filter(p -> p.getDriver() != null && p.getDriver().getId().equals(driver.getId()))
                .filter(p -> "SALARY".equalsIgnoreCase(p.getPaymentType()))
                .anyMatch(p -> p.getPaymentMonth().equalsIgnoreCase(monthLabel));

        if (exists) return;

        // Calculate attendance factor
        List<DriverAttendance> logs = attendanceRepository.findByDriverIdAndDateBetween(driver.getId(), start, end);
        BigDecimal payableSalary = driver.getSalary();
        
        if (!logs.isEmpty()) {
            double totalDays = start.lengthOfMonth();
            double presentDays = logs.stream().filter(l -> "PRESENT".equalsIgnoreCase(l.getStatus())).count();
            double halfDays = logs.stream().filter(l -> "HALF_DAY".equalsIgnoreCase(l.getStatus())).count();
            
            double attendanceWeight = (presentDays + (halfDays * 0.5)) / totalDays;
            payableSalary = driver.getSalary().multiply(BigDecimal.valueOf(attendanceWeight)).setScale(2, java.math.RoundingMode.HALF_UP);
        }

        Payment salary = new Payment();
        salary.setDriver(driver);
        salary.setTenant(driver.getTenant());
        salary.setPaymentType("SALARY");
        salary.setAmount(payableSalary);
        salary.setPaymentDate(today);
        salary.setPaymentMonth(monthLabel);
        salary.setPaymentMethod("AUTO_CALC");
        salary.setStatus("PENDING");
        salary.setNotes("Salary calculated for " + monthLabel + " based on attendance. Base: " + driver.getSalary());

        paymentRepository.save(salary);
    }

    private void generateEmiExpense(Vehicle vehicle, LocalDate date, String monthLabel) {
        boolean exists = expenseRepository.findAll().stream()
                .filter(e -> e.getVehicle().getId().equals(vehicle.getId()))
                .filter(e -> "EMI".equalsIgnoreCase(e.getExpenseType()))
                .anyMatch(e -> e.getNotes() != null && e.getNotes().contains(monthLabel));

        if (exists) return;

        Expense emi = new Expense();
        emi.setVehicle(vehicle);
        emi.setTenant(vehicle.getTenant());
        emi.setCategory("MAINTENANCE");
        emi.setExpenseType("EMI");
        emi.setAmount(vehicle.getEmiAmount());
        emi.setDate(date);
        emi.setNotes("EMI for " + monthLabel + ". Bank: " + (vehicle.getEmiBank() != null ? vehicle.getEmiBank() : "N/A"));
        
        expenseRepository.save(emi);
    }
}
