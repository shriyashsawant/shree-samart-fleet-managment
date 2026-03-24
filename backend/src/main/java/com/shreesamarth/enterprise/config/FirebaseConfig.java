package com.shreesamarth.enterprise.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Bucket;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials.json:}")
    private String firebaseCredentialsJson;

    @Value("${firebase.bucket.name:shree-samarth-d9ed1.appspot.com}")
    private String bucketName;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                GoogleCredentials credentials;
                
                // Check if credentials are provided as environment variable
                if (firebaseCredentialsJson != null && !firebaseCredentialsJson.isEmpty()) {
                    credentials = GoogleCredentials.fromStream(
                        new ByteArrayInputStream(firebaseCredentialsJson.getBytes(StandardCharsets.UTF_8))
                    );
                    log.info("Firebase initialized with environment variable credentials");
                } else {
                    // Try to load from classpath (for local development)
                    try {
                        credentials = GoogleCredentials.fromStream(
                            new ClassPathResource("firebase-service-account.json").getInputStream()
                        );
                        log.info("Firebase initialized with classpath credentials");
                    } catch (Exception e) {
                        log.warn("Firebase credentials not found. File uploads will use local storage. " +
                                 "Set FIREBASE_CREDENTIALS_JSON environment variable or add firebase-service-account.json to resources.");
                        log.warn("Exception details: {}", e.getMessage());
                        return;
                    }
                }

                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase initialized successfully!");
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase: {}", e.getMessage());
        }
    }

    @Bean
    public Storage storage() {
        return StorageOptions.getDefaultInstance().getService();
    }

    @Bean
    public Bucket bucket() {
        return storage().get(bucketName);
    }
}
