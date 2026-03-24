package com.shreesamarth.enterprise.service;

import com.google.cloud.storage.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.IOException;
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

    @Value("${firebase.credentials.json:}")
    private String firebaseCredentialsJson;

    private Storage storage;
    private Bucket bucket;
    private boolean firebaseEnabled = false;

    @PostConstruct
    public void initialize() {
        try {
            log.info("=== Firebase FileUploadService initialization started ===");
            log.info("Firebase credentials JSON is set: {}", firebaseCredentialsJson != null && !firebaseCredentialsJson.isEmpty());
            
            if (FirebaseApp.getApps().isEmpty()) {
                GoogleCredentials credentials;
                
                // Check if credentials are provided as environment variable
                if (firebaseCredentialsJson != null && !firebaseCredentialsJson.isEmpty()) {
                    credentials = GoogleCredentials.fromStream(
                        new ByteArrayInputStream(firebaseCredentialsJson.getBytes(StandardCharsets.UTF_8))
                    );
                    log.info("Firebase FileUploadService initialized with environment variable credentials");
                } else {
                    // Try to load from classpath (for local development)
                    try {
                        credentials = GoogleCredentials.fromStream(
                            new ClassPathResource("firebase-service-account.json").getInputStream()
                        );
                        log.info("Firebase FileUploadService initialized with classpath credentials");
                    } catch (Exception e) {
                        log.error("Firebase credentials not found in FileUploadService. Using local storage. " +
                                 "Set FIREBASE_CREDENTIALS_JSON environment variable or add firebase-service-account.json to resources.");
                        log.error("Exception details: {}", e.getMessage());
                        return;
                    }
                }

                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase initialized successfully in FileUploadService!");
                this.storage = StorageOptions.getDefaultInstance().getService();
                this.bucket = storage.get(bucketName);
                this.firebaseEnabled = true;
            } else {
                // Firebase was already initialized by FirebaseConfig
                this.storage = StorageOptions.getDefaultInstance().getService();
                this.bucket = storage.get(bucketName);
                this.firebaseEnabled = true;
                log.info("Firebase already initialized by FirebaseConfig, FileUploadService using existing instance");
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase in FileUploadService: {}", e.getMessage());
        }
    }

    /**
     * Upload file to Firebase Storage
     * @param file The multipart file to upload
     * @param folder The folder in Firebase (e.g., "documents", "bills", "driver-docs")
     * @return The public URL of the uploaded file
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (!firebaseEnabled) {
            // Fallback to local storage
            return uploadToLocal(file, folder);
        }

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String firebasePath = folder + "/" + fileName;

        try {
            BlobId blobId = BlobId.of(bucketName, firebasePath);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();

            bucket.create(firebasePath, file.getBytes());

            // Return the public URL
            String publicUrl = String.format("https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                bucketName, firebasePath.replace("/", "%2F"));
            
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
        
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, fileName);
        Files.write(filePath, file.getBytes());
        
        log.info("File uploaded locally: {}", filePath);
        return filePath.toString();
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
                Files.deleteIfExists(Paths.get(filePath));
                log.info("Local file deleted: {}", filePath);
                return true;
            } catch (IOException e) {
                log.error("Failed to delete local file: {}", e.getMessage());
                return false;
            }
        }

        // It's a Firebase URL
        if (firebaseEnabled) {
            try {
                // Extract the path from Firebase URL
                String path = filePath.contains("/o/") 
                    ? filePath.split("/o/")[1].split("\\?")[0]
                    : null;
                
                if (path != null) {
                    path = path.replace("%2F", "/");
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
        return firebaseEnabled;
    }
}
