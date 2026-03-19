package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Expense;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.ExpenseRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

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
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getAllExpenses(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) String expenseType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Authentication auth) {

        Tenant tenant = getCurrentTenant(auth);
        List<Expense> allTenantExpenses = tenant != null
            ? expenseRepository.findByTenantId(tenant.getId())
            : expenseRepository.findAll();

        if (category != null) {
            allTenantExpenses = allTenantExpenses.stream()
                .filter(e -> category.equals(e.getCategory()))
                .collect(java.util.stream.Collectors.toList());
        } else if (vehicleId != null) {
            allTenantExpenses = allTenantExpenses.stream()
                .filter(e -> e.getVehicle() != null && e.getVehicle().getId().equals(vehicleId))
                .collect(java.util.stream.Collectors.toList());
        } else if (expenseType != null) {
            allTenantExpenses = allTenantExpenses.stream()
                .filter(e -> expenseType.equals(e.getExpenseType()))
                .collect(java.util.stream.Collectors.toList());
        }

        if (startDate != null && endDate != null) {
            allTenantExpenses = allTenantExpenses.stream()
                .filter(e -> e.getDate() != null && !e.getDate().isBefore(startDate) && !e.getDate().isAfter(endDate))
                .collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(allTenantExpenses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(@PathVariable Long id) {
        return expenseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Expense> createExpense(@RequestBody Expense expense, Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        if (tenant != null) {
            expense.setTenant(tenant);
        }
        Vehicle vehicle = vehicleRepository.findById(expense.getVehicle().getId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        expense.setVehicle(vehicle);
        return ResponseEntity.ok(expenseRepository.save(expense));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Expense> updateExpense(@PathVariable Long id, @RequestBody Expense expense) {
        return expenseRepository.findById(id)
                .map(existing -> {
                    expense.setId(id);
                    expense.setCreatedAt(existing.getCreatedAt());
                    expense.setTenant(existing.getTenant());
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
    @Transactional
    public ResponseEntity<Expense> uploadBill(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        String fileUrl = fileUploadService.uploadFile(file, "expense-bills");
        expense.setBillFilePath(fileUrl);
        return ResponseEntity.ok(expenseRepository.save(expense));
    }
}
