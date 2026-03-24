package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.service.FileUploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PingController {

    private final FileUploadService fileUploadService;

    public PingController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
    
    @GetMapping("/test/firebase")
    public ResponseEntity<Map<String, Object>> testFirebase() {
        Map<String, Object> result = new HashMap<>();
        result.put("firebaseEnabled", fileUploadService.isFirebaseEnabled());
        result.put("storageType", fileUploadService.isFirebaseEnabled() ? "Firebase Cloud Storage" : "Local File System");
        
        if (!fileUploadService.isFirebaseEnabled()) {
            result.put("warning", "Files uploaded will be stored locally and will be lost on redeployment!");
            result.put("solution", "Set FIREBASE_CREDENTIALS_JSON environment variable or add firebase-service-account.json to classpath");
        }
        
        return ResponseEntity.ok(result);
    }
}
