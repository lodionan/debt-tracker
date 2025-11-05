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
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class DebtController {

    @Autowired
    private DebtService debtService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> createDebt(@RequestBody CreateDebtRequest request) {
        try {
            Debt debt = debtService.createDebt(
                request.getClientId(),
                request.getTotalAmount(),
                request.getDescription()
            );

            return ResponseEntity.ok(Map.of(
                "message", "Debt created successfully",
                "debt", Map.of(
                    "id", debt.getId(),
                    "clientId", debt.getClient().getId(),
                    "totalAmount", debt.getTotalAmount(),
                    "remainingAmount", debt.getRemainingAmount(),
                    "status", debt.getStatus(),
                    "description", debt.getDescription()
                )
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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
            Debt debt = debtService.updateDebt(id, request.getTotalAmount(), request.getDescription());
            return ResponseEntity.ok(debt);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDebt(@PathVariable Long id) {
        try {
            debtService.deleteDebt(id);
            return ResponseEntity.ok(Map.of("message", "Debt deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class CreateDebtRequest {
        private Long clientId;
        private BigDecimal totalAmount;
        private String description;

        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class UpdateDebtRequest {
        private BigDecimal totalAmount;
        private String description;

        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}