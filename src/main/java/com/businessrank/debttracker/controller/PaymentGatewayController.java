package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.service.PaymentGatewayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/gateway")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://10.0.2.2:8080", "http://192.168.1.65:8080"})
public class PaymentGatewayController {

    @Autowired
    private PaymentGatewayService paymentGatewayService;

    @PostMapping("/create-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody CreatePaymentIntentRequest request) {
        try {
            PaymentGatewayService.ClipPaymentResponse response =
                paymentGatewayService.createPaymentIntent(request.getAmount(), request.getDescription());

            return ResponseEntity.ok(Map.of(
                "paymentIntentId", response.getId(),
                "clientSecret", response.getClientSecret(),
                "amount", response.getAmount(),
                "currency", response.getCurrency(),
                "status", response.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status/{paymentIntentId}")
    public ResponseEntity<?> checkPaymentStatus(@PathVariable String paymentIntentId) {
        try {
            PaymentGatewayService.ClipPaymentStatus status = paymentGatewayService.checkPaymentStatus(paymentIntentId);
            return ResponseEntity.ok(Map.of(
                "id", status.getId(),
                "status", status.getStatus(),
                "amount", status.getAmount(),
                "paidAt", status.getPaidAt()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/config")
    public ResponseEntity<?> getPaymentConfig() {
        // TODO: Configure real CLIP merchant ID in environment variables
        // Set CLIP_MERCHANT_ID environment variable with your actual merchant ID
        String merchantId = System.getenv("CLIP_MERCHANT_ID");
        if (merchantId == null || merchantId.isEmpty()) {
            // For development/testing, return a placeholder
            // In production, this should throw an error or return null
            merchantId = "configure_real_merchant_id";
        }

        return ResponseEntity.ok(Map.of("merchantId", merchantId));
    }

    @PostMapping("/cash")
    public ResponseEntity<?> processCashPayment(@RequestBody CashPaymentRequest request) {
        try {
            boolean success = paymentGatewayService.processCashPayment(request.getAmount(), request.getReference());

            if (success) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Pago en efectivo procesado correctamente",
                    "reference", request.getReference()
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Monto inválido"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Request DTOs
    public static class CreatePaymentIntentRequest {
        private BigDecimal amount;
        private String currency = "mxn";
        private String description;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class CashPaymentRequest {
        private BigDecimal amount;
        private String reference;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getReference() { return reference; }
        public void setReference(String reference) { this.reference = reference; }
    }
}