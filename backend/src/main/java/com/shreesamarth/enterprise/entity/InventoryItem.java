package com.shreesamarth.enterprise.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", length = 100, nullable = false)
    private String itemName;

    @Column(name = "category", length = 50)
    private String category; // Spare Parts, Oil, Filters, Tyres (Generic), etc.

    @Column(name = "quantity_in_stock")
    private Integer quantityInStock = 0;

    @Column(name = "unit", length = 20)
    private String unit; // Nos, Liters, Kgs

    @Column(name = "reorder_level")
    private Integer reorderLevel = 5;

    @Column(name = "last_restock_date")
    private LocalDateTime lastRestockDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
