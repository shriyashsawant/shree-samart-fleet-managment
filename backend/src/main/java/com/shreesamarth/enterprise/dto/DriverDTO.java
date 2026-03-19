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
public class DriverDTO {
    private Long id;
    private String name;
    private String phone;
    private String address;
    private String aadhaarNumber;
    private String drivingLicense;
    private LocalDate licenseExpiry;
    private LocalDate joiningDate;
    private LocalDate endDate;
    private BigDecimal salary;
    private String status;
    private Long assignedVehicleId;
    private String assignedVehicleNumber;
    private String licenseFilePath;
    private String aadhaarFilePath;
    private LocalDateTime createdAt;
}
