package com.shreesamarth.enterprise.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "documents", "drivers", "vehicleLogs", "complianceRecords", "tenant"})
    private Vehicle vehicle;

    @Column(name = "category", length = 50)
    private String category = "OPERATIONAL";

    @Column(name = "expense_type", length = 50)
    private String expenseType;

    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    @Column
    private LocalDate date;

    @Column(name = "diesel_provided_by_client")
    private Boolean dieselProvidedByClient = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "bill_file_path")
    private String billFilePath;

    @Column(name = "fuel_quantity", precision = 10, scale = 2)
    private java.math.BigDecimal fuelQuantity;

    @Column(name = "fuel_rate", precision = 10, scale = 2)
    private java.math.BigDecimal fuelRate;

    @Column(name = "odometer_reading")
    private Long odometerReading;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Tenant tenant;
}
