package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleProfitDTO {
    private Long vehicleId;
    private String vehicleNumber;
    private String model;
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal profit;
    private BigDecimal profitMargin;
}
