package com.shreesamarth.enterprise.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = {"https://shree-samart-fleet-managment-eta.vercel.app", "http://localhost:5173"})
public class FileController {

    @GetMapping("/{*relativePath}")
    public ResponseEntity<Resource> serveFile(@PathVariable String relativePath) {
        try {
            String filePath = relativePath;
            if (filePath.startsWith("./")) {
                filePath = filePath.substring(2);
            }
            File file = new File("uploads/" + filePath);
            if (!file.exists() || !file.isFile()) {
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
