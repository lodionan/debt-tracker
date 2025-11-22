package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.model.Debt;
import com.businessrank.debttracker.service.DebtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debts")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://10.0.2.2:8080", "http://192.168.1.65:8080"})
public class DebtController {

    @Autowired
    private DebtService debtService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> createDebt(@RequestBody CreateDebtRequest request) {
        try {
            // Validate debt data before creation
            debtService.validateDebtCreation(request.getClientId(), request.getAmount(), request.getDescription());

            Debt debt = debtService.createDebt(
                request.getClientId(),
                request.getAmount(),
                request.getDescription(),
                request.getDueDate()
            );

            return ResponseEntity.ok(Map.of(
                "message", "Debt created successfully",
                "debt", Map.of(
                    "id", debt.getId(),
                    "clientId", debt.getClient().getId(),
                    "client", Map.of(
                        "id", debt.getClient().getId(),
                        "name", debt.getClient().getName(),
                        "phone", debt.getClient().getPhone(),
                        "email", debt.getClient().getEmail() != null ? debt.getClient().getEmail() : "",
                        "address", debt.getClient().getAddress() != null ? debt.getClient().getAddress() : ""
                    ),
                    "amount", debt.getTotalAmount(),
                    "remainingAmount", debt.getRemainingAmount(),
                    "description", debt.getDescription(),
                    "status", debt.getStatus(),
                    "createdAt", debt.getCreatedAt(),
                    "updatedAt", debt.getUpdatedAt()
                )
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    @GetMapping
    public ResponseEntity<List<Debt>> getDebts(Authentication authentication) {
        List<Debt> debts = debtService.getDebtsForUser(authentication);
        return ResponseEntity.ok(debts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDebt(@PathVariable Long id, Authentication authentication) {
        return debtService.getDebtById(id, authentication)
                .map(debt -> ResponseEntity.ok(debt))
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDebt(@PathVariable Long id, @RequestBody UpdateDebtRequest request) {
        try {
            // Validate debt data if provided
            if (request.getClientId() != null && request.getTotalAmount() != null && request.getDescription() != null) {
                debtService.validateDebtCreation(request.getClientId(), request.getTotalAmount(), request.getDescription());
            }

            Debt debt = debtService.updateDebt(id, request.getClientId(), request.getTotalAmount(), request.getDescription(), request.getDueDate());
            return ResponseEntity.ok(Map.of(
                "id", debt.getId(),
                "clientId", debt.getClient().getId(),
                "client", Map.of(
                    "id", debt.getClient().getId(),
                    "name", debt.getClient().getName(),
                    "phone", debt.getClient().getPhone(),
                    "email", debt.getClient().getEmail() != null ? debt.getClient().getEmail() : "",
                    "address", debt.getClient().getAddress() != null ? debt.getClient().getAddress() : ""
                ),
                "amount", debt.getTotalAmount(),
                "remainingAmount", debt.getRemainingAmount(),
                "description", debt.getDescription(),
                "status", debt.getStatus(),
                "createdAt", debt.getCreatedAt(),
                "updatedAt", debt.getUpdatedAt()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/archive")
    public ResponseEntity<?> archiveDebt(@PathVariable Long id) {
        try {
            debtService.archiveDebt(id);
            return ResponseEntity.ok(Map.of("message", "Debt archived successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/unarchive")
    public ResponseEntity<?> unarchiveDebt(@PathVariable Long id) {
        try {
            debtService.unarchiveDebt(id);
            return ResponseEntity.ok(Map.of("message", "Debt unarchived successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/archived")
    public ResponseEntity<List<Debt>> getArchivedDebts() {
        List<Debt> debts = debtService.getArchivedDebts();
        return ResponseEntity.ok(debts);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDebt(@PathVariable Long id) {
        try {
            debtService.deleteDebt(id);
            return ResponseEntity.ok(Map.of("message", "Debt deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    // Advanced search and filtering endpoints
    @GetMapping("/search")
    public ResponseEntity<?> searchDebts(@RequestParam String q, Authentication authentication) {
        try {
            List<Debt> debts = debtService.searchDebts(q, authentication);
            return ResponseEntity.ok(debts);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getDebtsByStatus(@PathVariable Debt.Status status, Authentication authentication) {
        try {
            List<Debt> debts = debtService.getDebtsByStatus(status, authentication);
            return ResponseEntity.ok(debts);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    @GetMapping("/amount-range")
    public ResponseEntity<?> getDebtsByAmountRange(
            @RequestParam BigDecimal min,
            @RequestParam BigDecimal max,
            Authentication authentication) {
        try {
            List<Debt> debts = debtService.getDebtsByAmountRange(min, max, authentication);
            return ResponseEntity.ok(debts);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    // Statistics endpoint
    @GetMapping("/statistics")
    public ResponseEntity<?> getDebtStatistics(Authentication authentication) {
        try {
            DebtService.DebtStatistics stats = debtService.getDebtStatistics(authentication);
            return ResponseEntity.ok(Map.of(
                "totalActiveAmount", stats.getTotalActiveAmount(),
                "totalRemainingAmount", stats.getTotalRemainingAmount(),
                "activeCount", stats.getActiveCount(),
                "settledCount", stats.getSettledCount(),
                "averageAmount", stats.getAverageAmount()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    // Bulk operations endpoints
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/bulk/settle")
    public ResponseEntity<?> settleMultipleDebts(@RequestBody BulkOperationRequest request) {
        try {
            DebtService.BulkOperationResult result = debtService.markMultipleDebtsAsSettled(request.getDebtIds());
            return ResponseEntity.ok(Map.of(
                "message", "Bulk settle operation completed",
                "successCount", result.getSuccessCount(),
                "failureCount", result.getFailureCount(),
                "errors", result.getErrors()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/bulk/delete")
    public ResponseEntity<?> deleteMultipleDebts(@RequestBody BulkOperationRequest request) {
        try {
            DebtService.BulkOperationResult result = debtService.deleteMultipleDebts(request.getDebtIds());
            return ResponseEntity.ok(Map.of(
                "message", "Bulk delete operation completed",
                "successCount", result.getSuccessCount(),
                "failureCount", result.getFailureCount(),
                "errors", result.getErrors()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    // Priority management endpoint
    @GetMapping("/priority/high")
    public ResponseEntity<?> getHighPriorityDebts(Authentication authentication) {
        try {
            List<Debt> debts = debtService.getHighPriorityDebts(authentication);
            return ResponseEntity.ok(debts);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    // Validation endpoint
    @PostMapping("/validate")
    public ResponseEntity<?> validateDebt(@RequestBody CreateDebtRequest request) {
        try {
            debtService.validateDebtCreation(request.getClientId(), request.getAmount(), request.getDescription());
            return ResponseEntity.ok(Map.of("valid", true, "message", "Debt data is valid"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", e.getMessage() != null ? e.getMessage() : "Error desconocido"));
        }
    }

    public static class CreateDebtRequest {
        private Long clientId;
        private BigDecimal amount;
        private String description;
        private String dueDate;

        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public BigDecimal getTotalAmount() { return amount; } // For backward compatibility
        public void setTotalAmount(BigDecimal totalAmount) { this.amount = totalAmount; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getDueDate() { return dueDate; }
        public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    }

    public static class UpdateDebtRequest {
        private Long clientId;
        private BigDecimal totalAmount;
        private String description;
        private String dueDate;

        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getDueDate() { return dueDate; }
        public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    }

    public static class BulkOperationRequest {
        private List<Long> debtIds;

        public List<Long> getDebtIds() { return debtIds; }
        public void setDebtIds(List<Long> debtIds) { this.debtIds = debtIds; }
    }
}