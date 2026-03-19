package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.entity.DriverAdvance;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.repository.DriverAdvanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverAdvanceService {
    private final DriverAdvanceRepository advanceRepository;

    public List<DriverAdvance> getAllAdvances(Tenant tenant) {
        return tenant != null
            ? advanceRepository.findByTenantId(tenant.getId())
            : advanceRepository.findAll();
    }

    public List<DriverAdvance> getAdvancesByDriver(Long driverId) {
        return advanceRepository.findByDriverId(driverId);
    }

    public List<DriverAdvance> getPendingAdvances(Tenant tenant) {
        return tenant != null
            ? advanceRepository.findByTenantId(tenant.getId()).stream()
                .filter(a -> Boolean.FALSE.equals(a.getIsSettled()))
                .toList()
            : advanceRepository.findByIsSettled(false);
    }

    @Transactional
    public DriverAdvance saveAdvance(DriverAdvance advance, Tenant tenant) {
        if (tenant != null) advance.setTenant(tenant);
        return advanceRepository.save(advance);
    }

    @Transactional
    public DriverAdvance settleAdvance(Long id) {
        DriverAdvance advance = advanceRepository.findById(id).orElseThrow();
        advance.setIsSettled(true);
        advance.setSettlementDate(LocalDate.now());
        return advanceRepository.save(advance);
    }

    @Transactional
    public DriverAdvance updateAdvance(DriverAdvance advance) {
        return advanceRepository.findById(advance.getId())
            .map(existing -> {
                advance.setTenant(existing.getTenant());
                return advanceRepository.save(advance);
            })
            .orElseThrow(() -> new RuntimeException("Advance not found"));
    }

    @Transactional
    public void deleteAdvance(Long id) {
        advanceRepository.deleteById(id);
    }
}
