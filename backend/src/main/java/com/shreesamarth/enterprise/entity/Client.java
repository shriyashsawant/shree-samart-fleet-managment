package com.shreesamarth.enterprise.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
@Table(name = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "party_name", length = 100)
    private String partyName;

    @Column(name = "gst_number", length = 20)
    private String gstNumber;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 15)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(name = "diesel_provided_by_client")
    private Boolean dieselProvidedByClient = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    @JsonIgnore
    private Tenant tenant;
}
