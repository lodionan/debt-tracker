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
}