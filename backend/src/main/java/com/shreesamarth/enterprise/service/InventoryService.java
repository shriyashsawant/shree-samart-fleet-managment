package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.entity.InventoryItem;
import com.shreesamarth.enterprise.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryRepository inventoryRepository;

    public List<InventoryItem> getAllItems() {
        return inventoryRepository.findAll();
    }

    public List<InventoryItem> getLowStockItems() {
        return inventoryRepository.findAll().stream()
                .filter(i -> i.getQuantityInStock() <= i.getReorderLevel())
                .toList();
    }

    public InventoryItem saveItem(InventoryItem item) {
        return inventoryRepository.save(item);
    }

    public void deleteItem(Long id) {
        inventoryRepository.deleteById(id);
    }

    public InventoryItem updateStock(Long id, Integer quantity) {
        InventoryItem item = inventoryRepository.findById(id).orElseThrow();
        item.setQuantityInStock(item.getQuantityInStock() + quantity);
        return inventoryRepository.save(item);
    }
}
