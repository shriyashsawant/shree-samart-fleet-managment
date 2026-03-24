package com.shreesamarth.enterprise.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TripRequest {
    @JsonProperty("vehicleId")
    private Long vehicleId;
    
    @JsonProperty("driverId")
    private Long driverId;
    
    @JsonProperty("clientId")
    private Long clientId;
    
    @JsonProperty("tripDate")
    private LocalDate tripDate;
    
    @JsonProperty("siteLocation")
    private String siteLocation;
    
    @JsonProperty("materialType")
    private String materialType;
    
    @JsonProperty("quantity")
    private BigDecimal quantity;
    
    @JsonProperty("tripCharges")
    private BigDecimal tripCharges;
    
    @JsonProperty("distance")
    private BigDecimal distance;
    
    @JsonProperty("startTime")
    private LocalDateTime startTime;
    
    @JsonProperty("endTime")
    private LocalDateTime endTime;
    
    @JsonProperty("status")
    private String status;
    
    @JsonProperty("notes")
    private String notes;
}
