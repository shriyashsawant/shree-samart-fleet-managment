package com.shreesamarth.enterprise.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLogDTO {
    private Long vehicleId;
    private LocalDate logDate;
    private String logType;
    private String description;
    private Double cost;
    private String serviceCenter;
    private String mechanicName;
    private String partsReplaced;
    private LocalDate nextDueDate;
    private String notes;
}
