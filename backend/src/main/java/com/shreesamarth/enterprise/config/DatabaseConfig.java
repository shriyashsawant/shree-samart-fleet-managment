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
        
        System.out.println("=== DATABASE CONFIG ===");
        System.out.println("DATABASE_URL env var: " + databaseUrl);
        
        if (databaseUrl != null && !databaseUrl.isEmpty() && !databaseUrl.equals("jdbc:postgresql://localhost:5432/shreesamarth")) {
            // Parse the URL - handle both formats
            String cleanUrl = databaseUrl;
            String username = "postgres";
            String password = "";
            
            // If URL starts with jdbc:postgresql://, it has embedded credentials
            if (databaseUrl.contains("@")) {
                // Format: jdbc:postgresql://user:pass@host:port/db
                // or: postgresql://user:pass@host:port/db
                String urlWithoutProtocol = databaseUrl;
                if (urlWithoutProtocol.startsWith("jdbc:")) {
                    urlWithoutProtocol = urlWithoutProtocol.substring(5); // remove "jdbc:"
                }
                
                // Now we have: postgresql://user:pass@host:port/db
                // Remove the protocol prefix
                if (urlWithoutProtocol.startsWith("postgresql://")) {
                    urlWithoutProtocol = urlWithoutProtocol.substring("postgresql://".length());
                } else if (urlWithoutProtocol.startsWith("postgres://")) {
                    urlWithoutProtocol = urlWithoutProtocol.substring("postgres://".length());
                }
                
                // Now we have: user:pass@host:port/db
                String[] userPassHost = urlWithoutProtocol.split("@");
                String credentials = userPassHost[0];
                String hostAndDb = userPassHost[1];
                
                // Split credentials into user and password
                String[] userPass = credentials.split(":");
                username = userPass[0];
                password = userPass.length > 1 ? userPass[1] : "";
                
                // Build clean JDBC URL
                cleanUrl = "jdbc:postgresql://" + hostAndDb;
            } else {
                // No embedded credentials
                cleanUrl = databaseUrl.startsWith("jdbc:") ? databaseUrl : "jdbc:" + databaseUrl;
            }
            
            System.out.println("JDBC URL: " + cleanUrl);
            System.out.println("Username: " + username);
            System.out.println("Password: " + (password.isEmpty() ? "(empty)" : "****"));
            System.out.println("========================");
            
            return DataSourceBuilder.create()
                    .url(cleanUrl)
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
