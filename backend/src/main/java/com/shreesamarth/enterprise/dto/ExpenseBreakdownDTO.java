package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseBreakdownDTO {
    private String category;
    private BigDecimal amount;
    private Long count;
    private BigDecimal percentage;
}
