package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/ocr")
@CrossOrigin(origins = "*")
public class OcrController {

    @Autowired
    private OcrService ocrService;

    @PostMapping("/extract")
    public ResponseEntity<Map<String, Object>> extractDocument(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> result = ocrService.extractDocument(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/learn")
    public ResponseEntity<Map<String, Object>> learnCorrection(@RequestBody Map<String, String> data) {
        try {
            String wrong = data.get("wrong");
            String correct = data.get("correct");
            String fieldType = data.get("field_type");
            
            Map<String, Object> result = ocrService.learnCorrection(wrong, correct, fieldType);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, Object>> getSuggestions(
            @RequestParam String fieldType,
            @RequestParam(required = false) String prefix) {
        try {
            Map<String, Object> result = ocrService.getSuggestions(fieldType, prefix);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/corrections")
    public ResponseEntity<Map<String, Object>> getCorrections() {
        try {
            Map<String, Object> result = ocrService.getCorrections();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "healthy"));
    }
}
