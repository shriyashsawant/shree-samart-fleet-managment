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
public class ComplianceDTO {
    private Long id;
    private String type;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private BigDecimal amount;
    private String documentPath;
    private String status;
    private String remarks;
    private LocalDateTime createdAt;

    // Vehicle info (flattened, since @JsonIgnore hides the entity)
    private Long vehicleId;
    private String vehicleNumber;
    private String vehicleModel;
}
