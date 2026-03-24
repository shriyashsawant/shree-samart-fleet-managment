package com.shreesamarth.enterprise.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String vehicleNumber;

    @Column(length = 100)
    private String model;

    @Column(length = 50)
    private String manufacturer;

    @Column(name = "registration_date")
    private LocalDate registrationDate;

    // --- New OCR Field
    @Column(name = "manufacturing_year")
    private Integer manufacturingYear;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(length = 50)
    private String chassisNumber;

    @Column(length = 50)
    private String engineNumber;

    @Column(name = "owner_name", length = 100)
    private String ownerName;

    @Column(name = "insurance_company", length = 100)
    private String insuranceCompany;

    @Column(name = "insurance_expiry")
    private LocalDate insuranceExpiry;

    @Column(name = "permit_number", length = 50)
    private String permitNumber;

    @Column(name = "permit_expiry")
    private LocalDate permitExpiry;

    // --- New OCR Field
    @Column(name = "permit_issue_date")
    private LocalDate permitIssueDate;

    @Column(name = "fitness_expiry")
    private LocalDate fitnessExpiry;

    // --- New OCR Fields
    @Column(name = "puc_expiry")
    private LocalDate pucExpiry;

    @Column(name = "emission_level", length = 50)
    private String emissionLevel;

    @Column(name = "tax_receipt_date")
    private LocalDate taxReceiptDate;

    // --- New OCR Fields
    @Column(name = "tax_period_from")
    private LocalDate taxPeriodFrom;

    @Column(name = "tax_period_to")
    private LocalDate taxPeriodTo;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "emi_amount", precision = 10, scale = 2)
    private BigDecimal emiAmount;

    @Column(name = "emi_bank", length = 100)
    private String emiBank;

    @Column(name = "emi_start_date")
    private LocalDate emiStartDate;

    @Column(name = "emi_end_date")
    private LocalDate emiEndDate;

    @Column(length = 20)
    private String status = "ACTIVE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    @JsonIgnore
    private Tenant tenant;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<VehicleDocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "assignedVehicle", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Driver> drivers = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<VehicleLog> vehicleLogs = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<VehicleCompliance> complianceRecords = new ArrayList<>();

    @Column(name = "fuel_economy", precision = 5, scale = 2)
    private BigDecimal fuelEconomy; // km per liter

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
