package com.shreesamarth.enterprise;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ShreeSamarthApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShreeSamarthApplication.class, args);
    }
}
