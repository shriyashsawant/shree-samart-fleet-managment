package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.Tyre;
import com.shreesamarth.enterprise.repository.TyreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TyreService {
    private final TyreRepository tyreRepository;

    public List<Tyre> getAllTyres(Tenant tenant) {
        return tenant != null
            ? tyreRepository.findByTenantId(tenant.getId())
            : tyreRepository.findAll();
    }

    public List<Tyre> getTyresByVehicle(Long vehicleId) {
        return tyreRepository.findByVehicleId(vehicleId);
    }

    @Transactional
    public Tyre saveTyre(Tyre tyre, Tenant tenant) {
        if (tenant != null) tyre.setTenant(tenant);
        return tyreRepository.save(tyre);
    }

    @Transactional
    public Tyre updateTyre(Tyre tyre) {
        return tyreRepository.findById(tyre.getId())
            .map(existing -> {
                tyre.setTenant(existing.getTenant());
                return tyreRepository.save(tyre);
            })
            .orElseThrow(() -> new RuntimeException("Tyre not found"));
    }

    @Transactional
    public void deleteTyre(Long id) {
        tyreRepository.deleteById(id);
    }
}
