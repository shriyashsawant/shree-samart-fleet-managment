package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.dto.DashboardDTO;
import com.shreesamarth.enterprise.entity.Driver;
import com.shreesamarth.enterprise.entity.Reminder;
import com.shreesamarth.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final BillRepository billRepository;
    private final ExpenseRepository expenseRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final PaymentRepository paymentRepository;
    private final ReminderRepository reminderRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardDTO> getDashboardStats() {
        System.out.println("📊 [DASHBOARD] Fetching dashboard stats...");
        
        // Get current month date range
        YearMonth currentMonth = YearMonth.now();
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();
        
        // Total vehicles
        long totalVehicles = vehicleRepository.count();
        System.out.println("📊 [DASHBOARD] Total vehicles: " + totalVehicles);
        
        // Active drivers
        long activeDrivers = driverRepository.findByStatus("ACTIVE").size();
        System.out.println("📊 [DASHBOARD] Active drivers: " + activeDrivers);
        
        // Monthly revenue (from bills)
        BigDecimal monthlyRevenue = billRepository.sumByDateBetween(startOfMonth, endOfMonth);
        if (monthlyRevenue == null) monthlyRevenue = BigDecimal.ZERO;
        
        // Monthly expenses (from expenses and maintenance)
        BigDecimal monthlyExpenses = expenseRepository.sumByDateBetween(startOfMonth, endOfMonth);
        if (monthlyExpenses == null) monthlyExpenses = BigDecimal.ZERO;
        
        BigDecimal maintenanceCost = maintenanceRepository.sumByDateBetween(startOfMonth, endOfMonth);
        if (maintenanceCost == null) maintenanceCost = BigDecimal.ZERO;
        
        BigDecimal salaries = paymentRepository.sumSalaryByDateBetween(startOfMonth, endOfMonth);
        if (salaries == null) salaries = BigDecimal.ZERO;
        
        BigDecimal emiPayments = paymentRepository.sumEmiByDateBetween(startOfMonth, endOfMonth);
        if (emiPayments == null) emiPayments = BigDecimal.ZERO;
        
        BigDecimal totalExpenses = monthlyExpenses.add(maintenanceCost).add(salaries).add(emiPayments);
        
        // Profit
        BigDecimal profit = monthlyRevenue.subtract(totalExpenses);
        
        // Upcoming reminders (next 30 days)
        LocalDate today = LocalDate.now();
        LocalDate next30Days = today.plusDays(30);
        List<Reminder> upcomingReminders = reminderRepository.findByExpiryDateBeforeAndStatus(next30Days, "PENDING");
        
        List<Map<String, Object>> remindersList = new ArrayList<>();
        for (Reminder r : upcomingReminders) {
            Map<String, Object> reminder = new HashMap<>();
            reminder.put("id", r.getId());
            reminder.put("title", r.getTitle());
            reminder.put("type", r.getReminderType());
            reminder.put("expiryDate", r.getExpiryDate());
            reminder.put("daysRemaining", java.time.temporal.ChronoUnit.DAYS.between(today, r.getExpiryDate()));
            remindersList.add(reminder);
        }
        
        // Vehicle performance
        List<Map<String, Object>> vehiclePerformance = new ArrayList<>();
        List<com.shreesamarth.enterprise.entity.Vehicle> vehicles = vehicleRepository.findAll();
        for (com.shreesamarth.enterprise.entity.Vehicle v : vehicles) {
            Map<String, Object> perf = new HashMap<>();
            perf.put("id", v.getId());
            perf.put("vehicleNumber", v.getVehicleNumber());
            
            BigDecimal revenue = billRepository.sumByVehicleAndDateBetween(v.getId(), startOfMonth, endOfMonth);
            if (revenue == null) revenue = BigDecimal.ZERO;
            
            BigDecimal expenses = expenseRepository.sumByVehicleAndDateBetween(v.getId(), startOfMonth, endOfMonth);
            if (expenses == null) expenses = BigDecimal.ZERO;
            
            BigDecimal maint = maintenanceRepository.sumByVehicleAndDateBetween(v.getId(), startOfMonth, endOfMonth);
            if (maint == null) maint = BigDecimal.ZERO;
            
            perf.put("revenue", revenue);
            perf.put("expenses", expenses.add(maint));
            perf.put("profit", revenue.subtract(expenses.add(maint)));
            
            vehiclePerformance.add(perf);
        }
        
        DashboardDTO dashboard = new DashboardDTO();
        dashboard.setTotalVehicles(totalVehicles);
        dashboard.setActiveDrivers(activeDrivers);
        dashboard.setMonthlyRevenue(monthlyRevenue);
        dashboard.setMonthlyExpenses(totalExpenses);
        dashboard.setProfit(profit);
        dashboard.setUpcomingReminders(remindersList);
        dashboard.setVehiclePerformance(vehiclePerformance);
        
        return ResponseEntity.ok(dashboard);
    }
}
