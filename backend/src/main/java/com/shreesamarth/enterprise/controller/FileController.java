package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.service.FileUploadService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = {"https://shree-samart-fleet-managment-eta.vercel.app", "http://localhost:5173"})
public class FileController {

    private final FileUploadService fileUploadService;

    public FileController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getFileStatus() {
        return ResponseEntity.ok(Map.of(
            "firebaseEnabled", fileUploadService.isFirebaseEnabled(),
            "message", fileUploadService.isFirebaseEnabled() 
                ? "Firebase Storage is active - files are stored in the cloud" 
                : "Using local storage - files will be lost on redeploy"
        ));
    }

    @GetMapping("/{*relativePath}")
    public ResponseEntity<Resource> serveFile(@PathVariable String relativePath) {
        try {
            // Check if it's a Firebase URL - redirect to it
            if (relativePath.startsWith("https://firebasestorage.googleapis.com")) {
                return ResponseEntity.status(302)
                        .header("Location", relativePath)
                        .build();
            }
            
            String filePath = relativePath;
            if (filePath.startsWith("./")) {
                filePath = filePath.substring(2);
            }
            File file = new File("uploads/" + filePath);
            if (!file.exists() || !file.isFile()) {
                // File not found locally - might be Firebase URL stored incorrectly
                return ResponseEntity.notFound().build();
            }
            Resource resource = new FileSystemResource(file);
            String filename = file.getName();
            String contentType = "application/octet-stream";
            if (filename.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (filename.endsWith(".png")) {
                contentType = "image/png";
            } else if (filename.endsWith(".doc") || filename.endsWith(".docx")) {
                contentType = "application/msword";
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
