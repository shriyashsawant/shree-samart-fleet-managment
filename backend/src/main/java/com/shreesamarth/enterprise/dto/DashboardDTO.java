package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    private Long totalVehicles;
    private Long activeDrivers;
    private BigDecimal monthlyRevenue;
    private BigDecimal monthlyExpenses;
    private BigDecimal profit;
    private List<Map<String, Object>> upcomingReminders;
    private List<Map<String, Object>> vehiclePerformance;
}
