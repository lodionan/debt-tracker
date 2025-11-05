package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.model.Payment;
import com.businessrank.debttracker.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping
    public ResponseEntity<?> addPayment(@RequestBody AddPaymentRequest request, Authentication authentication) {
        try {
            Payment payment = paymentService.addPayment(
                request.getDebtId(),
                request.getAmount(),
                request.getPaymentMethod(),
                request.getNotes(),
                authentication
            );

            return ResponseEntity.ok(Map.of(
                "message", "Payment added successfully",
                "payment", Map.of(
                    "id", payment.getId(),
                    "debtId", payment.getDebt().getId(),
                    "amount", payment.getAmount(),
                    "paymentMethod", payment.getPaymentMethod(),
                    "paymentDate", payment.getPaymentDate(),
                    "notes", payment.getNotes()
                )
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getPayments(Authentication authentication) {
        List<Payment> payments = paymentService.getPaymentsForUser(authentication);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/debt/{debtId}")
    public ResponseEntity<List<Payment>> getPaymentsByDebt(@PathVariable Long debtId, Authentication authentication) {
        List<Payment> payments = paymentService.getPaymentsByDebt(debtId, authentication);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPayment(@PathVariable Long id, Authentication authentication) {
        return paymentService.getPaymentById(id, authentication)
                .map(payment -> ResponseEntity.ok(payment))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayment(@PathVariable Long id, @RequestBody UpdatePaymentRequest request) {
        try {
            Payment payment = paymentService.updatePayment(
                id,
                request.getAmount(),
                request.getPaymentMethod(),
                request.getNotes()
            );
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePayment(@PathVariable Long id) {
        try {
            paymentService.deletePayment(id);
            return ResponseEntity.ok(Map.of("message", "Payment deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class AddPaymentRequest {
        private Long debtId;
        private BigDecimal amount;
        private Payment.PaymentMethod paymentMethod;
        private String notes;

        public Long getDebtId() { return debtId; }
        public void setDebtId(Long debtId) { this.debtId = debtId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public Payment.PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(Payment.PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class UpdatePaymentRequest {
        private BigDecimal amount;
        private Payment.PaymentMethod paymentMethod;
        private String notes;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public Payment.PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(Payment.PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}