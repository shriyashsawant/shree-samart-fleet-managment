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
    public ResponseEntity<?> serveFile(@PathVariable String relativePath) {
        try {
            String originalPath = relativePath;
            
            // Check if it's a Firebase URL - redirect to it
            if (relativePath.startsWith("https://firebasestorage.googleapis.com")) {
                return ResponseEntity.status(302)
                        .header("Location", relativePath)
                        .build();
            }
            
            // Try local file first
            String filePath = relativePath;
            if (filePath.startsWith("/")) {
                filePath = filePath.substring(1);
            }
            if (filePath.startsWith("./")) {
                filePath = filePath.substring(2);
            }
            
            // Normalize path to handle potential double slashes
            filePath = filePath.replace("//", "/");
            
            File file = new File("uploads/" + filePath);
            if (file.exists() && file.isFile()) {
                Resource resource = new FileSystemResource(file);
                String filename = file.getName();
                String contentType = guessContentType(filename);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            }
            
            // File not found locally - return error with helpful message
            return ResponseEntity.status(404).body(Map.of(
                "error", "File not found",
                "path", originalPath,
                "suggestion", "Re-upload the file - it may have been stored on a previous server instance that no longer exists"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    private String guessContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        if (filename.endsWith(".pdf")) return "application/pdf";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
        if (filename.endsWith(".png")) return "image/png";
        if (filename.endsWith(".doc")) return "application/msword";
        if (filename.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        return "application/octet-stream";
    }
}
