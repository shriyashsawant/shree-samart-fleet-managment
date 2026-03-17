package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IdleVehicleAlertDTO {
    private Long vehicleId;
    private String vehicleNumber;
    private String model;
    private BigDecimal totalExpenses;
    private BigDecimal totalRevenue;
    private BigDecimal profitLoss;
    private Integer idleDays;
    private String alertReason;
    private String severity; // HIGH, MEDIUM, LOW
}
