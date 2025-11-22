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
        List<Payment> recentPayments = paymentRepository.findAllOrderByPaymentDateDesc().stream()
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

    // Advanced dashboard methods
    public ClientDashboardData getClientDashboardData(Client client) {
        // Client's debts
        List<Debt> clientDebts = debtRepository.findByClient(client);
        BigDecimal totalDebtEver = clientDebts.stream()
                .map(Debt::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal currentOutstanding = BigDecimal.ZERO;
        List<Debt> activeDebts = new ArrayList<>();
        List<Debt> settledDebts = new ArrayList<>();

        for (Debt debt : clientDebts) {
            if (debt.getStatus() == Debt.Status.ACTIVE) {
                currentOutstanding = currentOutstanding.add(debt.getRemainingAmount());
                activeDebts.add(debt);
            } else {
                settledDebts.add(debt);
            }
        }

        // Client's payments
        List<Payment> clientPayments = paymentRepository.findPaymentsByClient(client);
        BigDecimal totalPaid = clientPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Recent payments (last 5)
        List<Payment> recentPayments = clientPayments.stream()
                .sorted((a, b) -> b.getPaymentDate().compareTo(a.getPaymentDate()))
                .limit(5)
                .collect(Collectors.toList());

        // Payment method distribution for client
        Map<Payment.PaymentMethod, Long> paymentMethodDistribution = clientPayments.stream()
                .collect(Collectors.groupingBy(Payment::getPaymentMethod, Collectors.counting()));

        // Monthly payment trend for client (last 6 months)
        List<MonthlyData> monthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            LocalDateTime monthStart = month.atDay(1).atStartOfDay();
            LocalDateTime monthEnd = month.atEndOfMonth().atTime(LocalTime.MAX);

            BigDecimal monthTotal = clientPayments.stream()
                    .filter(payment -> {
                        YearMonth paymentMonth = YearMonth.from(payment.getPaymentDate());
                        return paymentMonth.equals(month);
                    })
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long paymentCount = clientPayments.stream()
                    .filter(payment -> {
                        YearMonth paymentMonth = YearMonth.from(payment.getPaymentDate());
                        return paymentMonth.equals(month);
                    })
                    .count();

            monthlyTrend.add(new MonthlyData(month, monthTotal, (int) paymentCount));
        }

        return new ClientDashboardData(
                client,
                totalDebtEver,
                totalPaid,
                currentOutstanding,
                activeDebts.size(),
                settledDebts.size(),
                clientPayments.size(),
                recentPayments,
                paymentMethodDistribution,
                monthlyTrend
        );
    }

    public AdvancedKPIs getAdvancedKPIs() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime lastMonthStart = YearMonth.now().minusMonths(1).atDay(1).atStartOfDay();
        LocalDateTime lastMonthEnd = YearMonth.now().minusMonths(1).atEndOfMonth().atTime(LocalTime.MAX);

        // Current month metrics
        List<Payment> currentMonthPayments = paymentRepository.findPaymentsInDateRange(monthStart, now);
        BigDecimal currentMonthRevenue = currentMonthPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Last month metrics
        List<Payment> lastMonthPayments = paymentRepository.findPaymentsInDateRange(lastMonthStart, lastMonthEnd);
        BigDecimal lastMonthRevenue = lastMonthPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Growth calculations
        double revenueGrowth = 0.0;
        if (lastMonthRevenue.doubleValue() > 0) {
            revenueGrowth = ((currentMonthRevenue.doubleValue() - lastMonthRevenue.doubleValue()) /
                           lastMonthRevenue.doubleValue()) * 100;
        }

        // Average payment amounts
        double avgPaymentCurrent = currentMonthPayments.isEmpty() ? 0.0 :
                currentMonthRevenue.doubleValue() / currentMonthPayments.size();
        double avgPaymentLast = lastMonthPayments.isEmpty() ? 0.0 :
                lastMonthRevenue.doubleValue() / lastMonthPayments.size();

        // Debt collection rate (simplified)
        Double totalDebtAmount = debtRepository.getTotalRemainingDebtAmount();
        BigDecimal totalDebt = totalDebtAmount != null ? BigDecimal.valueOf(totalDebtAmount) : BigDecimal.ZERO;
        double collectionRate = 0.0;
        if (totalDebt.doubleValue() > 0) {
            collectionRate = (currentMonthRevenue.doubleValue() / totalDebt.doubleValue()) * 100;
        }

        // Client metrics
        List<Client> allClients = clientRepository.findAll();
        long totalClients = allClients.size();
        long activeClients = allClients.stream()
                .filter(client -> {
                    Double debt = debtRepository.getTotalRemainingAmountByClient(client);
                    return debt != null && debt > 0;
                })
                .count();

        // New clients this month
        long newClientsThisMonth = allClients.stream()
                .filter(client -> client.getCreatedAt() != null &&
                        client.getCreatedAt().isAfter(monthStart) &&
                        client.getCreatedAt().isBefore(now))
                .count();

        return new AdvancedKPIs(
                currentMonthRevenue,
                lastMonthRevenue,
                revenueGrowth,
                avgPaymentCurrent,
                avgPaymentLast,
                collectionRate,
                totalClients,
                activeClients,
                newClientsThisMonth,
                currentMonthPayments.size()
        );
    }

    public PerformanceMetrics getPerformanceMetrics(int days) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(days);

        List<Payment> payments = paymentRepository.findPaymentsInDateRange(startDate, endDate);

        // Daily breakdown
        Map<LocalDate, BigDecimal> dailyRevenue = new HashMap<>();
        Map<LocalDate, Integer> dailyPaymentCount = new HashMap<>();

        for (Payment payment : payments) {
            LocalDate date = payment.getPaymentDate().toLocalDate();
            dailyRevenue.merge(date, payment.getAmount(), BigDecimal::add);
            dailyPaymentCount.merge(date, 1, Integer::sum);
        }

        // Fill missing days with zero
        LocalDate currentDate = startDate.toLocalDate();
        while (!currentDate.isAfter(endDate.toLocalDate())) {
            dailyRevenue.putIfAbsent(currentDate, BigDecimal.ZERO);
            dailyPaymentCount.putIfAbsent(currentDate, 0);
            currentDate = currentDate.plusDays(1);
        }

        List<DailyMetric> dailyMetrics = dailyRevenue.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new DailyMetric(
                        entry.getKey(),
                        entry.getValue(),
                        dailyPaymentCount.get(entry.getKey())
                ))
                .collect(Collectors.toList());

        // Calculate best/worst days
        DailyMetric bestDay = dailyMetrics.stream()
                .max((a, b) -> a.getRevenue().compareTo(b.getRevenue()))
                .orElse(null);

        DailyMetric worstDay = dailyMetrics.stream()
                .filter(d -> d.getRevenue().compareTo(BigDecimal.ZERO) > 0)
                .min((a, b) -> a.getRevenue().compareTo(b.getRevenue()))
                .orElse(null);

        // Average daily metrics
        BigDecimal totalRevenue = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double avgDailyRevenue = totalRevenue.doubleValue() / days;
        double avgDailyPayments = (double) payments.size() / days;

        return new PerformanceMetrics(
                dailyMetrics,
                bestDay,
                worstDay,
                avgDailyRevenue,
                avgDailyPayments,
                totalRevenue,
                payments.size()
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

    // Additional dashboard data classes
    public static class ClientDashboardData {
        private final Client client;
        private final BigDecimal totalDebtEver;
        private final BigDecimal totalPaid;
        private final BigDecimal currentOutstanding;
        private final int activeDebtsCount;
        private final int settledDebtsCount;
        private final int totalPaymentsCount;
        private final List<Payment> recentPayments;
        private final Map<Payment.PaymentMethod, Long> paymentMethodDistribution;
        private final List<MonthlyData> monthlyTrend;

        public ClientDashboardData(Client client, BigDecimal totalDebtEver, BigDecimal totalPaid,
                                 BigDecimal currentOutstanding, int activeDebtsCount, int settledDebtsCount,
                                 int totalPaymentsCount, List<Payment> recentPayments,
                                 Map<Payment.PaymentMethod, Long> paymentMethodDistribution,
                                 List<MonthlyData> monthlyTrend) {
            this.client = client;
            this.totalDebtEver = totalDebtEver;
            this.totalPaid = totalPaid;
            this.currentOutstanding = currentOutstanding;
            this.activeDebtsCount = activeDebtsCount;
            this.settledDebtsCount = settledDebtsCount;
            this.totalPaymentsCount = totalPaymentsCount;
            this.recentPayments = recentPayments;
            this.paymentMethodDistribution = paymentMethodDistribution;
            this.monthlyTrend = monthlyTrend;
        }

        // Getters
        public Client getClient() { return client; }
        public BigDecimal getTotalDebtEver() { return totalDebtEver; }
        public BigDecimal getTotalPaid() { return totalPaid; }
        public BigDecimal getCurrentOutstanding() { return currentOutstanding; }
        public int getActiveDebtsCount() { return activeDebtsCount; }
        public int getSettledDebtsCount() { return settledDebtsCount; }
        public int getTotalPaymentsCount() { return totalPaymentsCount; }
        public List<Payment> getRecentPayments() { return recentPayments; }
        public Map<Payment.PaymentMethod, Long> getPaymentMethodDistribution() { return paymentMethodDistribution; }
        public List<MonthlyData> getMonthlyTrend() { return monthlyTrend; }
    }

    public static class AdvancedKPIs {
        private final BigDecimal currentMonthRevenue;
        private final BigDecimal lastMonthRevenue;
        private final double revenueGrowth;
        private final double avgPaymentCurrent;
        private final double avgPaymentLast;
        private final double collectionRate;
        private final long totalClients;
        private final long activeClients;
        private final long newClientsThisMonth;
        private final int paymentsThisMonth;

        public AdvancedKPIs(BigDecimal currentMonthRevenue, BigDecimal lastMonthRevenue, double revenueGrowth,
                          double avgPaymentCurrent, double avgPaymentLast, double collectionRate,
                          long totalClients, long activeClients, long newClientsThisMonth, int paymentsThisMonth) {
            this.currentMonthRevenue = currentMonthRevenue;
            this.lastMonthRevenue = lastMonthRevenue;
            this.revenueGrowth = revenueGrowth;
            this.avgPaymentCurrent = avgPaymentCurrent;
            this.avgPaymentLast = avgPaymentLast;
            this.collectionRate = collectionRate;
            this.totalClients = totalClients;
            this.activeClients = activeClients;
            this.newClientsThisMonth = newClientsThisMonth;
            this.paymentsThisMonth = paymentsThisMonth;
        }

        // Getters
        public BigDecimal getCurrentMonthRevenue() { return currentMonthRevenue; }
        public BigDecimal getLastMonthRevenue() { return lastMonthRevenue; }
        public double getRevenueGrowth() { return revenueGrowth; }
        public double getAvgPaymentCurrent() { return avgPaymentCurrent; }
        public double getAvgPaymentLast() { return avgPaymentLast; }
        public double getCollectionRate() { return collectionRate; }
        public long getTotalClients() { return totalClients; }
        public long getActiveClients() { return activeClients; }
        public long getNewClientsThisMonth() { return newClientsThisMonth; }
        public int getPaymentsThisMonth() { return paymentsThisMonth; }
    }

    public static class DailyMetric {
        private final LocalDate date;
        private final BigDecimal revenue;
        private final int paymentCount;

        public DailyMetric(LocalDate date, BigDecimal revenue, int paymentCount) {
            this.date = date;
            this.revenue = revenue;
            this.paymentCount = paymentCount;
        }

        // Getters
        public LocalDate getDate() { return date; }
        public BigDecimal getRevenue() { return revenue; }
        public int getPaymentCount() { return paymentCount; }
    }

    public static class PerformanceMetrics {
        private final List<DailyMetric> dailyMetrics;
        private final DailyMetric bestDay;
        private final DailyMetric worstDay;
        private final double avgDailyRevenue;
        private final double avgDailyPayments;
        private final BigDecimal totalRevenue;
        private final int totalPayments;

        public PerformanceMetrics(List<DailyMetric> dailyMetrics, DailyMetric bestDay, DailyMetric worstDay,
                                double avgDailyRevenue, double avgDailyPayments, BigDecimal totalRevenue, int totalPayments) {
            this.dailyMetrics = dailyMetrics;
            this.bestDay = bestDay;
            this.worstDay = worstDay;
            this.avgDailyRevenue = avgDailyRevenue;
            this.avgDailyPayments = avgDailyPayments;
            this.totalRevenue = totalRevenue;
            this.totalPayments = totalPayments;
        }

        // Getters
        public List<DailyMetric> getDailyMetrics() { return dailyMetrics; }
        public DailyMetric getBestDay() { return bestDay; }
        public DailyMetric getWorstDay() { return worstDay; }
        public double getAvgDailyRevenue() { return avgDailyRevenue; }
        public double getAvgDailyPayments() { return avgDailyPayments; }
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public int getTotalPayments() { return totalPayments; }
    }
}