package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

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
    
    // Vehicle Details for Edit Modal
    private String chassisNumber;
    private String engineNumber;
    private LocalDate purchaseDate;
    private String insuranceCompany;
    private LocalDate insuranceExpiry;
    private BigDecimal emiAmount;
    private String emiBank;
    private LocalDate emiStartDate;
    private LocalDate emiEndDate;
    private BigDecimal fuelEconomy;
}
