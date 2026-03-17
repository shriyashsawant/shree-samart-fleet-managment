package com.shreesamarth.enterprise.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

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
    private Vehicle vehicle;

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

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;
}
