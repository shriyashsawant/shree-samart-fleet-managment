package com.shreesamarth.enterprise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentHealthDTO {
    private Long vehicleId;
    private String vehicleNumber;
    private Integer healthScore;
    private String healthGrade;
    private Integer totalDocuments;
    private Integer validDocuments;
    private Integer expiringDocuments;
    private Integer expiredDocuments;
    private String status;
}
