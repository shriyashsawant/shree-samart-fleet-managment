package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.dto.*;
import com.shreesamarth.enterprise.entity.*;
import com.shreesamarth.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final VehicleRepository vehicleRepository;
    private final BillRepository billRepository;
    private final ExpenseRepository expenseRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final PaymentRepository paymentRepository;
    private final ClientRepository clientRepository;
    private final VehicleDocumentRepository vehicleDocumentRepository;

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("MMM");

    // Vehicle P&L Report - Revenue - Expenses = Profit per mixer
    public List<VehicleProfitDTO> getVehicleProfitReport(Long tenantId) {
        List<Vehicle> vehicles = vehicleRepository.findByTenantId(tenantId);
        List<VehicleProfitDTO> profits = new ArrayList<>();

        for (Vehicle vehicle : vehicles) {
            BigDecimal totalRevenue = getVehicleRevenue(vehicle.getId());
            BigDecimal totalExpenses = getVehicleExpenses(vehicle.getId());
            BigDecimal profit = totalRevenue.subtract(totalExpenses);
            
            BigDecimal profitMargin = BigDecimal.ZERO;
            if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
                profitMargin = profit.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);
            }

            VehicleProfitDTO dto = new VehicleProfitDTO(
                vehicle.getId(),
                vehicle.getVehicleNumber(),
                vehicle.getModel(),
                totalRevenue,
                totalExpenses,
                profit,
                profitMargin
            );
            profits.add(dto);
        }

        // Sort by profit descending
        profits.sort((a, b) -> b.getProfit().compareTo(a.getProfit()));
        return profits;
    }

    // Get total revenue for a vehicle (from bills)
    private BigDecimal getVehicleRevenue(Long vehicleId) {
        List<Bill> bills = billRepository.findAll().stream()
                .filter(b -> b.getVehicle() != null && b.getVehicle().getId().equals(vehicleId))
                .collect(Collectors.toList());
        
        return bills.stream()
                .map(Bill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Get total expenses for a vehicle (expenses + maintenance + payments)
    private BigDecimal getVehicleExpenses(Long vehicleId) {
        BigDecimal expenses = expenseRepository.findAll().stream()
                .filter(e -> e.getVehicle() != null && e.getVehicle().getId().equals(vehicleId))
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal maintenance = maintenanceRepository.findAll().stream()
                .filter(m -> m.getVehicle() != null && m.getVehicle().getId().equals(vehicleId))
                .map(Maintenance::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Also include driver salary payments
        BigDecimal salaries = paymentRepository.findAll().stream()
                .filter(p -> "SALARY".equals(p.getPaymentType()))
                .filter(p -> p.getDriver() != null && p.getDriver().getAssignedVehicle() != null)
                .filter(p -> p.getDriver().getAssignedVehicle().getId().equals(vehicleId))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return expenses.add(maintenance).add(salaries);
    }

    // Monthly Profit Trend
    public List<MonthlyProfitDTO> getMonthlyProfitTrend(Long tenantId, int months) {
        LocalDate now = LocalDate.now();
        List<MonthlyProfitDTO> trends = new ArrayList<>();

        for (int i = months - 1; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);

            BigDecimal revenue = billRepository.findAll().stream()
                    .filter(b -> {
                        LocalDate billDate = b.getBillDate();
                        return billDate != null && !billDate.isBefore(monthStart) && !billDate.isAfter(monthEnd);
                    })
                    .map(Bill::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal expenses = expenseRepository.findAll().stream()
                    .filter(e -> {
                        LocalDate expDate = e.getDate();
                        return expDate != null && !expDate.isBefore(monthStart) && !expDate.isAfter(monthEnd);
                    })
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal maintenance = maintenanceRepository.findAll().stream()
                    .filter(m -> {
                        LocalDate mDate = m.getDate();
                        return mDate != null && !mDate.isBefore(monthStart) && !mDate.isAfter(monthEnd);
                    })
                    .map(Maintenance::getCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal salary = paymentRepository.findAll().stream()
                    .filter(p -> "SALARY".equals(p.getPaymentType()))
                    .filter(p -> p.getPaymentDate() != null)
                    .filter(p -> !p.getPaymentDate().isBefore(monthStart) && !p.getPaymentDate().isAfter(monthEnd))
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalExpenses = expenses.add(maintenance).add(salary);
            BigDecimal profit = revenue.subtract(totalExpenses);

            Long billCount = billRepository.findAll().stream()
                    .filter(b -> {
                        LocalDate billDate = b.getBillDate();
                        return billDate != null && !billDate.isBefore(monthStart) && !billDate.isAfter(monthEnd);
                    })
                    .count();

            MonthlyProfitDTO dto = new MonthlyProfitDTO(
                monthStart.format(MONTH_FORMAT),
                monthStart.getYear(),
                revenue,
                totalExpenses,
                profit,
                billCount,
                0L
            );
            trends.add(dto);
        }

        return trends;
    }

    // Expense Breakdown - Diesel vs Salary vs Maintenance
    public List<ExpenseBreakdownDTO> getExpenseBreakdown(Long tenantId) {
        BigDecimal totalExpenses = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryTotals = new LinkedHashMap<>();

        // Diesel expenses
        BigDecimal diesel = expenseRepository.findAll().stream()
                .filter(e -> "DIESEL".equalsIgnoreCase(e.getExpenseType()))
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        categoryTotals.put("Diesel", diesel);
        totalExpenses = totalExpenses.add(diesel);

        // Other daily expenses (Air, Puncture, Washing, Food)
        BigDecimal dailyExp = expenseRepository.findAll().stream()
                .filter(e -> !"DIESEL".equalsIgnoreCase(e.getExpenseType()))
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        categoryTotals.put("Daily Expenses", dailyExp);
        totalExpenses = totalExpenses.add(dailyExp);

        // Maintenance
        BigDecimal maintenance = maintenanceRepository.findAll().stream()
                .map(Maintenance::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        categoryTotals.put("Maintenance", maintenance);
        totalExpenses = totalExpenses.add(maintenance);

        // Driver Salary
        BigDecimal salary = paymentRepository.findAll().stream()
                .filter(p -> "SALARY".equals(p.getPaymentType()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        categoryTotals.put("Driver Salary", salary);
        totalExpenses = totalExpenses.add(salary);

        // EMI Payments
        BigDecimal emi = paymentRepository.findAll().stream()
                .filter(p -> "EMI".equals(p.getPaymentType()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        categoryTotals.put("Vehicle EMI", emi);
        totalExpenses = totalExpenses.add(emi);

        List<ExpenseBreakdownDTO> breakdown = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : categoryTotals.entrySet()) {
            BigDecimal percentage = BigDecimal.ZERO;
            if (totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
                percentage = entry.getValue().divide(totalExpenses, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);
            }
            breakdown.add(new ExpenseBreakdownDTO(
                entry.getKey(),
                entry.getValue(),
                0L,
                percentage
            ));
        }

        // Sort by amount descending
        breakdown.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));
        return breakdown;
    }

    // GST Summary Report - Monthly CGST/SGST totals
    public List<GstSummaryDTO> getGstSummary(Long tenantId, int months) {
        LocalDate now = LocalDate.now();
        List<GstSummaryDTO> summaries = new ArrayList<>();

        for (int i = months - 1; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);

            List<Bill> monthBills = billRepository.findAll().stream()
                    .filter(b -> {
                        LocalDate billDate = b.getBillDate();
                        return billDate != null && !billDate.isBefore(monthStart) && !billDate.isAfter(monthEnd);
                    })
                    .collect(Collectors.toList());

            BigDecimal basicAmount = monthBills.stream()
                    .map(Bill::getBasicAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal cgstAmount = monthBills.stream()
                    .map(Bill::getCgstAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal sgstAmount = monthBills.stream()
                    .map(Bill::getSgstAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal igstAmount = BigDecimal.ZERO;

            BigDecimal totalGst = cgstAmount.add(sgstAmount).add(igstAmount);
            BigDecimal totalAmount = basicAmount.add(totalGst);

            GstSummaryDTO dto = new GstSummaryDTO(
                monthStart.format(MONTH_FORMAT),
                monthStart.getYear(),
                basicAmount,
                cgstAmount,
                sgstAmount,
                igstAmount,
                totalGst,
                totalAmount,
                (long) monthBills.size()
            );
            summaries.add(dto);
        }

        return summaries;
    }

    // Party Wise Revenue - Which client gives most business
    public List<PartyRevenueDTO> getPartyWiseRevenue(Long tenantId) {
        List<Client> clients = clientRepository.findByTenantId(tenantId);
        List<PartyRevenueDTO> revenues = new ArrayList<>();

        BigDecimal totalRevenue = billRepository.findAll().stream()
                .map(Bill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        for (Client client : clients) {
            BigDecimal clientRevenue = billRepository.findAll().stream()
                    .filter(b -> b.getClient() != null && b.getClient().getId().equals(client.getId()))
                    .map(Bill::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (clientRevenue.compareTo(BigDecimal.ZERO) > 0) {
                Long billCount = billRepository.findAll().stream()
                        .filter(b -> b.getClient() != null && b.getClient().getId().equals(client.getId()))
                        .count();

                BigDecimal percentage = BigDecimal.ZERO;
                if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
                    percentage = clientRevenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .setScale(2, RoundingMode.HALF_UP);
                }

                PartyRevenueDTO dto = new PartyRevenueDTO(
                    client.getId(),
                    client.getPartyName(),
                    client.getGstNumber(),
                    clientRevenue,
                    billCount,
                    percentage
                );
                revenues.add(dto);
            }
        }

        // Sort by revenue descending
        revenues.sort((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()));
        return revenues;
    }

    // Idle Cost Alert - Flag vehicles with high expense, low revenue
    public List<IdleVehicleAlertDTO> getIdleVehicleAlerts(Long tenantId) {
        List<Vehicle> vehicles = vehicleRepository.findByTenantId(tenantId);
        List<IdleVehicleAlertDTO> alerts = new ArrayList<>();

        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);

        for (Vehicle vehicle : vehicles) {
            BigDecimal totalExpenses = getVehicleExpenses(vehicle.getId());
            BigDecimal totalRevenue = getVehicleRevenue(vehicle.getId());
            BigDecimal profitLoss = totalRevenue.subtract(totalExpenses);

            // Check if vehicle has low revenue compared to expenses
            // If expenses > 70% of revenue, flag as potential idle
            boolean hasLowRevenue = totalRevenue.compareTo(BigDecimal.ZERO) == 0 || 
                    totalExpenses.divide(totalRevenue, 2, RoundingMode.HALF_UP).compareTo(BigDecimal.valueOf(0.7)) > 0;

            String alertReason = null;
            String severity = null;

            if (totalRevenue.compareTo(BigDecimal.ZERO) == 0 && totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
                alertReason = "No revenue generated in last 30 days but expenses recorded";
                severity = "HIGH";
            } else if (hasLowRevenue) {
                alertReason = "Expenses exceed 70% of revenue - potential underutilization";
                severity = "MEDIUM";
            }

            if (alertReason != null) {
                alerts.add(new IdleVehicleAlertDTO(
                    vehicle.getId(),
                    vehicle.getVehicleNumber(),
                    vehicle.getModel(),
                    totalExpenses,
                    totalRevenue,
                    profitLoss,
                    0,
                    alertReason,
                    severity
                ));
            }
        }

        // Sort by severity
        alerts.sort((a, b) -> {
            int severityOrder = compareSeverity(a.getSeverity(), b.getSeverity());
            if (severityOrder != 0) return severityOrder;
            return b.getTotalExpenses().compareTo(a.getTotalExpenses());
        });

        return alerts;
    }

    // Get vehicle P&L for a specific month: /vehicles/{id}/profit?month=2025-03
    public VehicleProfitDTO getVehicleProfitByMonth(Long vehicleId, String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Revenue - from bills linked to this vehicle for the month
        BigDecimal revenue = billRepository.findAll().stream()
                .filter(b -> b.getVehicle() != null && b.getVehicle().getId().equals(vehicleId))
                .filter(b -> {
                    LocalDate billDate = b.getBillDate();
                    return billDate != null && !billDate.isBefore(monthStart) && !billDate.isAfter(monthEnd);
                })
                .map(Bill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Diesel expenses for the month
        BigDecimal dieselExpenses = expenseRepository.findAll().stream()
                .filter(e -> e.getVehicle() != null && e.getVehicle().getId().equals(vehicleId))
                .filter(e -> "DIESEL".equalsIgnoreCase(e.getExpenseType()))
                .filter(e -> {
                    LocalDate expDate = e.getDate();
                    return expDate != null && !expDate.isBefore(monthStart) && !expDate.isAfter(monthEnd);
                })
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Salary expenses for the month
        BigDecimal salaryExpenses = paymentRepository.findAll().stream()
                .filter(p -> "SALARY".equals(p.getPaymentType()))
                .filter(p -> p.getDriver() != null && p.getDriver().getAssignedVehicle() != null)
                .filter(p -> p.getDriver().getAssignedVehicle().getId().equals(vehicleId))
                .filter(p -> p.getPaymentDate() != null)
                .filter(p -> !p.getPaymentDate().isBefore(monthStart) && !p.getPaymentDate().isAfter(monthEnd))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Maintenance expenses for the month
        BigDecimal maintenanceExpenses = maintenanceRepository.findAll().stream()
                .filter(m -> m.getVehicle() != null && m.getVehicle().getId().equals(vehicleId))
                .filter(m -> m.getDate() != null)
                .filter(m -> !m.getDate().isBefore(monthStart) && !m.getDate().isAfter(monthEnd))
                .map(Maintenance::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // EMI expenses for the month
        BigDecimal emiExpenses = paymentRepository.findAll().stream()
                .filter(p -> "EMI".equals(p.getPaymentType()))
                .filter(p -> p.getPaymentDate() != null)
                .filter(p -> !p.getPaymentDate().isBefore(monthStart) && !p.getPaymentDate().isAfter(monthEnd))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Total expenses
        BigDecimal totalExpenses = dieselExpenses.add(salaryExpenses).add(maintenanceExpenses).add(emiExpenses);

        // Profit
        BigDecimal profit = revenue.subtract(totalExpenses);

        // Profit margin
        BigDecimal profitMargin = BigDecimal.ZERO;
        if (revenue.compareTo(BigDecimal.ZERO) > 0) {
            profitMargin = profit.divide(revenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return new VehicleProfitDTO(
                vehicle.getId(),
                vehicle.getVehicleNumber(),
                vehicle.getModel(),
                revenue,
                totalExpenses,
                profit,
                profitMargin
        );
    }

    // Document Health Score (0-100) per vehicle
    public DocumentHealthDTO getDocumentHealth(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        List<VehicleDocument> documents = vehicleDocumentRepository.findByVehicleId(vehicleId);
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);

        int validCount = 0;
        int expiringCount = 0;
        int expiredCount = 0;

        for (VehicleDocument doc : documents) {
            if (doc.getExpiryDate() == null) {
                validCount++; // No expiry date = valid
            } else if (doc.getExpiryDate().isBefore(today)) {
                expiredCount++;
            } else if (doc.getExpiryDate().isBefore(thirtyDaysFromNow)) {
                expiringCount++;
            } else {
                validCount++;
            }
        }

        int totalDocs = documents.size();
        if (totalDocs == 0) {
            totalDocs = 1; // Avoid division by zero
        }

        // Calculate score: valid = 100, expiring = 70, expired = 30
        int score = (validCount * 100 + expiringCount * 70 + expiredCount * 30) / totalDocs;

        String grade;
        if (score >= 90) grade = "A";
        else if (score >= 70) grade = "B";
        else if (score >= 50) grade = "C";
        else grade = "D";

        String status;
        if (expiredCount > 0) status = "CRITICAL";
        else if (expiringCount > 0) status = "WARNING";
        else status = "HEALTHY";

        return new DocumentHealthDTO(
                vehicle.getId(),
                vehicle.getVehicleNumber(),
                score,
                grade,
                totalDocs,
                validCount,
                expiringCount,
                expiredCount,
                status
        );
    }

    private int compareSeverity(String s1, String s2) {
        Map<String, Integer> order = Map.of("HIGH", 1, "MEDIUM", 2, "LOW", 3);
        return order.getOrDefault(s1, 4).compareTo(order.getOrDefault(s2, 4));
    }
}
