package com.shreesamarth.enterprise.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(name = "document_type", length = 50)
    private String documentType; // LICENSE, AADHAAR, PAN, etc.

    @Column(name = "document_name", length = 100)
    private String documentName;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "document_number", length = 50)
    private String documentNumber; // License number, Aadhaar number, etc.

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
