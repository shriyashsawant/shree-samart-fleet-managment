package com.shreesamarth.enterprise.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.env.EnvironmentPostProcessor;
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
        
        System.out.println("=== DATABASE CONFIG ===");
        System.out.println("DATABASE_URL env var: " + databaseUrl);
        
        if (databaseUrl != null && !databaseUrl.isEmpty() && !databaseUrl.equals("jdbc:postgresql://localhost:5432/shreesamarth")) {
            // Convert postgresql:// to jdbc:postgresql://
            String jdbcUrl = "jdbc:" + databaseUrl;
            
            // Parse username and password
            String withoutPrefix = databaseUrl.substring(databaseUrl.indexOf("://") + 3);
            String[] hostParts = withoutPrefix.split("@");
            String[] userPass = hostParts[0].split(":");
            
            String username = userPass.length > 0 ? userPass[0] : "postgres";
            String password = userPass.length > 1 ? userPass[1] : "";
            
            // Extract host from the URL
            String hostAndDb = hostParts[1];
            
            System.out.println("JDBC URL: " + jdbcUrl);
            System.out.println("Username: " + username);
            System.out.println("========================");
            
            return DataSourceBuilder.create()
                    .url(jdbcUrl)
                    .username(username)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
        }
        
        // Default: H2 for local development
        System.out.println("Using default H2 database");
        System.out.println("========================");
        return DataSourceBuilder.create()
                .url("jdbc:h2:mem:shreesamarth")
                .username("sa")
                .password("")
                .driverClassName("org.h2.Driver")
                .build();
    }
}
