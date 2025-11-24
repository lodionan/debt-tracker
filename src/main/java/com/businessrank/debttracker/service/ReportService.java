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
public class ReportService {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private DebtRepository debtRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public MonthlyReport generateMonthlyReport(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = yearMonth.atEndOfMonth().atTime(LocalTime.MAX);

        // Get all payments for the month
        List<Payment> monthlyPayments = paymentRepository.findPaymentsInDateRange(startOfMonth, endOfMonth);

        // Calculate totals
        BigDecimal totalPayments = monthlyPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Group payments by method
        Map<Payment.PaymentMethod, BigDecimal> paymentsByMethod = monthlyPayments.stream()
                .collect(Collectors.groupingBy(
                        Payment::getPaymentMethod,
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)
                ));

        // Get active debts at end of month
        List<Client> allClients = clientRepository.findAll();
        BigDecimal totalOutstandingDebt = BigDecimal.ZERO;
        int clientsWithActiveDebts = 0;

        for (Client client : allClients) {
            Double clientDebt = debtRepository.getTotalRemainingAmountByClient(client);
            if (clientDebt != null && clientDebt > 0) {
                totalOutstandingDebt = totalOutstandingDebt.add(BigDecimal.valueOf(clientDebt));
                clientsWithActiveDebts++;
            }
        }

        // Get debts created this month
        List<Debt> newDebts = debtRepository.findAll().stream()
                .filter(debt -> {
                    LocalDateTime created = debt.getCreatedAt();
                    return created.isAfter(startOfMonth) && created.isBefore(endOfMonth);
                })
                .collect(Collectors.toList());

        BigDecimal totalNewDebt = newDebts.stream()
                .map(Debt::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Get settled debts this month
        List<Debt> settledDebts = debtRepository.findAll().stream()
                .filter(debt -> debt.getStatus() == Debt.Status.SETTLED)
                .filter(debt -> {
                    // Check if any payment was made this month that completed the debt
                    List<Payment> debtPayments = paymentRepository.findByDebtOrderByPaymentDateDesc(debt);
                    return debtPayments.stream()
                            .anyMatch(payment -> payment.getPaymentDate().isAfter(startOfMonth) &&
                                                 payment.getPaymentDate().isBefore(endOfMonth));
                })
                .collect(Collectors.toList());

        return new MonthlyReport(
                yearMonth,
                totalPayments,
                paymentsByMethod,
                totalOutstandingDebt,
                clientsWithActiveDebts,
                totalNewDebt,
                newDebts.size(),
                settledDebts.size(),
                monthlyPayments.size()
        );
    }

