package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.entity.VehicleLog;
import com.shreesamarth.enterprise.repository.VehicleLogRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/vehicle-logs")
@RequiredArgsConstructor
public class VehicleLogController {

    private final VehicleLogRepository vehicleLogRepository;
    private final VehicleRepository vehicleRepository;

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<VehicleLog>> getLogsByVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(vehicleLogRepository.findByVehicleIdOrderByLogDateDesc(vehicleId));
    }

    @GetMapping("/vehicle/{vehicleId}/type/{logType}")
    public ResponseEntity<List<VehicleLog>> getLogsByVehicleAndType(
            @PathVariable Long vehicleId, 
            @PathVariable String logType) {
        return ResponseEntity.ok(vehicleLogRepository.findByVehicleIdAndLogTypeOrderByLogDateDesc(vehicleId, logType));
    }

    @PostMapping
    public ResponseEntity<VehicleLog> createLog(@RequestBody VehicleLogDTO dto) {
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

        return ResponseEntity.ok(vehicleLogRepository.save(log));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleLog> updateLog(@PathVariable Long id, @RequestBody VehicleLogDTO dto) {
        VehicleLog log = vehicleLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log not found"));

        if (dto.getLogDate() != null) log.setLogDate(dto.getLogDate());
        if (dto.getLogType() != null) log.setLogType(dto.getLogType());
        if (dto.getDescription() != null) log.setDescription(dto.getDescription());
        if (dto.getCost() != null) log.setCost(dto.getCost());
        if (dto.getServiceCenter() != null) log.setServiceCenter(dto.getServiceCenter());
        if (dto.getMechanicName() != null) log.setMechanicName(dto.getMechanicName());
        if (dto.getPartsReplaced() != null) log.setPartsReplaced(dto.getPartsReplaced());
        if (dto.getNextDueDate() != null) log.setNextDueDate(dto.getNextDueDate());
        if (dto.getNotes() != null) log.setNotes(dto.getNotes());

        return ResponseEntity.ok(vehicleLogRepository.save(log));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        vehicleLogRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

class VehicleLogDTO {
    private Long vehicleId;
    private LocalDate logDate;
    private String logType;
    private String description;
    private Double cost;
    private String serviceCenter;
    private String mechanicName;
    private String partsReplaced;
    private LocalDate nextDueDate;
    private String notes;

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }
    public String getLogType() { return logType; }
    public void setLogType(String logType) { this.logType = logType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
    public String getServiceCenter() { return serviceCenter; }
    public void setServiceCenter(String serviceCenter) { this.serviceCenter = serviceCenter; }
    public String getMechanicName() { return mechanicName; }
    public void setMechanicName(String mechanicName) { this.mechanicName = mechanicName; }
    public String getPartsReplaced() { return partsReplaced; }
    public void setPartsReplaced(String partsReplaced) { this.partsReplaced = partsReplaced; }
    public LocalDate getNextDueDate() { return nextDueDate; }
    public void setNextDueDate(LocalDate nextDueDate) { this.nextDueDate = nextDueDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
