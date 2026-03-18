package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Expense;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.ExpenseRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final VehicleRepository vehicleRepository;
    private final FileUploadService fileUploadService;

    @GetMapping
    public ResponseEntity<List<Expense>> getAllExpenses(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) String expenseType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        
        List<Expense> expenses;
        if (vehicleId != null) {
            if (startDate != null && endDate != null) {
                expenses = expenseRepository.findByVehicleIdAndDateBetween(vehicleId, startDate, endDate);
            } else {
                expenses = expenseRepository.findByVehicleId(vehicleId);
            }
        } else if (expenseType != null) {
            expenses = expenseRepository.findByExpenseType(expenseType);
        } else {
            expenses = expenseRepository.findAll();
        }
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(@PathVariable Long id) {
        return expenseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Expense> createExpense(@RequestBody Expense expense) {
        Vehicle vehicle = vehicleRepository.findById(expense.getVehicle().getId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        expense.setVehicle(vehicle);
        return ResponseEntity.ok(expenseRepository.save(expense));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(@PathVariable Long id, @RequestBody Expense expense) {
        return expenseRepository.findById(id)
                .map(existing -> {
                    expense.setId(id);
                    expense.setCreatedAt(existing.getCreatedAt());
                    return ResponseEntity.ok(expenseRepository.save(expense));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        if (expenseRepository.existsById(id)) {
            expenseRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/bill")
    public ResponseEntity<Expense> uploadBill(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        // Upload to Firebase or local storage
        String fileUrl = fileUploadService.uploadFile(file, "expense-bills");
        expense.setBillFilePath(fileUrl);
        return ResponseEntity.ok(expenseRepository.save(expense));
    }
}
