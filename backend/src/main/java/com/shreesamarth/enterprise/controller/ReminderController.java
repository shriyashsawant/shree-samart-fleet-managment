package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Reminder;
import com.shreesamarth.enterprise.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderRepository reminderRepository;

    @GetMapping
    public ResponseEntity<List<Reminder>> getAllReminders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String reminderType) {
        
        List<Reminder> reminders;
        if (status != null) {
            reminders = reminderRepository.findByStatus(status);
        } else if (reminderType != null) {
            reminders = reminderRepository.findByReminderType(reminderType);
        } else {
            reminders = reminderRepository.findAll();
        }
        return ResponseEntity.ok(reminders);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Reminder>> getPendingReminders() {
        LocalDate today = LocalDate.now();
        LocalDate next30Days = today.plusDays(30);
        return ResponseEntity.ok(reminderRepository.findByExpiryDateBeforeAndStatus(next30Days, "PENDING"));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Reminder> markComplete(@PathVariable Long id) {
        return reminderRepository.findById(id)
                .map(reminder -> {
                    reminder.setStatus("COMPLETED");
                    return ResponseEntity.ok(reminderRepository.save(reminder));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReminder(@PathVariable Long id) {
        if (reminderRepository.existsById(id)) {
            reminderRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
