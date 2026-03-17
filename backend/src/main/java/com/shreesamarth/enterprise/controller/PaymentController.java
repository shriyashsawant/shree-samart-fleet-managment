package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Driver;
import com.shreesamarth.enterprise.entity.Payment;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.DriverRepository;
import com.shreesamarth.enterprise.repository.PaymentRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) String paymentType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        
        List<Payment> payments;
        if (vehicleId != null) {
            payments = paymentRepository.findByVehicleId(vehicleId);
        } else if (driverId != null) {
            payments = paymentRepository.findByDriverId(driverId);
        } else if (paymentType != null) {
            payments = paymentRepository.findByPaymentType(paymentType);
        } else if (startDate != null && endDate != null) {
            payments = paymentRepository.findByPaymentDateBetween(startDate, endDate);
        } else {
            payments = paymentRepository.findAll();
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
    public ResponseEntity<Payment> createPayment(@RequestBody Payment payment) {
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
    public ResponseEntity<Payment> updatePayment(@PathVariable Long id, @RequestBody Payment payment) {
        return paymentRepository.findById(id)
                .map(existing -> {
                    payment.setId(id);
                    payment.setCreatedAt(existing.getCreatedAt());
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
