package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.dto.VehicleLogDTO;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.entity.VehicleLog;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.repository.VehicleLogRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/vehicle-logs")
@RequiredArgsConstructor
public class VehicleLogController {

    private final VehicleLogRepository vehicleLogRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsernameWithTenant(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping("/vehicle/{vehicleId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<VehicleLog>> getLogsByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(vehicleLogRepository.findByVehicleIdOrderByLogDateDesc(vehicleId));
    }

    @GetMapping("/vehicle/{vehicleId}/type/{logType}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<VehicleLog>> getLogsByVehicleAndType(
            @PathVariable Long vehicleId,
            @PathVariable String logType) {
        return ResponseEntity.ok(vehicleLogRepository.findByVehicleIdAndLogTypeOrderByLogDateDesc(vehicleId, logType));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<VehicleLog> createLog(@RequestBody VehicleLogDTO dto, Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        VehicleLog log = new VehicleLog();
        log.setVehicle(vehicle);
        log.setLogDate(dto.getLogDate() != null ? dto.getLogDate() : LocalDate.now());
        log.setLogType(dto.getLogType());
        log.setDescription(dto.getDescription());
        log.setCost(dto.getCost());
        log.setServiceCenter(dto.getServiceCenter());
        log.setMechanicName(dto.getMechanicName());
        log.setPartsReplaced(dto.getPartsReplaced());
        log.setNextDueDate(dto.getNextDueDate());
        log.setNotes(dto.getNotes());
        if (tenant != null) log.setTenant(tenant);

        return ResponseEntity.ok(vehicleLogRepository.save(log));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<VehicleLog> updateLog(@PathVariable Long id, @RequestBody VehicleLogDTO dto) {
        return vehicleLogRepository.findById(id)
                .map(existing -> {
                    if (dto.getLogDate() != null) existing.setLogDate(dto.getLogDate());
                    if (dto.getLogType() != null) existing.setLogType(dto.getLogType());
                    if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
                    if (dto.getCost() != null) existing.setCost(dto.getCost());
                    if (dto.getServiceCenter() != null) existing.setServiceCenter(dto.getServiceCenter());
                    if (dto.getMechanicName() != null) existing.setMechanicName(dto.getMechanicName());
                    if (dto.getPartsReplaced() != null) existing.setPartsReplaced(dto.getPartsReplaced());
                    if (dto.getNextDueDate() != null) existing.setNextDueDate(dto.getNextDueDate());
                    if (dto.getNotes() != null) existing.setNotes(dto.getNotes());
                    return ResponseEntity.ok(vehicleLogRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        vehicleLogRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
