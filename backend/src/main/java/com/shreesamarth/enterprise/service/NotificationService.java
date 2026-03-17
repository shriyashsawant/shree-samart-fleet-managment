package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.entity.*;
import com.shreesamarth.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final PaymentRepository paymentRepository;
    private final ReminderRepository reminderRepository;
    private final EmailService emailService;

    // Owner's email for notifications
    private static final String OWNER_EMAIL = "shreesamarth6666@gmail.com";

    // Run every day at 8 AM to check for upcoming expiry dates
    @Scheduled(cron = "0 0 8 * * ?")
    public void checkExpiringDocuments() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);

        log.info("Running document expiry check...");
        
        // Check vehicle documents expiring in 30 days
        List<Vehicle> vehicles = vehicleRepository.findAll();
        for (Vehicle vehicle : vehicles) {
            // Insurance expiry
            if (vehicle.getInsuranceExpiry() != null) {
                if (vehicle.getInsuranceExpiry().isBefore(thirtyDaysFromNow)) {
                    String severity = vehicle.getInsuranceExpiry().isBefore(today) ? "HIGH" : "MEDIUM";
                    createReminder(
                        "INSURANCE",
                        "Vehicle Insurance Expiring",
                        vehicle.getVehicleNumber() + " insurance expires on " + vehicle.getInsuranceExpiry(),
                        severity
                    );
                    // Send email notification
                    emailService.sendReminderEmail(
                        OWNER_EMAIL,
                        "Insurance Expiry",
                        "Vehicle Insurance Expiring - " + vehicle.getVehicleNumber(),
                        vehicle.getVehicleNumber() + " insurance expires on " + vehicle.getInsuranceExpiry(),
                        severity
                    );
                }
            }
        }

        // Check driver licenses expiring in 30 days
        List<Driver> drivers = driverRepository.findAll();
        for (Driver driver : drivers) {
            if (driver.getLicenseExpiry() != null) {
                if (driver.getLicenseExpiry().isBefore(thirtyDaysFromNow)) {
                    String severity = driver.getLicenseExpiry().isBefore(today) ? "HIGH" : "MEDIUM";
                    createReminder(
                        "LICENSE",
                        "Driver License Expiring",
                        driver.getName() + "'s license expires on " + driver.getLicenseExpiry(),
                        severity
                    );
                    // Send email notification
                    emailService.sendReminderEmail(
                        OWNER_EMAIL,
                        "License Expiry",
                        "Driver License Expiring - " + driver.getName(),
                        driver.getName() + "'s license expires on " + driver.getLicenseExpiry(),
                        severity
                    );
                }
            }
        }
    }

    // Run every day at 9 AM to check for EMI due
    @Scheduled(cron = "0 0 9 * * ?")
    public void checkEmiDue() {
        LocalDate today = LocalDate.now();
        LocalDate threeDaysFromNow = today.plusDays(3);

        log.info("Running EMI due check...");
        
        List<Payment> emiPayments = paymentRepository.findAll().stream()
            .filter(p -> "EMI".equals(p.getPaymentType()))
            .filter(p -> p.getPaymentDate() != null)
            .filter(p -> p.getPaymentDate().isAfter(today) && p.getPaymentDate().isBefore(threeDaysFromNow))
            .toList();

        for (Payment emi : emiPayments) {
            String vehicleInfo = emi.getVehicle() != null ? emi.getVehicle().getVehicleNumber() : "Unknown";
            createReminder(
                "EMI",
                "EMI Payment Due",
                "EMI payment of ₹" + emi.getAmount() + " due on " + emi.getPaymentDate() + " for " + vehicleInfo,
                "HIGH"
            );
            // Send email notification
            emailService.sendReminderEmail(
                OWNER_EMAIL,
                "EMI Due",
                "EMI Payment Due - " + vehicleInfo,
                "EMI payment of ₹" + emi.getAmount() + " due on " + emi.getPaymentDate() + " for " + vehicleInfo,
                "HIGH"
            );
        }
    }

    // Run every day at 10 AM to check for maintenance due
    @Scheduled(cron = "0 0 10 * * ?")
    public void checkMaintenanceDue() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysFromNow = today.plusDays(7);

        log.info("Running maintenance due check...");
        
        List<Maintenance> maintenanceList = maintenanceRepository.findAll();
        for (Maintenance maintenance : maintenanceList) {
            if (maintenance.getNextDueDate() != null) {
                if (maintenance.getNextDueDate().isBefore(sevenDaysFromNow)) {
                    String vehicleNumber = maintenance.getVehicle() != null ? 
                        maintenance.getVehicle().getVehicleNumber() : "Unknown";
                    String severity = maintenance.getNextDueDate().isBefore(today) ? "HIGH" : "MEDIUM";
                    
                    createReminder(
                        "MAINTENANCE",
                        "Maintenance Due",
                        "Vehicle " + vehicleNumber + 
                        " needs " + maintenance.getMaintenanceType() + " by " + maintenance.getNextDueDate(),
                        severity
                    );
                    
                    // Send email notification
                    emailService.sendReminderEmail(
                        OWNER_EMAIL,
                        "Maintenance Due",
                        "Maintenance Due - " + vehicleNumber,
                        "Vehicle " + vehicleNumber + 
                        " needs " + maintenance.getMaintenanceType() + " by " + maintenance.getNextDueDate(),
                        severity
                    );
                }
            }
        }
    }

    // Get all pending reminders
    public List<Reminder> getPendingReminders() {
        return reminderRepository.findAll().stream()
            .filter(r -> r.getIsResolved() == null || !r.getIsResolved())
            .toList();
    }

    // Mark reminder as resolved
    public void resolveReminder(Long reminderId) {
        reminderRepository.findById(reminderId).ifPresent(reminder -> {
            reminder.setIsResolved(true);
            reminder.setStatus("RESOLVED");
            reminderRepository.save(reminder);
        });
    }

    private void createReminder(String type, String title, String description, String severity) {
        // Check if reminder already exists
        List<Reminder> existing = reminderRepository.findAll().stream()
            .filter(r -> type.equals(r.getReminderType()))
            .filter(r -> title.contains(r.getTitle() != null ? r.getTitle() : ""))
            .filter(r -> r.getIsResolved() == null || !r.getIsResolved())
            .toList();

        if (existing.isEmpty()) {
            Reminder reminder = new Reminder();
            reminder.setReminderType(type);
            reminder.setTitle(title);
            reminder.setDescription(description);
            reminder.setSeverity(severity);
            reminder.setReminderDate(LocalDate.now());
            reminder.setIsResolved(false);
            reminder.setStatus("PENDING");
            reminderRepository.save(reminder);
            log.info("Created reminder: {} - {}", type, title);
        }
    }
}
