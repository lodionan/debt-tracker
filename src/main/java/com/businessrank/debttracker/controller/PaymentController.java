package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.model.Payment;
import com.businessrank.debttracker.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://10.0.2.2:8080", "http://192.168.1.65:8080"})
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addPayment(@RequestBody AddPaymentRequest request, Authentication authentication) {
        try {
            // Validate payment data before creation
            paymentService.validatePaymentCreation(request.getDebtId(), request.getAmount());

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
                    "notes", payment.getNotes() != null ? payment.getNotes() : ""
                )
            ));
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al reversar pago";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
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
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error en operación masiva de pagos";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePayment(@PathVariable Long id) {
        try {
            paymentService.deletePayment(id);
            return ResponseEntity.ok(Map.of("message", "Payment deleted successfully"));
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al filtrar pagos por método";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    // Advanced search and filtering endpoints
    @GetMapping("/search")
    public ResponseEntity<?> searchPayments(@RequestParam String q, Authentication authentication) {
        try {
            List<Payment> payments = paymentService.searchPayments(q, authentication);
            return ResponseEntity.ok(payments);
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al buscar pagos";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    @GetMapping("/method/{method}")
    public ResponseEntity<?> getPaymentsByMethod(@PathVariable Payment.PaymentMethod method, Authentication authentication) {
        try {
            List<Payment> payments = paymentService.getPaymentsByMethod(method, authentication);
            return ResponseEntity.ok(payments);
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al actualizar el pago";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    @GetMapping("/amount-range")
    public ResponseEntity<?> getPaymentsByAmountRange(
            @RequestParam BigDecimal min,
            @RequestParam BigDecimal max,
            Authentication authentication) {
        try {
            List<Payment> payments = paymentService.getPaymentsByAmountRange(min, max, authentication);
            return ResponseEntity.ok(payments);
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al filtrar pagos por rango de monto";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    // Statistics endpoint
    @GetMapping("/statistics")
    public ResponseEntity<?> getPaymentStatistics(Authentication authentication) {
        try {
            PaymentService.PaymentStatistics stats = paymentService.getPaymentStatistics(authentication);
            return ResponseEntity.ok(Map.of(
                "totalAmount", stats.getTotalAmount(),
                "totalCount", stats.getTotalCount(),
                "averageAmount", stats.getAverageAmount(),
                "growthRate", stats.getGrowthRate()
            ));
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al procesar la solicitud";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    // Bulk operations endpoints
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/bulk/delete")
    public ResponseEntity<?> deleteMultiplePayments(@RequestBody BulkOperationRequest request) {
        try {
            PaymentService.BulkOperationResult result = paymentService.deleteMultiplePayments(request.getPaymentIds());
            return ResponseEntity.ok(Map.of(
                "message", "Bulk delete operation completed",
                "successCount", result.getSuccessCount(),
                "failureCount", result.getFailureCount(),
                "errors", result.getErrors()
            ));
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al eliminar el pago";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    // Enhanced update endpoint with proper recalculation
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/recalculate")
    public ResponseEntity<?> updatePaymentWithRecalculation(@PathVariable Long id, @RequestBody UpdatePaymentRequest request) {
        try {
            Payment payment = paymentService.updatePaymentWithRecalculation(
                id,
                request.getAmount(),
                request.getPaymentMethod(),
                request.getNotes()
            );
            return ResponseEntity.ok(Map.of(
                "id", payment.getId(),
                "amount", payment.getAmount(),
                "paymentMethod", payment.getPaymentMethod(),
                "notes", payment.getNotes(),
                "paymentDate", payment.getPaymentDate()
            ));
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al obtener estadísticas de pagos";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    // Recent payments for dashboard
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentPayments(@RequestParam(defaultValue = "10") int limit, Authentication authentication) {
        try {
            List<Payment> payments = paymentService.getRecentPayments(authentication, limit);
            return ResponseEntity.ok(payments);
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al recalcular pago";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    // Payment reversal endpoint
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/reverse")
    public ResponseEntity<?> reversePayment(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String reason = request.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                reason = "Reversión administrativa";
            }

            Payment reversedPayment = paymentService.reversePayment(id, reason);
            return ResponseEntity.ok(Map.of(
                "message", "Payment reversed successfully",
                "reversedPaymentId", reversedPayment.getId(),
                "reason", reason
            ));
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al obtener pagos recientes";
            return ResponseEntity.badRequest().body(Map.of("error", errorMessage));
        }
    }

    // Validation endpoint
    @PostMapping("/validate")
    public ResponseEntity<?> validatePayment(@RequestBody AddPaymentRequest request) {
        try {
            paymentService.validatePaymentCreation(request.getDebtId(), request.getAmount());
            return ResponseEntity.ok(Map.of("valid", true, "message", "Payment data is valid"));
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Error al validar pago";
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", errorMessage));
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

    public static class BulkOperationRequest {
        private List<Long> paymentIds;

        public List<Long> getPaymentIds() { return paymentIds; }
        public void setPaymentIds(List<Long> paymentIds) { this.paymentIds = paymentIds; }
    }
}