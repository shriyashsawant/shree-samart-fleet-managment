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
    
    @JsonProperty("vehicle")
    private VehicleRef vehicle;
    
    @JsonProperty("driverId")
    private Long driverId;
    
    @JsonProperty("driver")
    private VehicleRef driver;
    
    @JsonProperty("clientId")
    private Long clientId;
    
    @JsonProperty("client")
    private VehicleRef client;
    
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
    
    public Long resolveVehicleId() {
        if (vehicleId != null) return vehicleId;
        if (vehicle != null) return vehicle.getId();
        return null;
    }
    
    public Long resolveDriverId() {
        if (driverId != null) return driverId;
        if (driver != null) return driver.getId();
        return null;
    }
    
    public Long resolveClientId() {
        if (clientId != null) return clientId;
        if (client != null) return client.getId();
        return null;
    }
    
    @Data
    public static class VehicleRef {
        private Long id;
    }
}
