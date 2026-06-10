package com.decidely.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class DecidelyApplication {

    public static void main(String[] args) {
        SpringApplication.run(DecidelyApplication.class, args);
    }
}