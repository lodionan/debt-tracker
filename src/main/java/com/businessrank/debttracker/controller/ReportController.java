package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class ReportController {

    @Autowired
    private ReportService reportService;

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
}