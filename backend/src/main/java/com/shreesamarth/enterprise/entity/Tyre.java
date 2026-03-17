package com.shreesamarth.enterprise.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tyres")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tyre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "serial_number", unique = true, length = 50)
    private String serialNumber;

    @Column(name = "brand", length = 50)
    private String brand;

    @Column(name = "position")
    private String position; // e.g., Front Left, Rear Right Outer, etc.

    @Column(name = "installation_date")
    private LocalDate installationDate;

    @Column(name = "installation_odometer")
    private Long installationOdometer;

    @Column(name = "status")
    private String status; // ACTIVE, RETREADED, SCRAPPED

    @Column(name = "retread_count")
    private Integer retreadCount = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
