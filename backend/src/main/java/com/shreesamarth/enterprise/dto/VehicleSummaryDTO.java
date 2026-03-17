package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleSummaryDTO {
    private Long id;
    private String vehicleNumber;
    private String model;
    private String status;
    private String driverName;
    private BigDecimal revenue;
    private BigDecimal expenses;
}
