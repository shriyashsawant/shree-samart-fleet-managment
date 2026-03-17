package com.shreesamarth.enterprise.dto;

import com.shreesamarth.enterprise.entity.*;
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
    private Vehicle vehicle;
    private Driver assignedDriver;
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal profit;
    private List<Expense> latestExpenses;
    private List<Maintenance> latestMaintenance;
    private List<Bill> latestBills;
    private List<VehicleDocument> documents;
    
    // Vital Milestones
    private LocalDate lastOilChange;
    private LocalDate lastTyreChange;
    private LocalDate lastFuelDate;
    private BigDecimal lastFuelAmount;
}
