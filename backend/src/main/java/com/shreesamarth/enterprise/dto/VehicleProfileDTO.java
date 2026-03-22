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
    // Vehicle data - nested object
    private VehicleInfo vehicle;
    
    // Driver data - nested object
    private DriverInfo assignedDriver;
    
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
    public static class VehicleInfo {
        private Long vehicleId;
        private String vehicleNumber;
        private String model;
        private String manufacturer;
        private String chassisNumber;
        private String engineNumber;
        private String ownerName;
        private String status;
        private String fuelType = "DIESEL"; // Default to DIESEL since not in entity
        private String financier = "Internal"; // Default since not in entity
        private LocalDate registrationDate;
        private BigDecimal emiAmount;
        private String emiBank;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DriverInfo {
        private Long driverId;
        private String name;
        private String phone;
        private String license;
        private String address;
    }
    
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
