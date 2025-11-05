package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<?> getDashboardData() {
        try {
            DashboardService.DashboardData data = dashboardService.getDashboardData();

            Map<String, Object> response = new HashMap<>();

            // Summary metrics
            response.put("summary", Map.of(
                "todayRevenue", data.getTodayRevenue(),
                "monthRevenue", data.getMonthRevenue(),
                "totalOutstandingDebt", data.getTotalOutstandingDebt(),
                "activeClients", data.getActiveClients(),
                "totalClients", data.getTotalClients()
            ));

            // Recent payments
            List<Map<String, Object>> recentPayments = data.getRecentPayments().stream()
                    .map(payment -> {
                        Map<String, Object> paymentMap = new HashMap<>();
                        paymentMap.put("id", payment.getId());
                        paymentMap.put("amount", payment.getAmount());
                        paymentMap.put("paymentMethod", payment.getPaymentMethod().toString());
                        paymentMap.put("paymentDate", payment.getPaymentDate());
                        paymentMap.put("clientName", payment.getDebt().getClient().getName());
                        paymentMap.put("debtDescription", payment.getDebt().getDescription() != null ?
                                        payment.getDebt().getDescription() : "Sin descripción");
                        return paymentMap;
                    })
                    .collect(Collectors.toList());
            response.put("recentPayments", recentPayments);

            // Top debtors
            List<Map<String, Object>> topDebtors = data.getTopDebtors().stream()
                    .map(debtor -> {
                        Map<String, Object> debtorMap = new HashMap<>();
                        debtorMap.put("clientId", debtor.getClient().getId());
                        debtorMap.put("clientName", debtor.getClient().getName());
                        debtorMap.put("outstandingDebt", debtor.getOutstandingDebt());
                        return debtorMap;
                    })
                    .collect(Collectors.toList());
            response.put("topDebtors", topDebtors);

            // Payment method distribution
            Map<String, Long> paymentMethodDistribution = data.getPaymentMethodDistribution().entrySet()
                    .stream()
                    .collect(Collectors.toMap(
                        entry -> entry.getKey().toString(),
                        Map.Entry::getValue
                    ));
            response.put("paymentMethodDistribution", paymentMethodDistribution);

            // Monthly trend
            List<Map<String, Object>> monthlyTrend = data.getMonthlyTrend().stream()
                    .map(monthData -> {
                        Map<String, Object> trendMap = new HashMap<>();
                        trendMap.put("month", monthData.getMonth().toString());
                        trendMap.put("revenue", monthData.getRevenue());
                        trendMap.put("paymentCount", monthData.getPaymentCount());
                        return trendMap;
                    })
                    .collect(Collectors.toList());
            response.put("monthlyTrend", monthlyTrend);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/kpis")
    public ResponseEntity<?> getKPIs() {
        try {
            DashboardService.DashboardData data = dashboardService.getDashboardData();

            // Calculate additional KPIs
            double averagePaymentPerClient = data.getActiveClients() > 0 ?
                data.getMonthRevenue().doubleValue() / data.getActiveClients() : 0;

            double debtToRevenueRatio = data.getMonthRevenue().doubleValue() > 0 ?
                (data.getTotalOutstandingDebt().doubleValue() / data.getMonthRevenue().doubleValue()) * 100 : 0;

            Map<String, Object> kpis = Map.of(
                "totalRevenue", data.getMonthRevenue(),
                "totalOutstandingDebt", data.getTotalOutstandingDebt(),
                "activeClients", data.getActiveClients(),
                "totalClients", data.getTotalClients(),
                "averagePaymentPerClient", Math.round(averagePaymentPerClient * 100.0) / 100.0,
                "debtToRevenueRatio", Math.round(debtToRevenueRatio * 100.0) / 100.0,
                "clientRetentionRate", data.getTotalClients() > 0 ?
                    Math.round((double) data.getActiveClients() / data.getTotalClients() * 10000.0) / 100.0 : 0
            );

            return ResponseEntity.ok(kpis);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}