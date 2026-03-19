package com.shreesamarth.enterprise.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;

@Entity
@Table(name = "vehicle_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "documents", "drivers", "vehicleLogs", "complianceRecords", "tenant"})
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDate logDate;

    @Column(nullable = false)
    private String logType;

    private String description;

    private Double cost;

    private String serviceCenter;

    private String mechanicName;

    private String partsReplaced;

    private LocalDate nextDueDate;

    @Column(length = 1000)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Tenant tenant;
}
