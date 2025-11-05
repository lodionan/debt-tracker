package com.businessrank.debttracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentGatewayService {

    @Value("${clip.api.key}")
    private String clipApiKey;

    @Value("${clip.api.secret}")
    private String clipApiSecret;

    @Value("${clip.merchant.id}")
    private String clipMerchantId;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String getAccessToken() throws Exception {
        String url = "https://api.payclip.com/oauth/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = String.format(
            "grant_type=client_credentials&client_id=%s&client_secret=%s",
            clipApiKey, clipApiSecret
        );

        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return jsonNode.get("access_token").asText();
        } else {
            throw new RuntimeException("Failed to get CLIP access token");
        }
    }

    public ClipPaymentResponse createPaymentIntent(BigDecimal amount, String description) throws Exception {
        String accessToken = getAccessToken();
        String url = "https://api.payclip.com/v1/payment_intents";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("amount", amount.multiply(BigDecimal.valueOf(100)).longValue()); // Convert to cents
        requestBody.put("currency", "MXN");
        requestBody.put("description", description);
        requestBody.put("merchant_id", clipMerchantId);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode() == HttpStatus.CREATED) {
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return new ClipPaymentResponse(
                jsonNode.get("id").asText(),
                jsonNode.get("client_secret").asText(),
                jsonNode.get("amount").asLong(),
                jsonNode.get("currency").asText(),
                jsonNode.get("status").asText()
            );
        } else {
            throw new RuntimeException("Failed to create CLIP payment intent: " + response.getBody());
        }
    }

    public ClipPaymentStatus checkPaymentStatus(String paymentIntentId) throws Exception {
        String accessToken = getAccessToken();
        String url = String.format("https://api.payclip.com/v1/payment_intents/%s", paymentIntentId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return new ClipPaymentStatus(
                jsonNode.get("id").asText(),
                jsonNode.get("status").asText(),
                jsonNode.get("amount").asLong(),
                jsonNode.has("paid_at") ? jsonNode.get("paid_at").asText() : null
            );
        } else {
            throw new RuntimeException("Failed to check payment status: " + response.getBody());
        }
    }

    // For development/demo purposes - simulate payment processing
    public boolean processCashPayment(BigDecimal amount, String reference) {
        // In a real implementation, this might integrate with POS systems
        // For now, just validate the amount is positive
        return amount.compareTo(BigDecimal.ZERO) > 0;
    }

    // Response DTOs for CLIP
    public static class ClipPaymentResponse {
        private final String id;
        private final String clientSecret;
        private final Long amount;
        private final String currency;
        private final String status;

        public ClipPaymentResponse(String id, String clientSecret, Long amount, String currency, String status) {
            this.id = id;
            this.clientSecret = clientSecret;
            this.amount = amount;
            this.currency = currency;
            this.status = status;
        }

        public String getId() { return id; }
        public String getClientSecret() { return clientSecret; }
        public Long getAmount() { return amount; }
        public String getCurrency() { return currency; }
        public String getStatus() { return status; }
    }

    public static class ClipPaymentStatus {
        private final String id;
        private final String status;
        private final Long amount;
        private final String paidAt;

        public ClipPaymentStatus(String id, String status, Long amount, String paidAt) {
            this.id = id;
            this.status = status;
            this.amount = amount;
            this.paidAt = paidAt;
        }

        public String getId() { return id; }
        public String getStatus() { return status; }
        public Long getAmount() { return amount; }
        public String getPaidAt() { return paidAt; }
    }
}