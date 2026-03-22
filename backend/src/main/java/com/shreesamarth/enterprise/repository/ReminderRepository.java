package com.shreesamarth.enterprise.repository;

import com.shreesamarth.enterprise.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findByStatus(String status);
    List<Reminder> findByExpiryDateBeforeAndStatus(LocalDate date, String status);
    List<Reminder> findByExpiryDateBetweenAndStatus(LocalDate start, LocalDate end, String status);
    List<Reminder> findByReminderType(String reminderType);
    List<Reminder> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);
    List<Reminder> findByTenantId(Long tenantId);
    
    List<Reminder> findByTenantIdAndExpiryDateBeforeAndStatus(Long tenantId, LocalDate date, String status);
    List<Reminder> findByTenantIdAndExpiryDateBetweenAndStatus(Long tenantId, LocalDate start, LocalDate end, String status);
}
