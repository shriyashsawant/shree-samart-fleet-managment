package com.shreesamarth.enterprise.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TripRequest {
    private Long vehicleId;
    private Long driverId;
    private Long clientId;
    private LocalDate tripDate;
    private String siteLocation;
    private String materialType;
    private BigDecimal quantity;
    private BigDecimal tripCharges;
    private BigDecimal distance;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String notes;
}
