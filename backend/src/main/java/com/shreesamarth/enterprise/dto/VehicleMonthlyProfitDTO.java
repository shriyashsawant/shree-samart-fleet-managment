package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleMonthlyProfitDTO {
    private Long vehicleId;
    private String vehicleNumber;
    private String month;
    private Integer year;
    private BigDecimal revenue;
    private BigDecimal dieselExpenses;
    private BigDecimal salaryExpenses;
    private BigDecimal maintenanceExpenses;
    private BigDecimal emiExpenses;
    private BigDecimal totalExpenses;
    private BigDecimal profit;
    private BigDecimal profitMargin;
    private Integer tripCount;
}
