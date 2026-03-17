package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByQuantityInStockLessThanEqual(Integer level);
    List<InventoryItem> findByCategory(String category);
}
