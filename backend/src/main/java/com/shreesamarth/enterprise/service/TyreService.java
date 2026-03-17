package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.entity.Tyre;
import com.shreesamarth.enterprise.repository.TyreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TyreService {
    private final TyreRepository tyreRepository;

    public List<Tyre> getAllTyres() {
        return tyreRepository.findAll();
    }

    public List<Tyre> getTyresByVehicle(Long vehicleId) {
        return tyreRepository.findByVehicleId(vehicleId);
    }

    public Tyre saveTyre(Tyre tyre) {
        return tyreRepository.save(tyre);
    }

    public void deleteTyre(Long id) {
        tyreRepository.deleteById(id);
    }
}
