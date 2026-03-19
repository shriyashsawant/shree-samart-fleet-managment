package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleProfileDTO {
    // Vehicle data
    private Long vehicleId;
    private String vehicleNumber;
    private String model;
    private String manufacturer;
    private String chassisNumber;
    private String engineNumber;
    private String ownerName;
    private String status;
    
    // Driver data
    private Long driverId;
    private String driverName;
    private String driverPhone;
    private String driverLicense;
    
    // Financial data
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal profit;
    
    // Latest expenses (as simple maps)
    private List<ExpenseSummary> latestExpenses;
    private List<MaintenanceSummary> latestMaintenance;
    private List<BillSummary> latestBills;
    
    // Milestones
    private LocalDate lastOilChange;
    private LocalDate lastTyreChange;
    private LocalDate lastFuelDate;
    private BigDecimal lastFuelAmount;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpenseSummary {
        private Long id;
        private String expenseType;
        private BigDecimal amount;
        private LocalDate date;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaintenanceSummary {
        private Long id;
        private String maintenanceType;
        private BigDecimal cost;
        private LocalDate date;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillSummary {
        private Long id;
        private String billNo;
        private BigDecimal totalAmount;
        private LocalDate billDate;
    }
}
