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
public class BillDTO {
    private Long id;
    private String billNo;
    private LocalDate billDate;
    private Long clientId;
    private String clientName;
    private String clientGstNumber;
    private Long vehicleId;
    private String vehicleNumber;
    private String hsnCode;
    private BigDecimal basicAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal pfAmount;
    private BigDecimal totalAmount;
    private String billType;
    private String status;
    private LocalDateTime createdAt;
}
