package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Reminder;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.repository.ReminderRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsernameWithTenant(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Reminder>> getAllReminders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String reminderType,
            Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        List<Reminder> allTenant = tenant != null
            ? reminderRepository.findByTenantId(tenant.getId())
            : reminderRepository.findAll();

        if (status != null) {
            return ResponseEntity.ok(allTenant.stream()
                .filter(r -> status.equals(r.getStatus()))
                .collect(Collectors.toList()));
        }
        if (reminderType != null) {
            return ResponseEntity.ok(allTenant.stream()
                .filter(r -> reminderType.equals(r.getReminderType()))
                .collect(Collectors.toList()));
        }
        return ResponseEntity.ok(allTenant);
    }

    @GetMapping("/pending")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Reminder>> getPendingReminders(Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        List<Reminder> allTenant = tenant != null
            ? reminderRepository.findByTenantId(tenant.getId())
            : reminderRepository.findAll();

        LocalDate next30Days = LocalDate.now().plusDays(30);
        return ResponseEntity.ok(allTenant.stream()
            .filter(r -> "PENDING".equals(r.getStatus()))
            .filter(r -> r.getExpiryDate() != null && r.getExpiryDate().isBefore(next30Days))
            .collect(Collectors.toList()));
    }

    @PutMapping("/{id}/complete")
    @Transactional
    public ResponseEntity<Reminder> markComplete(@PathVariable Long id) {
        return reminderRepository.findById(id)
                .map(reminder -> {
                    reminder.setStatus("COMPLETED");
                    return ResponseEntity.ok(reminderRepository.save(reminder));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteReminder(@PathVariable Long id) {
        if (reminderRepository.existsById(id)) {
            reminderRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
