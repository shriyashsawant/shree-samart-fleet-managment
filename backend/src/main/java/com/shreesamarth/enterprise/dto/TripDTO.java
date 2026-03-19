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
public class TripDTO {
    private Long id;
    private String tripNumber;
    private LocalDate tripDate;
    
    // Vehicle info (simple fields only)
    private Long vehicleId;
    private String vehicleNumber;
    
    // Driver info (simple fields only)
    private Long driverId;
    private String driverName;
    
    // Client info (simple fields only)
    private Long clientId;
    private String clientName;
    
    private String siteLocation;
    private String materialType;
    private BigDecimal quantity;
    private BigDecimal tripCharges;
    private BigDecimal distance;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
}
