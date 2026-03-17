package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyProfitDTO {
    private String month;
    private Integer year;
    private BigDecimal revenue;
    private BigDecimal expenses;
    private BigDecimal profit;
    private Long billCount;
    private Long expenseCount;
}
