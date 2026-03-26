package com.shreesamarth.enterprise.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Bucket;
import com.google.cloud.storage.Storage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class FileUploadService {

    @Value("${firebase.bucket.name:shree-samarth-d9ed1.appspot.com}")
    private String bucketName;

    private final Storage storage;
    private final Bucket bucket;

    @Autowired
    public FileUploadService(Storage storage, @Autowired(required = false) Bucket bucket) {
        this.storage = storage;
        this.bucket = bucket;
    }

    /**
     * Upload file to Firebase Storage
     * @param file The multipart file to upload
     * @param folder The folder in Firebase (e.g., "documents", "bills", "driver-docs")
     * @return The public URL of the uploaded file
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (bucket == null) {
            log.warn("Firebase Bucket not initialized, falling back to local storage");
            return uploadToLocal(file, folder);
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String fileName = UUID.randomUUID() + "_" + originalName.replaceAll("\\s+", "_");
        String firebasePath = folder + "/" + fileName;

        try {
            bucket.create(firebasePath, file.getBytes());

            // Return the public URL with proper encoding
            String encodedPath = URLEncoder.encode(firebasePath, StandardCharsets.UTF_8.toString()).replace("+", "%20");
            String publicUrl = String.format("https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                bucketName, encodedPath);
            
            log.info("File uploaded to Firebase: {}", firebasePath);
            return publicUrl;
        } catch (Exception e) {
            log.error("Failed to upload to Firebase, falling back to local: {}", e.getMessage());
            return uploadToLocal(file, folder);
        }
    }

    /**
     * Fallback method to upload to local storage
     */
    private String uploadToLocal(MultipartFile file, String folder) throws IOException {
        String uploadDir = "./uploads/" + folder;
        Files.createDirectories(Paths.get(uploadDir));
        
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String fileName = UUID.randomUUID() + "_" + originalName.replaceAll("\\s+", "_");
        Path filePath = Paths.get(uploadDir, fileName);
        Files.write(filePath, file.getBytes());
        
        log.info("File uploaded locally: {}", filePath);
        // Important: Return path without ./uploads/ prefix so FileController can serve it
        return folder + "/" + fileName;
    }

    /**
     * Delete file from Firebase Storage or local
     */
    public boolean deleteFile(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return false;
        }

        // Check if it's a local file
        if (!filePath.startsWith("https://")) {
            try {
                String localPath = filePath.startsWith("uploads/") ? filePath : "uploads/" + filePath;
                Files.deleteIfExists(Paths.get(localPath));
                log.info("Local file deleted: {}", localPath);
                return true;
            } catch (IOException e) {
                log.error("Failed to delete local file: {}", e.getMessage());
                return false;
            }
        }

        // It's a Firebase URL
        if (storage != null && bucketName != null) {
            try {
                // Extract the path from Firebase URL
                String path = filePath.contains("/o/") 
                    ? filePath.split("/o/")[1].split("\\?")[0]
                    : null;
                
                if (path != null) {
                    path = java.net.URLDecoder.decode(path, StandardCharsets.UTF_8.toString());
                    BlobId blobId = BlobId.of(bucketName, path);
                    storage.delete(blobId);
                    log.info("Firebase file deleted: {}", path);
                    return true;
                }
            } catch (Exception e) {
                log.error("Failed to delete Firebase file: {}", e.getMessage());
            }
        }
        return false;
    }

    public boolean isFirebaseEnabled() {
        return bucket != null;
    }
}
