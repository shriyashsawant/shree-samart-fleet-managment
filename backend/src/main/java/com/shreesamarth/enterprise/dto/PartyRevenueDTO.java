package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PartyRevenueDTO {
    private Long clientId;
    private String partyName;
    private String gstNumber;
    private BigDecimal totalRevenue;
    private Long billCount;
    private BigDecimal percentage;
}
