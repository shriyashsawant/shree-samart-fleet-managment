package com.shreesamarth.enterprise.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_telematics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleTelematics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    @JsonIgnore
    private Vehicle vehicle;

    @Column(name = "engine_code", length = 50)
    private String engineCode;

    @Column(precision = 10, scale = 2)
    private BigDecimal mileage;

    @Column(name = "fuel_level")
    private Integer fuelLevel;

    @Column(name = "engine_temperature")
    private Integer engineTemperature;

    @Column(name = "battery_voltage", precision = 5, scale = 2)
    private BigDecimal batteryVoltage;

    @Column(name = "tire_pressure_fl")
    private Integer tirePressureFL;

    @Column(name = "tire_pressure_fr")
    private Integer tirePressureFR;

    @Column(name = "tire_pressure_rl")
    private Integer tirePressureRL;

    @Column(name = "tire_pressure_rr")
    private Integer tirePressureRR;

    @Column(length = 50)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    @JsonIgnore
    private Tenant tenant;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
