package com.jobportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class JobPortalBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(JobPortalBackendApplication.class, args);
    }
}
