package com.shreesamarth.enterprise.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        
        if (databaseUrl != null && !databaseUrl.isEmpty()) {
            // Parse Render/Supabase DATABASE_URL: postgres://username:password@host:port/database
            // Convert to Spring's format: jdbc:postgresql://host:port/database
            String convertedUrl = convertToJdbcUrl(databaseUrl);
            
            // Parse username and password from the URL
            String[] parts = parseDatabaseCredentials(databaseUrl);
            String username = parts[0];
            String password = parts[1];
            
            System.out.println("=== DATABASE CONFIG ===");
            System.out.println("Original URL: " + databaseUrl);
            System.out.println("Converted URL: " + convertedUrl);
            System.out.println("Username: " + username);
            System.out.println("======================");
            
            return DataSourceBuilder.create()
                    .url(convertedUrl)
                    .username(username)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
        }
        
        // Default: H2 in-memory database for local development
        System.out.println("=== DATABASE CONFIG ===");
        System.out.println("Using H2 in-memory database");
        System.out.println("======================");
        return DataSourceBuilder.create()
                .url("jdbc:h2:mem:shreesamarth")
                .username("sa")
                .password("")
                .driverClassName("org.h2.Driver")
                .build();
    }
    
    private String convertToJdbcUrl(String databaseUrl) {
        // Convert postgres:// to jdbc:postgresql://
        if (databaseUrl.startsWith("postgres://")) {
            return "jdbc:" + databaseUrl;
        } else if (databaseUrl.startsWith("postgresql://")) {
            return "jdbc:" + databaseUrl;
        }
        return databaseUrl;
    }
    
    private String[] parseDatabaseCredentials(String databaseUrl) {
        // Format: postgres://username:password@host:port/database
        try {
            String withoutPrefix = databaseUrl.substring(databaseUrl.indexOf("://") + 3);
            String[] hostAndDb = withoutPrefix.split("@");
            if (hostAndDb.length < 2) {
                return new String[]{"postgres", ""};
            }
            
            String[] userPass = hostAndDb[0].split(":");
            String username = userPass.length > 0 ? userPass[0] : "postgres";
            String password = userPass.length > 1 ? userPass[1] : "";
            
            return new String[]{username, password};
        } catch (Exception e) {
            System.out.println("Error parsing database URL: " + e.getMessage());
            return new String[]{"postgres", ""};
        }
    }
}
