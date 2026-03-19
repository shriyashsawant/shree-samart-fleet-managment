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
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "drivers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Driver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100)
    private String name;

    @Column(length = 15)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "aadhaar_number", length = 12)
    private String aadhaarNumber;

    @Column(name = "driving_license", length = 20)
    private String drivingLicense;

    @Column(name = "license_expiry")
    private LocalDate licenseExpiry;

    @Column(precision = 10, scale = 2)
    private BigDecimal salary;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_vehicle_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "documents", "drivers", "vehicleLogs", "complianceRecords", "tenant"})
    private Vehicle assignedVehicle;

    @Column(length = 20)
    private String status = "ACTIVE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Tenant tenant;

    @OneToMany(mappedBy = "driver", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "driver"})
    private List<DriverDocument> documents = new ArrayList<>();

    @Column(name = "license_file_path")
    private String licenseFilePath;

    @Column(name = "aadhaar_file_path")
    private String aadhaarFilePath;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @Transient
    public Long getAssignedVehicleId() {
        return assignedVehicle != null ? assignedVehicle.getId() : null;
    }
}
