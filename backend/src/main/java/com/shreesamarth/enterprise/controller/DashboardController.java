package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.dto.DashboardDTO;
import com.shreesamarth.enterprise.entity.Reminder;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    private final UserRepository userRepository;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsernameWithTenant(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public ResponseEntity<DashboardDTO> getDashboardStats(Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        System.out.println("📊 [DASHBOARD] Fetching dashboard stats...");

        YearMonth currentMonth = YearMonth.now();
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();

        long totalVehicles;
        long activeDrivers;
        BigDecimal monthlyRevenue = BigDecimal.ZERO;
        BigDecimal monthlyExpenses = BigDecimal.ZERO;
        BigDecimal maintenanceCost = BigDecimal.ZERO;
        BigDecimal salaries = BigDecimal.ZERO;
        BigDecimal emiPayments = BigDecimal.ZERO;

        if (tenant != null) {
            totalVehicles = vehicleRepository.findByTenantId(tenant.getId()).size();
            activeDrivers = driverRepository.findByTenantIdAndStatus(tenant.getId(), "ACTIVE").size();
            monthlyRevenue = billRepository.sumByTenantIdAndDateBetween(tenant.getId(), startOfMonth, endOfMonth);
            monthlyExpenses = expenseRepository.sumByTenantIdAndDateBetween(tenant.getId(), startOfMonth, endOfMonth);
            maintenanceCost = maintenanceRepository.sumByTenantIdAndDateBetween(tenant.getId(), startOfMonth, endOfMonth);
            salaries = paymentRepository.sumSalaryByTenantIdAndDateBetween(tenant.getId(), startOfMonth, endOfMonth);
            emiPayments = paymentRepository.sumEmiByTenantIdAndDateBetween(tenant.getId(), startOfMonth, endOfMonth);
        } else {
            totalVehicles = vehicleRepository.count();
            activeDrivers = driverRepository.findByStatus("ACTIVE").size();
            monthlyRevenue = billRepository.sumByDateBetween(startOfMonth, endOfMonth);
            monthlyExpenses = expenseRepository.sumByDateBetween(startOfMonth, endOfMonth);
            maintenanceCost = maintenanceRepository.sumByDateBetween(startOfMonth, endOfMonth);
            salaries = paymentRepository.sumSalaryByDateBetween(startOfMonth, endOfMonth);
            emiPayments = paymentRepository.sumEmiByDateBetween(startOfMonth, endOfMonth);
        }

        if (monthlyRevenue == null) monthlyRevenue = BigDecimal.ZERO;
        if (monthlyExpenses == null) monthlyExpenses = BigDecimal.ZERO;
        if (maintenanceCost == null) maintenanceCost = BigDecimal.ZERO;
        if (salaries == null) salaries = BigDecimal.ZERO;
        if (emiPayments == null) emiPayments = BigDecimal.ZERO;

        BigDecimal totalExpenses = monthlyExpenses.add(maintenanceCost).add(salaries).add(emiPayments);
        BigDecimal profit = monthlyRevenue.subtract(totalExpenses);

        LocalDate today = LocalDate.now();
        LocalDate next30Days = today.plusDays(30);
        List<Reminder> upcomingReminders;
        
        if (tenant != null) {
            upcomingReminders = reminderRepository.findByTenantIdAndExpiryDateBeforeAndStatus(tenant.getId(), next30Days, "PENDING");
        } else {
            upcomingReminders = reminderRepository.findByExpiryDateBeforeAndStatus(next30Days, "PENDING");
        }

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

        List<Map<String, Object>> vehiclePerformance = new ArrayList<>();
        List<com.shreesamarth.enterprise.entity.Vehicle> vehicles = tenant != null
            ? vehicleRepository.findByTenantId(tenant.getId())
            : vehicleRepository.findAll();

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

    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debugDatabase() {
        Map<String, Object> debug = new HashMap<>();
        debug.put("vehicles", vehicleRepository.count());
        debug.put("drivers", driverRepository.count());
        debug.put("bills", billRepository.count());
        debug.put("expenses", expenseRepository.count());
        debug.put("reminders", reminderRepository.count());
        return ResponseEntity.ok(debug);
    }
}
