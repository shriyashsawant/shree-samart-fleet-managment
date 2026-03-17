package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Tyre;
import com.shreesamarth.enterprise.entity.TyreLog;
import com.shreesamarth.enterprise.repository.TyreLogRepository;
import com.shreesamarth.enterprise.repository.TyreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tyre-logs")
@RequiredArgsConstructor
public class TyreLogController {

    private final TyreLogRepository tyreLogRepository;
    private final TyreRepository tyreRepository;

    @GetMapping("/tyre/{tyreId}")
    public ResponseEntity<List<TyreLog>> getLogsByTyre(@PathVariable Long tyreId) {
        return ResponseEntity.ok(tyreLogRepository.findByTyreIdOrderByLogDateDesc(tyreId));
    }

    @PostMapping
    public ResponseEntity<TyreLog> createLog(@RequestBody TyreLog log) {
        if (log.getTyre() != null && log.getTyre().getId() != null) {
            Tyre tyre = tyreRepository.findById(log.getTyre().getId())
                    .orElseThrow(() -> new RuntimeException("Tyre not found"));
            log.setTyre(tyre);

            // Update tyre state based on log
            if ("ROTATION".equals(log.getLogType()) && log.getToPosition() != null) {
                tyre.setPosition(log.getToPosition());
                tyreRepository.save(tyre);
            } else if ("RETREADING".equals(log.getLogType())) {
                tyre.setRetreadCount(tyre.getRetreadCount() + 1);
                tyre.setStatus("RETREADED");
                tyreRepository.save(tyre);
            } else if ("SCRAPPED".equals(log.getLogType())) {
                tyre.setStatus("SCRAPPED");
                tyreRepository.save(tyre);
            }
        }
        return ResponseEntity.ok(tyreLogRepository.save(log));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        tyreLogRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
