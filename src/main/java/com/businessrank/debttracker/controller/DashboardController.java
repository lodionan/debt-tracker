package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.repository.ClientRepository;
import com.businessrank.debttracker.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://10.0.2.2:8080", "http://192.168.1.65:8080"})
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private ClientRepository clientRepository;

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

    // Advanced dashboard endpoints
    @GetMapping("/client")
    public ResponseEntity<?> getClientDashboard(Authentication authentication) {
        try {
            // Get client from authentication
            com.businessrank.debttracker.security.UserPrincipal userPrincipal =
                (com.businessrank.debttracker.security.UserPrincipal) authentication.getPrincipal();

            if (userPrincipal.getRole() != com.businessrank.debttracker.model.User.Role.CLIENT) {
                return ResponseEntity.badRequest().body(Map.of("error", "Este endpoint es solo para clientes"));
            }

            // Find client by phone
            com.businessrank.debttracker.model.Client client =
                clientRepository.findByPhone(userPrincipal.getUsername()).orElse(null);

            if (client == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cliente no encontrado"));
            }

            DashboardService.ClientDashboardData data = dashboardService.getClientDashboardData(client);

            Map<String, Object> response = new HashMap<>();
            response.put("client", Map.of(
                "id", data.getClient().getId(),
                "name", data.getClient().getName(),
                "phone", data.getClient().getPhone()
            ));
            response.put("summary", Map.of(
                "totalDebtEver", data.getTotalDebtEver(),
                "totalPaid", data.getTotalPaid(),
                "currentOutstanding", data.getCurrentOutstanding(),
                "activeDebtsCount", data.getActiveDebtsCount(),
                "settledDebtsCount", data.getSettledDebtsCount(),
                "totalPaymentsCount", data.getTotalPaymentsCount()
            ));

            // Recent payments
            List<Map<String, Object>> recentPayments = data.getRecentPayments().stream()
                    .map(payment -> {
                        Map<String, Object> paymentMap = new HashMap<>();
                        paymentMap.put("id", payment.getId());
                        paymentMap.put("amount", payment.getAmount());
                        paymentMap.put("paymentMethod", payment.getPaymentMethod().toString());
                        paymentMap.put("paymentDate", payment.getPaymentDate());
                        paymentMap.put("debtDescription", payment.getDebt().getDescription() != null ?
                                payment.getDebt().getDescription() : "Sin descripción");
                        return paymentMap;
                    })
                    .collect(Collectors.toList());
            response.put("recentPayments", recentPayments);

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
    @GetMapping("/advanced-kpis")
    public ResponseEntity<?> getAdvancedKPIs() {
        try {
            DashboardService.AdvancedKPIs kpis = dashboardService.getAdvancedKPIs();

            Map<String, Object> response = new HashMap<>();
            response.put("revenue", Map.of(
                "currentMonth", kpis.getCurrentMonthRevenue(),
                "lastMonth", kpis.getLastMonthRevenue(),
                "growth", Math.round(kpis.getRevenueGrowth() * 100.0) / 100.0
            ));
            response.put("averagePayment", Map.of(
                "current", Math.round(kpis.getAvgPaymentCurrent() * 100.0) / 100.0,
                "lastMonth", Math.round(kpis.getAvgPaymentLast() * 100.0) / 100.0
            ));
            response.put("collectionRate", Math.round(kpis.getCollectionRate() * 100.0) / 100.0);
            response.put("clients", Map.of(
                "total", kpis.getTotalClients(),
                "active", kpis.getActiveClients(),
                "newThisMonth", kpis.getNewClientsThisMonth()
            ));
            response.put("paymentsThisMonth", kpis.getPaymentsThisMonth());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/performance")
    public ResponseEntity<?> getPerformanceMetrics(@RequestParam(defaultValue = "30") int days) {
        try {
            DashboardService.PerformanceMetrics metrics = dashboardService.getPerformanceMetrics(days);

            // Daily metrics
            List<Map<String, Object>> dailyMetrics = metrics.getDailyMetrics().stream()
                    .map(dm -> {
                        Map<String, Object> metricMap = new HashMap<>();
                        metricMap.put("date", dm.getDate().toString());
                        metricMap.put("revenue", dm.getRevenue());
                        metricMap.put("paymentCount", dm.getPaymentCount());
                        return metricMap;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("dailyMetrics", dailyMetrics);
            response.put("bestDay", metrics.getBestDay() != null ? Map.of(
                "date", metrics.getBestDay().getDate().toString(),
                "revenue", metrics.getBestDay().getRevenue(),
                "paymentCount", metrics.getBestDay().getPaymentCount()
            ) : null);
            response.put("worstDay", metrics.getWorstDay() != null ? Map.of(
                "date", metrics.getWorstDay().getDate().toString(),
                "revenue", metrics.getWorstDay().getRevenue(),
                "paymentCount", metrics.getWorstDay().getPaymentCount()
            ) : null);
            response.put("averages", Map.of(
                "dailyRevenue", Math.round(metrics.getAvgDailyRevenue() * 100.0) / 100.0,
                "dailyPayments", Math.round(metrics.getAvgDailyPayments() * 100.0) / 100.0
            ));
            response.put("totals", Map.of(
                "revenue", metrics.getTotalRevenue(),
                "payments", metrics.getTotalPayments()
            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/summary-cards")
    public ResponseEntity<?> getSummaryCards() {
        try {
            DashboardService.DashboardData data = dashboardService.getDashboardData();
            DashboardService.AdvancedKPIs kpis = dashboardService.getAdvancedKPIs();

            Map<String, Object> cards = new HashMap<>();

            // Revenue card
            cards.put("revenue", Map.of(
                "title", "Ingresos del Mes",
                "value", data.getMonthRevenue(),
                "change", Math.round(kpis.getRevenueGrowth() * 100.0) / 100.0,
                "changeType", kpis.getRevenueGrowth() >= 0 ? "positive" : "negative",
                "icon", "revenue"
            ));

            // Outstanding debt card
            cards.put("outstandingDebt", Map.of(
                "title", "Deuda Pendiente",
                "value", data.getTotalOutstandingDebt(),
                "subtitle", data.getActiveClients() + " clientes activos",
                "icon", "debt"
            ));

            // Active clients card
            cards.put("activeClients", Map.of(
                "title", "Clientes Activos",
                "value", data.getActiveClients(),
                "total", data.getTotalClients(),
                "percentage", data.getTotalClients() > 0 ?
                    Math.round((double) data.getActiveClients() / data.getTotalClients() * 10000.0) / 100.0 : 0,
                "icon", "clients"
            ));

            // Today's revenue card
            cards.put("todayRevenue", Map.of(
                "title", "Ingresos Hoy",
                "value", data.getTodayRevenue(),
                "icon", "today"
            ));

            // Collection rate card
            cards.put("collectionRate", Map.of(
                "title", "Tasa de Cobranza",
                "value", Math.round(kpis.getCollectionRate() * 100.0) / 100.0,
                "unit", "%",
                "icon", "collection"
            ));

            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}