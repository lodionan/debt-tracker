package com.businessrank.debttracker.service;

import com.businessrank.debttracker.model.Client;
import com.businessrank.debttracker.model.Debt;
import com.businessrank.debttracker.model.Payment;
import com.businessrank.debttracker.repository.ClientRepository;
import com.businessrank.debttracker.repository.DebtRepository;
import com.businessrank.debttracker.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private DebtRepository debtRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public DashboardData getDashboardData() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.atTime(LocalTime.MAX);

        // Today's metrics
        List<Payment> todayPayments = paymentRepository.findPaymentsInDateRange(startOfToday, endOfToday);
        BigDecimal todayRevenue = todayPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Current month metrics
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = currentMonth.atEndOfMonth().atTime(LocalTime.MAX);

        List<Payment> monthPayments = paymentRepository.findPaymentsInDateRange(startOfMonth, endOfMonth);
        BigDecimal monthRevenue = monthPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Total outstanding debt
        List<Client> allClients = clientRepository.findAll();
        BigDecimal totalOutstandingDebt = BigDecimal.ZERO;
        int activeClients = 0;

        for (Client client : allClients) {
            Double clientDebt = debtRepository.getTotalRemainingAmountByClient(client);
            if (clientDebt != null && clientDebt > 0) {
                totalOutstandingDebt = totalOutstandingDebt.add(BigDecimal.valueOf(clientDebt));
                activeClients++;
            }
        }

        // Recent payments (last 10)
        List<Payment> recentPayments = paymentRepository.findAll().stream()
                .sorted((a, b) -> b.getPaymentDate().compareTo(a.getPaymentDate()))
                .limit(10)
                .collect(Collectors.toList());

        // Top debtors
        List<ClientDebtSummary> topDebtors = allClients.stream()
                .map(client -> {
                    Double debt = debtRepository.getTotalRemainingAmountByClient(client);
                    return new ClientDebtSummary(client, debt != null ? BigDecimal.valueOf(debt) : BigDecimal.ZERO);
                })
                .filter(summary -> summary.getOutstandingDebt().compareTo(BigDecimal.ZERO) > 0)
                .sorted((a, b) -> b.getOutstandingDebt().compareTo(a.getOutstandingDebt()))
                .limit(5)
                .collect(Collectors.toList());

        // Payment method distribution
        Map<Payment.PaymentMethod, Long> paymentMethodDistribution = monthPayments.stream()
                .collect(Collectors.groupingBy(Payment::getPaymentMethod, Collectors.counting()));

        // Monthly trend (last 6 months)
        List<MonthlyData> monthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            LocalDateTime monthStart = month.atDay(1).atStartOfDay();
            LocalDateTime monthEnd = month.atEndOfMonth().atTime(LocalTime.MAX);

            List<Payment> monthData = paymentRepository.findPaymentsInDateRange(monthStart, monthEnd);
            BigDecimal monthTotal = monthData.stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            monthlyTrend.add(new MonthlyData(month, monthTotal, monthData.size()));
        }

        return new DashboardData(
                todayRevenue,
                monthRevenue,
                totalOutstandingDebt,
                activeClients,
                allClients.size(),
                recentPayments,
                topDebtors,
                paymentMethodDistribution,
                monthlyTrend
        );
    }

    // Data classes
    public static class DashboardData {
        private final BigDecimal todayRevenue;
        private final BigDecimal monthRevenue;
        private final BigDecimal totalOutstandingDebt;
        private final int activeClients;
        private final int totalClients;
        private final List<Payment> recentPayments;
        private final List<ClientDebtSummary> topDebtors;
        private final Map<Payment.PaymentMethod, Long> paymentMethodDistribution;
        private final List<MonthlyData> monthlyTrend;

        public DashboardData(BigDecimal todayRevenue, BigDecimal monthRevenue, BigDecimal totalOutstandingDebt,
                           int activeClients, int totalClients, List<Payment> recentPayments,
                           List<ClientDebtSummary> topDebtors, Map<Payment.PaymentMethod, Long> paymentMethodDistribution,
                           List<MonthlyData> monthlyTrend) {
            this.todayRevenue = todayRevenue;
            this.monthRevenue = monthRevenue;
            this.totalOutstandingDebt = totalOutstandingDebt;
            this.activeClients = activeClients;
            this.totalClients = totalClients;
            this.recentPayments = recentPayments;
            this.topDebtors = topDebtors;
            this.paymentMethodDistribution = paymentMethodDistribution;
            this.monthlyTrend = monthlyTrend;
        }

        // Getters
        public BigDecimal getTodayRevenue() { return todayRevenue; }
        public BigDecimal getMonthRevenue() { return monthRevenue; }
        public BigDecimal getTotalOutstandingDebt() { return totalOutstandingDebt; }
        public int getActiveClients() { return activeClients; }
        public int getTotalClients() { return totalClients; }
        public List<Payment> getRecentPayments() { return recentPayments; }
        public List<ClientDebtSummary> getTopDebtors() { return topDebtors; }
        public Map<Payment.PaymentMethod, Long> getPaymentMethodDistribution() { return paymentMethodDistribution; }
        public List<MonthlyData> getMonthlyTrend() { return monthlyTrend; }
    }

    public static class ClientDebtSummary {
        private final Client client;
        private final BigDecimal outstandingDebt;

        public ClientDebtSummary(Client client, BigDecimal outstandingDebt) {
            this.client = client;
            this.outstandingDebt = outstandingDebt;
        }

        public Client getClient() { return client; }
        public BigDecimal getOutstandingDebt() { return outstandingDebt; }
    }

    public static class MonthlyData {
        private final YearMonth month;
        private final BigDecimal revenue;
        private final int paymentCount;

        public MonthlyData(YearMonth month, BigDecimal revenue, int paymentCount) {
            this.month = month;
            this.revenue = revenue;
            this.paymentCount = paymentCount;
        }

        public YearMonth getMonth() { return month; }
        public BigDecimal getRevenue() { return revenue; }
        public int getPaymentCount() { return paymentCount; }
    }
}