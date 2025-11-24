package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://10.0.2.2:8080", "http://192.168.1.65:8080"})
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/test")
    public ResponseEntity<?> sendTestNotification() {
        try {
            notificationService.sendSystemNotification("TEST", "Esta es una notificación de prueba del sistema");
            return ResponseEntity.ok(Map.of("message", "Test notification sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/bulk")
    public ResponseEntity<?> sendBulkNotification(@RequestBody BulkNotificationRequest request) {
        try {
            notificationService.sendBulkNotification(request.getSubject(), request.getMessage());
            return ResponseEntity.ok(Map.of("message", "Bulk notification sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/trigger-weekly-reminders")
    public ResponseEntity<?> triggerWeeklyReminders() {
        try {
            notificationService.sendWeeklyPaymentReminders();
            return ResponseEntity.ok(Map.of("message", "Weekly reminders triggered successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/trigger-overdue-check")
    public ResponseEntity<?> triggerOverdueCheck() {
        try {
            notificationService.checkAndSendOverdueAlerts();
            return ResponseEntity.ok(Map.of("message", "Overdue check completed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class BulkNotificationRequest {
        private String subject;
        private String message;

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}