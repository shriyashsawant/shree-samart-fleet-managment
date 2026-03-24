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

@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bill_no", length = 20)
    private String billNo;

    @Column(name = "bill_date")
    private LocalDate billDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @JsonIgnore
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    @JsonIgnore
    private Vehicle vehicle;

    @Column(name = "hsn_code", length = 10)
    private String hsnCode;

    @Column(name = "basic_amount", precision = 12, scale = 2)
    private BigDecimal basicAmount;

    @Column(name = "gst_percentage", precision = 5, scale = 2)
    private BigDecimal gstPercentage;

    @Column(name = "cgst_amount", precision = 12, scale = 2)
    private BigDecimal cgstAmount;

    @Column(name = "sgst_amount", precision = 12, scale = 2)
    private BigDecimal sgstAmount;

    @Column(name = "pf_amount", precision = 10, scale = 2)
    private BigDecimal pfAmount;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "bill_type", length = 50)
    private String billType;

    // --- New OCR Fields ---
    @Column(name = "company_name", length = 150)
    private String companyName;

    @Column(name = "company_gst", length = 20)
    private String companyGst;

    @Column(name = "company_mobile", length = 20)
    private String companyMobile;

    @Column(name = "party_name", length = 150)
    private String partyName;

    @Column(name = "party_gst", length = 20)
    private String partyGst;

    @Column(name = "party_pan", length = 20)
    private String partyPan;

    @Column(name = "igst_amount", precision = 12, scale = 2)
    private BigDecimal igstAmount;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account_no", length = 50)
    private String bankAccountNo;

    @Column(name = "bank_ifsc", length = 20)
    private String bankIfsc;

    @Column(name = "math_valid")
    private Boolean mathValid;
    // ----------------------

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 20)
    private String status; // PENDING, PAID, PARTIAL

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    @JsonIgnore
    private Tenant tenant;
}
