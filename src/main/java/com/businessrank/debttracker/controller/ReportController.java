package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.model.Client;
import com.businessrank.debttracker.model.Debt;
import com.businessrank.debttracker.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://10.0.2.2:8080", "http://192.168.1.65:8080"})
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private com.businessrank.debttracker.repository.DebtRepository debtRepository;

    @Autowired
    private com.businessrank.debttracker.repository.PaymentRepository paymentRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/monthly/{year}/{month}")
    public ResponseEntity<?> getMonthlyReport(
            @PathVariable int year,
            @PathVariable int month) {

        try {
            ReportService.MonthlyReport report = reportService.generateMonthlyReport(year, month);

            Map<String, Object> response = new HashMap<>();
            response.put("month", report.getMonth().toString());
            response.put("totalPayments", report.getTotalPayments());
            response.put("paymentsByMethod", report.getPaymentsByMethod());
            response.put("totalOutstandingDebt", report.getTotalOutstandingDebt());
            response.put("clientsWithActiveDebts", report.getClientsWithActiveDebts());
            response.put("totalNewDebt", report.getTotalNewDebt());
            response.put("newDebtsCount", report.getNewDebtsCount());
            response.put("settledDebtsCount", report.getSettledDebtsCount());
            response.put("totalPaymentsCount", report.getTotalPaymentsCount());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/monthly/current")
    public ResponseEntity<?> getCurrentMonthReport() {
        LocalDate now = LocalDate.now();
        return getMonthlyReport(now.getYear(), now.getMonthValue());
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getClientReport(@PathVariable Long clientId) {
        try {
            ReportService.ClientReport report = reportService.generateClientReport(clientId);

            Map<String, Object> response = new HashMap<>();
            response.put("client", Map.of(
                "id", report.getClient().getId(),
                "name", report.getClient().getName(),
                "phone", report.getClient().getPhone()
            ));
            response.put("totalDebtEver", report.getTotalDebtEver());
            response.put("totalPaid", report.getTotalPaid());
            response.put("currentOutstanding", report.getCurrentOutstanding());
            response.put("activeDebtsCount", report.getActiveDebts().size());
            response.put("settledDebtsCount", report.getSettledDebts().size());
            response.put("totalPaymentsCount", report.getPaymentHistory().size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/summary")
    public ResponseEntity<?> getBusinessSummary() {
        try {
            // Get current month report for quick summary
            LocalDate now = LocalDate.now();
            ReportService.MonthlyReport currentMonth = reportService.generateMonthlyReport(now.getYear(), now.getMonthValue());

            Map<String, Object> summary = new HashMap<>();
            summary.put("currentMonth", Map.of(
                "totalPayments", currentMonth.getTotalPayments(),
                "totalOutstandingDebt", currentMonth.getTotalOutstandingDebt(),
                "clientsWithActiveDebts", currentMonth.getClientsWithActiveDebts(),
                "newDebtsThisMonth", currentMonth.getNewDebtsCount(),
                "settledDebtsThisMonth", currentMonth.getSettledDebtsCount()
            ));

            // Calculate some additional metrics
            double paymentRatio = 0;
            if (currentMonth.getTotalOutstandingDebt().doubleValue() > 0) {
                paymentRatio = currentMonth.getTotalPayments().doubleValue() /
                              (currentMonth.getTotalOutstandingDebt().doubleValue() + currentMonth.getTotalPayments().doubleValue());
            }
            summary.put("paymentRatio", Math.round(paymentRatio * 10000.0) / 100.0); // percentage with 2 decimals

            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Advanced reporting endpoints
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/date-range")
    public ResponseEntity<?> getDateRangeReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate) {
        try {
            ReportService.DateRangeReport report = reportService.generateDateRangeReport(startDate, endDate);

            Map<String, Object> response = new HashMap<>();
            response.put("startDate", report.getStartDate());
            response.put("endDate", report.getEndDate());
            response.put("totalPayments", report.getTotalPayments());
            response.put("totalNewDebt", report.getTotalNewDebt());
            response.put("paymentsByMethod", report.getPaymentsByMethod());
            response.put("paymentsCount", report.getPaymentsCount());
            response.put("newDebtsCount", report.getNewDebtsCount());
            response.put("collectionRate", Math.round(report.getCollectionRate() * 10000.0) / 100.0);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/top-clients")
    public ResponseEntity<?> getTopClientsByDebt(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<ReportService.ClientRanking> rankings = reportService.getTopClientsByDebt(limit);

            List<Map<String, Object>> response = rankings.stream()
                    .map(ranking -> {
                        Map<String, Object> item = new HashMap<>();
                        Map<String, Object> client = new HashMap<>();
                        client.put("id", ranking.getClient().getId());
                        client.put("name", ranking.getClient().getName());
                        client.put("phone", ranking.getClient().getPhone());
                        item.put("client", client);
                        item.put("outstandingDebt", ranking.getOutstandingDebt());
                        item.put("totalPaid", ranking.getTotalPaid());
                        item.put("paymentsCount", ranking.getPaymentsCount());
                        return item;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/collection-performance")
    public ResponseEntity<?> getCollectionPerformance(@RequestParam(defaultValue = "6") int months) {
        try {
            ReportService.CollectionPerformanceReport report = reportService.generateCollectionPerformanceReport(months);

            List<Map<String, Object>> monthlyData = report.getMonthlyCollections().stream()
                    .map(mc -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("month", mc.getMonth().toString());
                        item.put("amount", mc.getAmount());
                        return item;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("totalCollections", report.getTotalCollections());
            response.put("monthlyCollections", monthlyData);
            response.put("averageGrowthRate", Math.round(report.getAverageGrowthRate() * 10000.0) / 100.0);
            response.put("totalPayments", report.getTotalPayments());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/payment-methods")
    public ResponseEntity<?> getPaymentMethodAnalysis(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate) {
        try {
            ReportService.PaymentMethodAnalysis analysis = reportService.generatePaymentMethodAnalysis(startDate, endDate);

            Map<String, Object> response = new HashMap<>();
            response.put("methodUsageCount", analysis.getMethodUsageCount());
            response.put("methodUsageAmount", analysis.getMethodUsageAmount());
            response.put("mostPopularMethod", analysis.getMostPopularMethod());
            response.put("highestVolumeMethod", analysis.getHighestVolumeMethod());
            response.put("totalAmount", analysis.getTotalAmount());
            response.put("totalPayments", analysis.getTotalPayments());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/overdue-debts")
    public ResponseEntity<?> getOverdueDebtsReport() {
        try {
            ReportService.OverdueDebtsReport report = reportService.generateOverdueDebtsReport();

            List<Map<String, Object>> clientSummaries = report.getClientSummaries().stream()
                    .map(summary -> {
                        Map<String, Object> item = new HashMap<>();
                        Map<String, Object> client = new HashMap<>();
                        client.put("id", summary.getClient().getId());
                        client.put("name", summary.getClient().getName());
                        client.put("phone", summary.getClient().getPhone());
                        item.put("client", client);
                        item.put("totalOverdue", summary.getTotalOverdue());
                        item.put("debtsCount", summary.getDebtsCount());
                        return item;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("totalOverdueAmount", report.getTotalOverdueAmount());
            response.put("totalOverdueDebts", report.getTotalOverdueDebts());
            response.put("clientsWithOverdue", report.getClientsWithOverdue());
            response.put("clientSummaries", clientSummaries);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/business-projection")
    public ResponseEntity<?> getBusinessProjection(@RequestParam(defaultValue = "3") int months) {
        try {
            ReportService.BusinessProjection projection = reportService.generateBusinessProjection(months);

            Map<String, Object> response = new HashMap<>();
            response.put("projectedCollections", projection.getProjectedCollections());
            response.put("projectedOutstanding", projection.getProjectedOutstanding());
            response.put("averageMonthlyCollection", projection.getAverageMonthlyCollection());
            response.put("expectedGrowthRate", Math.round(projection.getExpectedGrowthRate() * 10000.0) / 100.0);
            response.put("projectionMonths", projection.getProjectionMonths());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Export endpoints (basic CSV format)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/export/debts")
    public ResponseEntity<byte[]> exportDebts() {
        try {
            List<Debt> allDebts = debtRepository.findAll();
            StringBuilder csv = new StringBuilder();
            csv.append("ID,Cliente ID,Nombre Cliente,Monto Total,Monto Restante,Estado,Fecha Creación,Descripción\n");

            for (Debt debt : allDebts) {
                Client client = debt.getClient();
                csv.append(debt.getId()).append(",")
                   .append(client.getId()).append(",")
                   .append("\"").append(client.getName().replace("\"", "\"\"")).append("\",")
                   .append(debt.getTotalAmount()).append(",")
                   .append(debt.getRemainingAmount()).append(",")
                   .append(debt.getStatus()).append(",")
                   .append(debt.getCreatedAt().toLocalDate()).append(",")
                   .append("\"").append(debt.getDescription() != null ? debt.getDescription().replace("\"", "\"\"") : "").append("\"\n");
            }

            byte[] csvBytes = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=deudas_" + LocalDate.now() + ".csv")
                .body(csvBytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/export/payments")
    public ResponseEntity<byte[]> exportPayments() {
        try {
            List<com.businessrank.debttracker.model.Payment> allPayments = paymentRepository.findAll();
            StringBuilder csv = new StringBuilder();
            csv.append("ID,Deuda ID,Cliente,Método de Pago,Monto,Fecha,Notas\n");

            for (com.businessrank.debttracker.model.Payment payment : allPayments) {
                Debt debt = payment.getDebt();
                Client client = debt.getClient();
                csv.append(payment.getId()).append(",")
                   .append(debt.getId()).append(",")
                   .append("\"").append(client.getName().replace("\"", "\"\"")).append("\",")
                   .append(payment.getPaymentMethod()).append(",")
                   .append(payment.getAmount()).append(",")
                   .append(payment.getPaymentDate().toLocalDate()).append(",")
                   .append("\"").append(payment.getNotes() != null ? payment.getNotes().replace("\"", "\"\"") : "").append("\"\n");
            }

            byte[] csvBytes = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=pagos_" + LocalDate.now() + ".csv")
                .body(csvBytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}