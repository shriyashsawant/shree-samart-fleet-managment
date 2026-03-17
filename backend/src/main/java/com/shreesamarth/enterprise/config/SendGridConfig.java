package com.shreesamarth.enterprise.config;

import com.sendgrid.SendGrid;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class SendGridConfig {

    @Value("${sendgrid.api.key}")
    private String apiKey;

    @Bean
    public SendGrid sendGrid() {
        return new SendGrid(apiKey);
    }
}
