package com.businessrank.debttracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DebtTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DebtTrackerApplication.class, args);
    }
}