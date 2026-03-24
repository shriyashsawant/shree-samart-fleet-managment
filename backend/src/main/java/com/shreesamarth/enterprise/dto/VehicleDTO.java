package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDTO {
    private Long id;
    private String vehicleNumber;
    private String model;
    private String manufacturer;
    private LocalDate registrationDate;
    private Integer manufacturingYear;
    private LocalDate purchaseDate;
    private String chassisNumber;
    private String engineNumber;
    private String ownerName;
    private String insuranceCompany;
    private LocalDate insuranceExpiry;
    private String permitNumber;
    private LocalDate permitExpiry;
    private LocalDate permitIssueDate;
    private LocalDate fitnessExpiry;
    private LocalDate pucExpiry;
    private String emissionLevel;
    private LocalDate taxReceiptDate;
    private LocalDate taxPeriodFrom;
    private LocalDate taxPeriodTo;
    private BigDecimal taxAmount;
    private BigDecimal emiAmount;
    private String emiBank;
    private LocalDate emiStartDate;
    private LocalDate emiEndDate;
    private String status;
    private LocalDateTime createdAt;
}
