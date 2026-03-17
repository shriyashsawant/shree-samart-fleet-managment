package com.shreesamarth.enterprise.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.Objects;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        
        if (databaseUrl != null && !databaseUrl.isEmpty()) {
            // Parse Render's DATABASE_URL: postgres://username:password@host:port/database
            // Convert to Spring's format: jdbc:postgresql://host:port/database
            String convertedUrl = convertRenderDatabaseUrl(databaseUrl);
            
            // Parse username and password from the URL
            String[] parts = parseDatabaseUrl(databaseUrl);
            String username = parts[0];
            String password = parts[1];
            
            return DataSourceBuilder.create()
                    .url(convertedUrl)
                    .username(username)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
        }
        
        // Default: H2 in-memory database for local development
        return DataSourceBuilder.create()
                .url("jdbc:h2:mem:shreesamarth")
                .username("sa")
                .password("")
                .driverClassName("org.h2.Driver")
                .build();
    }
    
    private String convertRenderDatabaseUrl(String databaseUrl) {
        // Remove postgres:// prefix and add jdbc:postgresql://
        return "jdbc:postgresql://" + databaseUrl.substring("postgres://".length());
    }
    
    private String[] parseDatabaseUrl(String databaseUrl) {
        // Format: postgres://username:password@host:port/database
        String withoutPrefix = databaseUrl.substring("postgres://".length());
        String[] hostAndDb = withoutPrefix.split("@");
        String[] userPass = hostAndDb[0].split(":");
        
        String username = userPass[0];
        String password = userPass.length > 1 ? userPass[1] : "";
        
        return new String[]{username, password};
    }
}
