package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Driver;
import com.shreesamarth.enterprise.entity.Payment;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.DriverRepository;
import com.shreesamarth.enterprise.repository.PaymentRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) String paymentType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Authentication auth) {

        Tenant tenant = getCurrentTenant(auth);
        List<Payment> allTenant = tenant != null
            ? paymentRepository.findByTenantId(tenant.getId())
            : paymentRepository.findAll();

        List<Payment> payments;
        if (vehicleId != null) {
            payments = allTenant.stream()
                .filter(p -> p.getVehicle() != null && p.getVehicle().getId().equals(vehicleId))
                .collect(Collectors.toList());
        } else if (driverId != null) {
            payments = allTenant.stream()
                .filter(p -> p.getDriver() != null && p.getDriver().getId().equals(driverId))
                .collect(Collectors.toList());
        } else if (paymentType != null) {
            payments = allTenant.stream()
                .filter(p -> paymentType.equals(p.getPaymentType()))
                .collect(Collectors.toList());
        } else if (startDate != null && endDate != null) {
            payments = allTenant.stream()
                .filter(p -> p.getPaymentDate() != null && !p.getPaymentDate().isBefore(startDate) && !p.getPaymentDate().isAfter(endDate))
                .collect(Collectors.toList());
        } else {
            payments = allTenant;
        }
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable Long id) {
        return paymentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Payment> createPayment(@RequestBody Payment payment, Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        if (tenant != null) payment.setTenant(tenant);

        if (payment.getVehicle() != null && payment.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(payment.getVehicle().getId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            payment.setVehicle(vehicle);
        }

        if (payment.getDriver() != null && payment.getDriver().getId() != null) {
            Driver driver = driverRepository.findById(payment.getDriver().getId())
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            payment.setDriver(driver);
        }

        return ResponseEntity.ok(paymentRepository.save(payment));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Payment> updatePayment(@PathVariable Long id, @RequestBody Payment payment) {
        return paymentRepository.findById(id)
                .map(existing -> {
                    payment.setId(id);
                    payment.setCreatedAt(existing.getCreatedAt());
                    payment.setTenant(existing.getTenant());
                    return ResponseEntity.ok(paymentRepository.save(payment));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        if (paymentRepository.existsById(id)) {
            paymentRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
