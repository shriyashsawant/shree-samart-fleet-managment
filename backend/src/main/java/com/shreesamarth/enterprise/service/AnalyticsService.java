package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.dto.*;
import com.shreesamarth.enterprise.entity.*;
import com.shreesamarth.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final DriverRepository driverRepository;

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("MMM");

    private List<Bill> billsByTenant(Long tenantId) {
        return billRepository.findByTenantId(tenantId);
    }

    private List<Expense> expensesByTenant(Long tenantId) {
        return expenseRepository.findByTenantId(tenantId);
    }

    private List<Maintenance> maintenanceByTenant(Long tenantId) {
        return maintenanceRepository.findByTenantId(tenantId);
    }

    private List<Payment> paymentsByTenant(Long tenantId) {
        return paymentRepository.findByTenantId(tenantId);
    }

    private List<Driver> driversByTenant(Long tenantId) {
        return driverRepository.findByTenantId(tenantId);
    }

    public List<VehicleProfitDTO> getVehicleProfitReport(Long tenantId) {
        List<Vehicle> vehicles = vehicleRepository.findByTenantId(tenantId);
        List<VehicleProfitDTO> profits = new ArrayList<>();

        for (Vehicle vehicle : vehicles) {
            BigDecimal totalRevenue = getVehicleRevenue(tenantId, vehicle.getId());
            BigDecimal totalExpenses = getVehicleExpenses(tenantId, vehicle.getId());
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

        profits.sort((a, b) -> b.getProfit().compareTo(a.getProfit()));
        return profits;
    }

    private BigDecimal getVehicleRevenue(Long tenantId, Long vehicleId) {
        return billsByTenant(tenantId).stream()
                .filter(b -> b.getVehicle() != null && b.getVehicle().getId().equals(vehicleId))
                .map(Bill::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal getVehicleExpenses(Long tenantId, Long vehicleId) {
        BigDecimal expenses = expensesByTenant(tenantId).stream()
                .filter(e -> e.getVehicle() != null && e.getVehicle().getId().equals(vehicleId))
                .map(Expense::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal maintenance = maintenanceByTenant(tenantId).stream()
                .filter(m -> m.getVehicle() != null && m.getVehicle().getId().equals(vehicleId))
                .map(Maintenance::getCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Driver> drivers = driversByTenant(tenantId);
        BigDecimal salaries = paymentsByTenant(tenantId).stream()
                .filter(p -> "SALARY".equals(p.getPaymentType()))
                .filter(p -> p.getDriver() != null && p.getDriver().getAssignedVehicle() != null)
                .filter(p -> p.getDriver().getAssignedVehicle().getId().equals(vehicleId))
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return expenses.add(maintenance).add(salaries);
    }

    public List<MonthlyProfitDTO> getMonthlyProfitTrend(Long tenantId, int months) {
        LocalDate now = LocalDate.now();
        List<MonthlyProfitDTO> trends = new ArrayList<>();

        List<Bill> allBills = billsByTenant(tenantId);
        List<Expense> allExpenses = expensesByTenant(tenantId);
        List<Maintenance> allMaintenance = maintenanceByTenant(tenantId);
        List<Payment> allPayments = paymentsByTenant(tenantId);

        for (int i = months - 1; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);

            BigDecimal revenue = allBills.stream()
                    .filter(b -> {
                        LocalDate billDate = b.getBillDate();
                        return billDate != null && !billDate.isBefore(monthStart) && !billDate.isAfter(monthEnd);
                    })
                    .map(Bill::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal expenses = allExpenses.stream()
                    .filter(e -> {
                        LocalDate expDate = e.getDate();
                        return expDate != null && !expDate.isBefore(monthStart) && !expDate.isAfter(monthEnd);
                    })
                    .map(Expense::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal maintenance = allMaintenance.stream()
                    .filter(m -> {
                        LocalDate mDate = m.getDate();
                        return mDate != null && !mDate.isBefore(monthStart) && !mDate.isAfter(monthEnd);
                    })
                    .map(Maintenance::getCost)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal salary = allPayments.stream()
                    .filter(p -> "SALARY".equals(p.getPaymentType()))
                    .filter(p -> p.getPaymentDate() != null)
                    .filter(p -> !p.getPaymentDate().isBefore(monthStart) && !p.getPaymentDate().isAfter(monthEnd))
                    .map(Payment::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalExpenses = expenses.add(maintenance).add(salary);
            BigDecimal profit = revenue.subtract(totalExpenses);

            Long billCount = allBills.stream()
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

    public List<ExpenseBreakdownDTO> getExpenseBreakdown(Long tenantId) {
        BigDecimal totalExpenses = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryTotals = new LinkedHashMap<>();

        List<Expense> allExpenses = expensesByTenant(tenantId);
        List<Maintenance> allMaintenance = maintenanceByTenant(tenantId);
        List<Payment> allPayments = paymentsByTenant(tenantId);

        BigDecimal diesel = allExpenses.stream()
                .filter(e -> "DIESEL".equalsIgnoreCase(e.getExpenseType()))
                .map(Expense::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        categoryTotals.put("Diesel", diesel);
        totalExpenses = totalExpenses.add(diesel);

        BigDecimal dailyExp = allExpenses.stream()
                .filter(e -> !"DIESEL".equalsIgnoreCase(e.getExpenseType()))
                .map(Expense::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        categoryTotals.put("Daily Expenses", dailyExp);
        totalExpenses = totalExpenses.add(dailyExp);

        BigDecimal maintenance = allMaintenance.stream()
                .map(Maintenance::getCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        categoryTotals.put("Maintenance", maintenance);
        totalExpenses = totalExpenses.add(maintenance);

        BigDecimal salary = allPayments.stream()
                .filter(p -> "SALARY".equals(p.getPaymentType()))
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        categoryTotals.put("Driver Salary", salary);
        totalExpenses = totalExpenses.add(salary);

        BigDecimal emi = allPayments.stream()
                .filter(p -> "EMI".equals(p.getPaymentType()))
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
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

        breakdown.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));
        return breakdown;
    }

    public List<GstSummaryDTO> getGstSummary(Long tenantId, int months) {
        LocalDate now = LocalDate.now();
        List<GstSummaryDTO> summaries = new ArrayList<>();

        List<Bill> allBills = billsByTenant(tenantId);

        for (int i = months - 1; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);

            List<Bill> monthBills = allBills.stream()
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

    public List<PartyRevenueDTO> getPartyWiseRevenue(Long tenantId) {
        List<Client> clients = clientRepository.findByTenantId(tenantId);
        List<PartyRevenueDTO> revenues = new ArrayList<>();

        List<Bill> allBills = billsByTenant(tenantId);

        BigDecimal totalRevenue = allBills.stream()
                .map(Bill::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        for (Client client : clients) {
            BigDecimal clientRevenue = allBills.stream()
                    .filter(b -> b.getClient() != null && b.getClient().getId().equals(client.getId()))
                    .map(Bill::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (clientRevenue.compareTo(BigDecimal.ZERO) > 0) {
                Long billCount = allBills.stream()
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

        revenues.sort((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()));
        return revenues;
    }

    public List<IdleVehicleAlertDTO> getIdleVehicleAlerts(Long tenantId) {
        List<Vehicle> vehicles = vehicleRepository.findByTenantId(tenantId);
        List<IdleVehicleAlertDTO> alerts = new ArrayList<>();

        for (Vehicle vehicle : vehicles) {
            BigDecimal totalExpenses = getVehicleExpenses(tenantId, vehicle.getId());
            BigDecimal totalRevenue = getVehicleRevenue(tenantId, vehicle.getId());
            BigDecimal profitLoss = totalRevenue.subtract(totalExpenses);

            boolean hasLowRevenue = totalRevenue.compareTo(BigDecimal.ZERO) == 0 ||
                    (totalExpenses.compareTo(BigDecimal.ZERO) > 0 &&
                     totalRevenue.divide(totalExpenses, 2, RoundingMode.HALF_UP).compareTo(BigDecimal.valueOf(0.7)) < 0);

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

        alerts.sort((a, b) -> {
            int severityOrder = compareSeverity(a.getSeverity(), b.getSeverity());
            if (severityOrder != 0) return severityOrder;
            return b.getTotalExpenses().compareTo(a.getTotalExpenses());
        });

        return alerts;
    }

    public VehicleProfitDTO getVehicleProfitByMonth(Long tenantId, Long vehicleId, String month) {
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        List<Bill> allBills = billsByTenant(tenantId);
        List<Expense> allExpenses = expensesByTenant(tenantId);
        List<Maintenance> allMaintenance = maintenanceByTenant(tenantId);
        List<Payment> allPayments = paymentsByTenant(tenantId);
        List<Driver> allDrivers = driversByTenant(tenantId);

        BigDecimal revenue = allBills.stream()
                .filter(b -> b.getVehicle() != null && b.getVehicle().getId().equals(vehicleId))
                .filter(b -> {
                    LocalDate billDate = b.getBillDate();
                    return billDate != null && !billDate.isBefore(monthStart) && !billDate.isAfter(monthEnd);
                })
                .map(Bill::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal dieselExpenses = allExpenses.stream()
                .filter(e -> e.getVehicle() != null && e.getVehicle().getId().equals(vehicleId))
                .filter(e -> "DIESEL".equalsIgnoreCase(e.getExpenseType()))
                .filter(e -> {
                    LocalDate expDate = e.getDate();
                    return expDate != null && !expDate.isBefore(monthStart) && !expDate.isAfter(monthEnd);
                })
                .map(Expense::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal salaryExpenses = allPayments.stream()
                .filter(p -> "SALARY".equals(p.getPaymentType()))
                .filter(p -> p.getDriver() != null && p.getDriver().getAssignedVehicle() != null)
                .filter(p -> p.getDriver().getAssignedVehicle().getId().equals(vehicleId))
                .filter(p -> p.getPaymentDate() != null)
                .filter(p -> !p.getPaymentDate().isBefore(monthStart) && !p.getPaymentDate().isAfter(monthEnd))
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal maintenanceExpenses = allMaintenance.stream()
                .filter(m -> m.getVehicle() != null && m.getVehicle().getId().equals(vehicleId))
                .filter(m -> m.getDate() != null)
                .filter(m -> !m.getDate().isBefore(monthStart) && !m.getDate().isAfter(monthEnd))
                .map(Maintenance::getCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal emiExpenses = allPayments.stream()
                .filter(p -> "EMI".equals(p.getPaymentType()))
                .filter(p -> p.getPaymentDate() != null)
                .filter(p -> !p.getPaymentDate().isBefore(monthStart) && !p.getPaymentDate().isAfter(monthEnd))
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = dieselExpenses.add(salaryExpenses).add(maintenanceExpenses).add(emiExpenses);
        BigDecimal profit = revenue.subtract(totalExpenses);

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
                validCount++;
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
            totalDocs = 1;
        }

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

    public List<VehicleSummaryDTO> getVehicleSummaries(Long tenantId) {
        List<Vehicle> tenantVehicles = vehicleRepository.findByTenantId(tenantId);
        final List<Vehicle> vehicles = tenantVehicles.isEmpty() ? vehicleRepository.findAll() : tenantVehicles;
        
        List<Driver> tenantDrivers = driversByTenant(tenantId);
        final List<Driver> allDrivers = tenantDrivers.isEmpty() ? driverRepository.findAll() : tenantDrivers;

        return vehicles.stream().map(v -> {
            BigDecimal revenue = getVehicleRevenue(tenantId, v.getId());
            BigDecimal expenses = getVehicleExpenses(tenantId, v.getId());

            String driverName = allDrivers.stream()
                    .filter(d -> d.getAssignedVehicle() != null && d.getAssignedVehicle().getId().equals(v.getId()))
                    .map(Driver::getName)
                    .findFirst()
                    .orElse("Unassigned");

            return new VehicleSummaryDTO(
                v.getId(),
                v.getVehicleNumber(),
                v.getModel(),
                v.getStatus(),
                driverName,
                revenue,
                expenses,
                v.getChassisNumber(),
                v.getEngineNumber(),
                v.getPurchaseDate(),
                v.getInsuranceCompany(),
                v.getInsuranceExpiry(),
                v.getEmiAmount(),
                v.getEmiBank(),
                v.getEmiStartDate(),
                v.getEmiEndDate(),
                v.getFuelEconomy()
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleProfileDTO getVehicleProfile(Long tenantId, Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .filter(v -> v.getTenant() == null || v.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Vehicle not found with ID: " + vehicleId));

        List<Driver> allDrivers = driversByTenant(tenantId);
        Driver driver = allDrivers.stream()
                .filter(d -> d.getAssignedVehicle() != null && d.getAssignedVehicle().getId().equals(vehicleId))
                .findFirst()
                .orElse(null);

        BigDecimal revenue = getVehicleRevenue(tenantId, vehicleId);
        BigDecimal expenses = getVehicleExpenses(tenantId, vehicleId);

        List<Expense> allExpenses = expensesByTenant(tenantId);
        List<Maintenance> allMaintenance = maintenanceByTenant(tenantId);
        List<Bill> allBills = billsByTenant(tenantId);

        List<Expense> latestExpenses = allExpenses.stream()
                .filter(e -> e.getVehicle() != null && e.getVehicle().getId().equals(vehicleId))
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .limit(10)
                .collect(Collectors.toList());

        List<Maintenance> latestMaintenance = allMaintenance.stream()
                .filter(m -> m.getVehicle() != null && m.getVehicle().getId().equals(vehicleId))
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .limit(10)
                .collect(Collectors.toList());

        List<Bill> latestBills = allBills.stream()
                .filter(b -> b.getVehicle() != null && b.getVehicle().getId().equals(vehicleId))
                .sorted((a, b) -> b.getBillDate().compareTo(a.getBillDate()))
                .limit(10)
                .collect(Collectors.toList());

        List<VehicleDocument> documents = vehicleDocumentRepository.findByVehicleId(vehicleId);

        LocalDate lastOilChange = latestMaintenance.stream()
                .filter(m -> m.getMaintenanceType() != null && m.getMaintenanceType().toUpperCase().contains("OIL"))
                .map(Maintenance::getDate)
                .findFirst()
                .orElse(null);

        LocalDate lastTyreChange = latestMaintenance.stream()
                .filter(m -> m.getMaintenanceType() != null && (m.getMaintenanceType().toUpperCase().contains("TYRE") || m.getMaintenanceType().toUpperCase().contains("TIRE")))
                .map(Maintenance::getDate)
                .findFirst()
                .orElse(null);

        Expense lastFuel = allExpenses.stream()
                .filter(e -> e.getVehicle() != null && e.getVehicle().getId().equals(vehicleId))
                .filter(e -> "DIESEL".equalsIgnoreCase(e.getExpenseType()))
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .findFirst()
                .orElse(null);

        List<VehicleProfileDTO.ExpenseSummary> expenseSummaries = latestExpenses.stream()
            .map(e -> new VehicleProfileDTO.ExpenseSummary(e.getId(), e.getExpenseType(), e.getAmount(), e.getDate()))
            .collect(Collectors.toList());

        List<VehicleProfileDTO.MaintenanceSummary> maintenanceSummaries = latestMaintenance.stream()
            .map(m -> new VehicleProfileDTO.MaintenanceSummary(m.getId(), m.getMaintenanceType(), m.getCost(), m.getDate()))
            .collect(Collectors.toList());

        List<VehicleProfileDTO.BillSummary> billSummaries = latestBills.stream()
            .map(b -> new VehicleProfileDTO.BillSummary(b.getId(), b.getBillNo(), b.getTotalAmount(), b.getBillDate()))
            .collect(Collectors.toList());

        VehicleProfileDTO.VehicleInfo vehicleInfo = new VehicleProfileDTO.VehicleInfo(
            vehicle.getId(),
            vehicle.getVehicleNumber(),
            vehicle.getModel(),
            vehicle.getManufacturer(),
            vehicle.getChassisNumber(),
            vehicle.getEngineNumber(),
            vehicle.getOwnerName(),
            vehicle.getStatus(),
            "DIESEL",
            "Internal",
            vehicle.getRegistrationDate(),
            vehicle.getEmiAmount(),
            vehicle.getEmiBank()
        );

        VehicleProfileDTO.DriverInfo driverInfo = null;
        if (driver != null) {
            driverInfo = new VehicleProfileDTO.DriverInfo(
                driver.getId(),
                driver.getName(),
                driver.getPhone(),
                driver.getDrivingLicense(),
                driver.getAddress()
            );
        }

        return new VehicleProfileDTO(
            vehicleInfo,
            driverInfo,
            revenue,
            expenses,
            revenue.subtract(expenses),
            expenseSummaries,
            maintenanceSummaries,
            billSummaries,
            lastOilChange,
            lastTyreChange,
            lastFuel != null ? lastFuel.getDate() : null,
            lastFuel != null ? lastFuel.getAmount() : null
        );
    }

    private int compareSeverity(String s1, String s2) {
        Map<String, Integer> order = Map.of("HIGH", 1, "MEDIUM", 2, "LOW", 3);
        return order.getOrDefault(s1, 4).compareTo(order.getOrDefault(s2, 4));
    }
}