    public ClientReport generateClientReport(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        List<Debt> clientDebts = debtRepository.findByClient(client);
        List<Payment> clientPayments = paymentRepository.findPaymentsByClient(client);

        BigDecimal totalDebtEver = clientDebts.stream()
                .map(Debt::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = clientPayments.stream()
                .map(Payment::getAmount)
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

        return new ClientReport(
                client,
                totalDebtEver,
                totalPaid,
                currentOutstanding,
                activeDebts,
                settledDebts,
                clientPayments
        );
    }

    // Advanced reporting methods
    public DateRangeReport generateDateRangeReport(LocalDateTime startDate, LocalDateTime endDate) {
        List<Payment> payments = paymentRepository.findPaymentsInDateRange(startDate, endDate);
        List<Debt> debtsCreated = debtRepository.findAll().stream()
                .filter(debt -> debt.getCreatedAt().isAfter(startDate) && debt.getCreatedAt().isBefore(endDate))
                .collect(Collectors.toList());

        BigDecimal totalPayments = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalNewDebt = debtsCreated.stream()
                .map(Debt::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<Payment.PaymentMethod, BigDecimal> paymentsByMethod = payments.stream()
                .collect(Collectors.groupingBy(
                        Payment::getPaymentMethod,
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)
                ));

        // Calculate collection rate
        double collectionRate = 0.0;
        if (!debtsCreated.isEmpty()) {
            BigDecimal totalExpected = debtsCreated.stream()
                    .map(Debt::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (totalExpected.doubleValue() > 0) {
                collectionRate = totalPayments.doubleValue() / totalExpected.doubleValue();
            }
        }

        return new DateRangeReport(
                startDate, endDate, totalPayments, totalNewDebt,
                paymentsByMethod, payments.size(), debtsCreated.size(), collectionRate
        );
    }

    public List<ClientRanking> getTopClientsByDebt(int limit) {
        List<Client> allClients = clientRepository.findAll();
        return allClients.stream()
                .map(client -> {
                    Double totalDebt = debtRepository.getTotalRemainingAmountByClient(client);
                    List<Payment> payments = paymentRepository.findPaymentsByClient(client);
                    BigDecimal totalPaid = payments.stream()
                            .map(Payment::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return new ClientRanking(
                            client,
                            totalDebt != null ? BigDecimal.valueOf(totalDebt) : BigDecimal.ZERO,
                            totalPaid,
                            payments.size()
                    );
                })
                .filter(ranking -> ranking.getOutstandingDebt().doubleValue() > 0)
                .sorted((a, b) -> b.getOutstandingDebt().compareTo(a.getOutstandingDebt()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public CollectionPerformanceReport generateCollectionPerformanceReport(int months) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusMonths(months);

        List<Payment> payments = paymentRepository.findPaymentsInDateRange(startDate, endDate);

        // Group by month
        Map<YearMonth, BigDecimal> monthlyCollections = payments.stream()
                .collect(Collectors.groupingBy(
                        payment -> YearMonth.from(payment.getPaymentDate()),
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)
                ));

        // Calculate trends
        List<MonthlyCollection> monthlyData = monthlyCollections.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new MonthlyCollection(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        // Calculate growth rates
        double averageGrowth = 0.0;
        if (monthlyData.size() > 1) {
            double totalGrowth = 0.0;
            int growthPeriods = 0;

            for (int i = 1; i < monthlyData.size(); i++) {
                BigDecimal current = monthlyData.get(i).getAmount();
                BigDecimal previous = monthlyData.get(i - 1).getAmount();

                if (previous.doubleValue() > 0) {
                    double growth = (current.doubleValue() - previous.doubleValue()) / previous.doubleValue();
                    totalGrowth += growth;
                    growthPeriods++;
                }
            }

            if (growthPeriods > 0) {
                averageGrowth = totalGrowth / growthPeriods;
            }
        }

        BigDecimal totalCollections = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CollectionPerformanceReport(
                totalCollections, monthlyData, averageGrowth, payments.size()
        );
    }

    public PaymentMethodAnalysis generatePaymentMethodAnalysis(LocalDateTime startDate, LocalDateTime endDate) {
        List<Payment> payments = paymentRepository.findPaymentsInDateRange(startDate, endDate);

        Map<Payment.PaymentMethod, Long> methodCount = payments.stream()
                .collect(Collectors.groupingBy(Payment::getPaymentMethod, Collectors.counting()));

        Map<Payment.PaymentMethod, BigDecimal> methodAmount = payments.stream()
                .collect(Collectors.groupingBy(
                        Payment::getPaymentMethod,
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)
                ));

        // Find most popular method
        Payment.PaymentMethod mostPopular = methodCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        // Find highest volume method
        Payment.PaymentMethod highestVolume = methodAmount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        BigDecimal totalAmount = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PaymentMethodAnalysis(
                methodCount, methodAmount, mostPopular, highestVolume, totalAmount, payments.size()
        );
    }

    public OverdueDebtsReport generateOverdueDebtsReport() {
        // Get debts that are actually overdue based on dueDate
        List<Debt> overdueDebts = debtRepository.findOverdueDebts(LocalDate.now());

        BigDecimal totalOverdueAmount = overdueDebts.stream()
                .map(Debt::getRemainingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Group by client
        Map<Client, List<Debt>> overdueByClient = overdueDebts.stream()
                .collect(Collectors.groupingBy(Debt::getClient));

        List<ClientOverdueSummary> clientSummaries = overdueByClient.entrySet().stream()
                .map(entry -> {
                    BigDecimal clientTotal = entry.getValue().stream()
                            .map(Debt::getRemainingAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new ClientOverdueSummary(entry.getKey(), clientTotal, entry.getValue().size());
                })
                .sorted((a, b) -> b.getTotalOverdue().compareTo(a.getTotalOverdue()))
                .collect(Collectors.toList());

        return new OverdueDebtsReport(
                totalOverdueAmount, overdueDebts.size(), clientSummaries.size(), clientSummaries
        );
    }

    public BusinessProjection generateBusinessProjection(int months) {
        // Get historical data for projection
        CollectionPerformanceReport performance = generateCollectionPerformanceReport(6);

        // Simple linear projection based on recent trends
        BigDecimal averageMonthlyCollection = BigDecimal.ZERO;
        if (!performance.getMonthlyCollections().isEmpty()) {
            BigDecimal totalHistorical = performance.getMonthlyCollections().stream()
                    .map(MonthlyCollection::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            averageMonthlyCollection = totalHistorical.divide(
                    BigDecimal.valueOf(performance.getMonthlyCollections().size()),
                    2, BigDecimal.ROUND_HALF_UP
            );
        }

        // Apply growth rate
        BigDecimal projectedMonthlyCollection = averageMonthlyCollection.multiply(
                BigDecimal.valueOf(1 + performance.getAverageGrowthRate())
        );

        BigDecimal projectedTotal = projectedMonthlyCollection.multiply(BigDecimal.valueOf(months));

        // Current outstanding debt
        Double currentOutstanding = debtRepository.getTotalRemainingDebtAmount();
        BigDecimal currentOutstandingDecimal = currentOutstanding != null ?
                BigDecimal.valueOf(currentOutstanding) : BigDecimal.ZERO;

        // Projected outstanding after collections
        BigDecimal projectedOutstanding = currentOutstandingDecimal.subtract(projectedTotal);
        if (projectedOutstanding.doubleValue() < 0) {
            projectedOutstanding = BigDecimal.ZERO;
        }

        return new BusinessProjection(
                projectedTotal, projectedOutstanding, projectedMonthlyCollection,
                performance.getAverageGrowthRate(), months
        );
    }

    // Data classes for reports
    public static class MonthlyReport {
        private final YearMonth month;
        private final BigDecimal totalPayments;
        private final Map<Payment.PaymentMethod, BigDecimal> paymentsByMethod;
        private final BigDecimal totalOutstandingDebt;
        private final int clientsWithActiveDebts;
        private final BigDecimal totalNewDebt;
        private final int newDebtsCount;
        private final int settledDebtsCount;
        private final int totalPaymentsCount;

        public MonthlyReport(YearMonth month, BigDecimal totalPayments,
                           Map<Payment.PaymentMethod, BigDecimal> paymentsByMethod,
                           BigDecimal totalOutstandingDebt, int clientsWithActiveDebts,
                           BigDecimal totalNewDebt, int newDebtsCount, int settledDebtsCount,
                           int totalPaymentsCount) {
            this.month = month;
            this.totalPayments = totalPayments;
            this.paymentsByMethod = paymentsByMethod;
            this.totalOutstandingDebt = totalOutstandingDebt;
            this.clientsWithActiveDebts = clientsWithActiveDebts;
            this.totalNewDebt = totalNewDebt;
            this.newDebtsCount = newDebtsCount;
            this.settledDebtsCount = settledDebtsCount;
            this.totalPaymentsCount = totalPaymentsCount;
        }

        // Getters
        public YearMonth getMonth() { return month; }
        public BigDecimal getTotalPayments() { return totalPayments; }
        public Map<Payment.PaymentMethod, BigDecimal> getPaymentsByMethod() { return paymentsByMethod; }
        public BigDecimal getTotalOutstandingDebt() { return totalOutstandingDebt; }
        public int getClientsWithActiveDebts() { return clientsWithActiveDebts; }
        public BigDecimal getTotalNewDebt() { return totalNewDebt; }
        public int getNewDebtsCount() { return newDebtsCount; }
        public int getSettledDebtsCount() { return settledDebtsCount; }
        public int getTotalPaymentsCount() { return totalPaymentsCount; }
    }

    public static class ClientReport {
        private final Client client;
        private final BigDecimal totalDebtEver;
        private final BigDecimal totalPaid;
        private final BigDecimal currentOutstanding;
        private final List<Debt> activeDebts;
        private final List<Debt> settledDebts;
        private final List<Payment> paymentHistory;

        public ClientReport(Client client, BigDecimal totalDebtEver, BigDecimal totalPaid,
                          BigDecimal currentOutstanding, List<Debt> activeDebts,
                          List<Debt> settledDebts, List<Payment> paymentHistory) {
            this.client = client;
            this.totalDebtEver = totalDebtEver;
            this.totalPaid = totalPaid;
            this.currentOutstanding = currentOutstanding;
            this.activeDebts = activeDebts;
            this.settledDebts = settledDebts;
            this.paymentHistory = paymentHistory;
        }

        // Getters
        public Client getClient() { return client; }
        public BigDecimal getTotalDebtEver() { return totalDebtEver; }
        public BigDecimal getTotalPaid() { return totalPaid; }
        public BigDecimal getCurrentOutstanding() { return currentOutstanding; }
        public List<Debt> getActiveDebts() { return activeDebts; }
        public List<Debt> getSettledDebts() { return settledDebts; }
        public List<Payment> getPaymentHistory() { return paymentHistory; }
    }

    // Additional report data classes
    public static class DateRangeReport {
        private final LocalDateTime startDate;
        private final LocalDateTime endDate;
        private final BigDecimal totalPayments;
        private final BigDecimal totalNewDebt;
        private final Map<Payment.PaymentMethod, BigDecimal> paymentsByMethod;
        private final int paymentsCount;
        private final int newDebtsCount;
        private final double collectionRate;

        public DateRangeReport(LocalDateTime startDate, LocalDateTime endDate, BigDecimal totalPayments,
                             BigDecimal totalNewDebt, Map<Payment.PaymentMethod, BigDecimal> paymentsByMethod,
                             int paymentsCount, int newDebtsCount, double collectionRate) {
            this.startDate = startDate;
            this.endDate = endDate;
            this.totalPayments = totalPayments;
            this.totalNewDebt = totalNewDebt;
            this.paymentsByMethod = paymentsByMethod;
            this.paymentsCount = paymentsCount;
            this.newDebtsCount = newDebtsCount;
            this.collectionRate = collectionRate;
        }

        // Getters
        public LocalDateTime getStartDate() { return startDate; }
        public LocalDateTime getEndDate() { return endDate; }
        public BigDecimal getTotalPayments() { return totalPayments; }
        public BigDecimal getTotalNewDebt() { return totalNewDebt; }
        public Map<Payment.PaymentMethod, BigDecimal> getPaymentsByMethod() { return paymentsByMethod; }
        public int getPaymentsCount() { return paymentsCount; }
        public int getNewDebtsCount() { return newDebtsCount; }
        public double getCollectionRate() { return collectionRate; }
    }

    public static class ClientRanking {
        private final Client client;
        private final BigDecimal outstandingDebt;
        private final BigDecimal totalPaid;
        private final int paymentsCount;

        public ClientRanking(Client client, BigDecimal outstandingDebt, BigDecimal totalPaid, int paymentsCount) {
            this.client = client;
            this.outstandingDebt = outstandingDebt;
            this.totalPaid = totalPaid;
            this.paymentsCount = paymentsCount;
        }

        // Getters
        public Client getClient() { return client; }
        public BigDecimal getOutstandingDebt() { return outstandingDebt; }
        public BigDecimal getTotalPaid() { return totalPaid; }
        public int getPaymentsCount() { return paymentsCount; }
    }

    public static class MonthlyCollection {
        private final YearMonth month;
        private final BigDecimal amount;

        public MonthlyCollection(YearMonth month, BigDecimal amount) {
            this.month = month;
            this.amount = amount;
        }

        // Getters
        public YearMonth getMonth() { return month; }
        public BigDecimal getAmount() { return amount; }
    }

    public static class CollectionPerformanceReport {
        private final BigDecimal totalCollections;
        private final List<MonthlyCollection> monthlyCollections;
        private final double averageGrowthRate;
        private final int totalPayments;

        public CollectionPerformanceReport(BigDecimal totalCollections, List<MonthlyCollection> monthlyCollections,
                                        double averageGrowthRate, int totalPayments) {
            this.totalCollections = totalCollections;
            this.monthlyCollections = monthlyCollections;
            this.averageGrowthRate = averageGrowthRate;
            this.totalPayments = totalPayments;
        }

        // Getters
        public BigDecimal getTotalCollections() { return totalCollections; }
        public List<MonthlyCollection> getMonthlyCollections() { return monthlyCollections; }
        public double getAverageGrowthRate() { return averageGrowthRate; }
        public int getTotalPayments() { return totalPayments; }
    }

    public static class PaymentMethodAnalysis {
        private final Map<Payment.PaymentMethod, Long> methodUsageCount;
        private final Map<Payment.PaymentMethod, BigDecimal> methodUsageAmount;
        private final Payment.PaymentMethod mostPopularMethod;
        private final Payment.PaymentMethod highestVolumeMethod;
        private final BigDecimal totalAmount;
        private final int totalPayments;

        public PaymentMethodAnalysis(Map<Payment.PaymentMethod, Long> methodUsageCount,
                                   Map<Payment.PaymentMethod, BigDecimal> methodUsageAmount,
                                   Payment.PaymentMethod mostPopularMethod,
                                   Payment.PaymentMethod highestVolumeMethod,
                                   BigDecimal totalAmount, int totalPayments) {
            this.methodUsageCount = methodUsageCount;
            this.methodUsageAmount = methodUsageAmount;
            this.mostPopularMethod = mostPopularMethod;
            this.highestVolumeMethod = highestVolumeMethod;
            this.totalAmount = totalAmount;
            this.totalPayments = totalPayments;
        }

        // Getters
        public Map<Payment.PaymentMethod, Long> getMethodUsageCount() { return methodUsageCount; }
        public Map<Payment.PaymentMethod, BigDecimal> getMethodUsageAmount() { return methodUsageAmount; }
        public Payment.PaymentMethod getMostPopularMethod() { return mostPopularMethod; }
        public Payment.PaymentMethod getHighestVolumeMethod() { return highestVolumeMethod; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public int getTotalPayments() { return totalPayments; }
    }

    public static class ClientOverdueSummary {
        private final Client client;
        private final BigDecimal totalOverdue;
        private final int debtsCount;

        public ClientOverdueSummary(Client client, BigDecimal totalOverdue, int debtsCount) {
            this.client = client;
            this.totalOverdue = totalOverdue;
            this.debtsCount = debtsCount;
        }

        // Getters
        public Client getClient() { return client; }
        public BigDecimal getTotalOverdue() { return totalOverdue; }
        public int getDebtsCount() { return debtsCount; }
    }

    public static class OverdueDebtsReport {
        private final BigDecimal totalOverdueAmount;
        private final int totalOverdueDebts;
        private final int clientsWithOverdue;
        private final List<ClientOverdueSummary> clientSummaries;

        public OverdueDebtsReport(BigDecimal totalOverdueAmount, int totalOverdueDebts,
                                int clientsWithOverdue, List<ClientOverdueSummary> clientSummaries) {
            this.totalOverdueAmount = totalOverdueAmount;
            this.totalOverdueDebts = totalOverdueDebts;
            this.clientsWithOverdue = clientsWithOverdue;
            this.clientSummaries = clientSummaries;
        }

        // Getters
        public BigDecimal getTotalOverdueAmount() { return totalOverdueAmount; }
        public int getTotalOverdueDebts() { return totalOverdueDebts; }
        public int getClientsWithOverdue() { return clientsWithOverdue; }
        public List<ClientOverdueSummary> getClientSummaries() { return clientSummaries; }
    }

    public static class BusinessProjection {
        private final BigDecimal projectedCollections;
        private final BigDecimal projectedOutstanding;
        private final BigDecimal averageMonthlyCollection;
        private final double expectedGrowthRate;
        private final int projectionMonths;

        public BusinessProjection(BigDecimal projectedCollections, BigDecimal projectedOutstanding,
                               BigDecimal averageMonthlyCollection, double expectedGrowthRate, int projectionMonths) {
            this.projectedCollections = projectedCollections;
            this.projectedOutstanding = projectedOutstanding;
            this.averageMonthlyCollection = averageMonthlyCollection;
            this.expectedGrowthRate = expectedGrowthRate;
            this.projectionMonths = projectionMonths;
        }

        // Getters
        public BigDecimal getProjectedCollections() { return projectedCollections; }
        public BigDecimal getProjectedOutstanding() { return projectedOutstanding; }
        public BigDecimal getAverageMonthlyCollection() { return averageMonthlyCollection; }
        public double getExpectedGrowthRate() { return expectedGrowthRate; }
        public int getProjectionMonths() { return projectionMonths; }
    }
}