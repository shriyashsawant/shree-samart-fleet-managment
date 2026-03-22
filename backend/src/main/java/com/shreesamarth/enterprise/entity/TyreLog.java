package com.shreesamarth.enterprise.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tyre_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TyreLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tyre_id", nullable = false)
    @JsonIgnore
    private Tyre tyre;

    @Column(name = "log_type", length = 50)
    private String logType; // ROTATION, RETREADING, SCRAPPED, INSTALLATION

    @Column(name = "log_date")
    private LocalDate logDate;

    @Column(name = "odometer_reading")
    private Long odometerReading;

    @Column(name = "from_position", length = 50)
    private String fromPosition;

    @Column(name = "to_position", length = 50)
    private String toPosition;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
