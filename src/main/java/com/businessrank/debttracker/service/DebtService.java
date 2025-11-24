package com.businessrank.debttracker.service;

import com.businessrank.debttracker.model.Client;
import com.businessrank.debttracker.model.Debt;
import com.businessrank.debttracker.model.Payment;
import com.businessrank.debttracker.model.User;
import com.businessrank.debttracker.repository.DebtRepository;
import com.businessrank.debttracker.repository.PaymentRepository;
import com.businessrank.debttracker.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class DebtService {

    private static final Logger logger = LoggerFactory.getLogger(DebtService.class);

    @Autowired
    private DebtRepository debtRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ClientService clientService;

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Debt createDebt(Long clientId, BigDecimal totalAmount, String description) {
        return createDebt(clientId, totalAmount, description, null);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Debt createDebt(Long clientId, BigDecimal totalAmount, String description, String dueDate) {
        Client client = clientService.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Debt debt = new Debt(client, totalAmount, description);
        // Note: Due date is not stored in the Debt model yet, but we accept it for future use
        return debtRepository.save(debt);
    }

    public List<Debt> getDebtsForUser(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        // Log total counts for debugging
        long totalDebts = debtRepository.count();
        long archivedDebts = debtRepository.findByArchived(true).size();
        long nonArchivedDebts = debtRepository.findByArchived(false).size();
        logger.debug("Total debts in DB: {}, Archived: {}, Non-archived: {}", totalDebts, archivedDebts, nonArchivedDebts);

        if (userPrincipal.getRole() == User.Role.ADMIN) {
            logger.debug("Fetching all non-archived debts for admin user: {}", userPrincipal.getUsername());
            List<Debt> debts = debtRepository.findByArchived(false);
            logger.debug("Found {} debts for admin", debts.size());
            return debts;
        } else {
            // Find client associated with this user
            Client client = clientService.findByPhone(userPrincipal.getUsername())
                    .orElseThrow(() -> new RuntimeException("Client not found for user"));
            logger.debug("Fetching debts for client: {} (id: {})", client.getName(), client.getId());
            List<Debt> debts = debtRepository.findByClientAndArchived(client, false);
            logger.debug("Found {} debts for client {}", debts.size(), client.getName());
            return debts;
        }
    }

    public Optional<Debt> getDebtById(Long id, Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        Optional<Debt> debt = debtRepository.findById(id);

        if (debt.isPresent()) {
            if (userPrincipal.getRole() == User.Role.ADMIN) {
                return debt;
            } else {
                // Check if debt belongs to this client
                Client client = clientService.findByPhone(userPrincipal.getUsername())
                        .orElseThrow(() -> new RuntimeException("Client not found for user"));

                if (debt.get().getClient().getId().equals(client.getId())) {
                    return debt;
                }
            }
        }

        return Optional.empty();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Debt updateDebt(Long id, Long clientId, BigDecimal totalAmount, String description, String dueDate) {
        Debt debt = debtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Debt not found"));

        if (clientId != null) {
            Client client = clientService.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            debt.setClient(client);
        }

        if (totalAmount != null) {
            debt.setTotalAmount(totalAmount);
        }

        if (description != null) {
            debt.setDescription(description);
        }

        // Note: Due date is not stored in the Debt model yet, but we accept it for future use

        return debtRepository.save(debt);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void archiveDebt(Long id) {
        Debt debt = debtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Debt not found"));

        debt.setArchived(true);
        debt.setUpdatedAt(java.time.LocalDateTime.now());
        debtRepository.save(debt);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void unarchiveDebt(Long id) {
        Debt debt = debtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Debt not found"));

        debt.setArchived(false);
        debt.setUpdatedAt(java.time.LocalDateTime.now());
        debtRepository.save(debt);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<Debt> getArchivedDebts() {
        return debtRepository.findByArchived(true);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteDebt(Long id) {
        Debt debt = debtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Debt not found"));

        // Check if debt has payments
        List<Payment> payments = paymentRepository.findByDebt(debt);
        if (!payments.isEmpty()) {
            throw new RuntimeException("Cannot delete debt with existing payments. Delete all payments first.");
        }

        debtRepository.delete(debt);
    }

    public Double getTotalRemainingAmountForClient(Client client) {
        Double total = debtRepository.getTotalRemainingAmountByClient(client);
        return total != null ? total : 0.0;
    }

    // Advanced search and filtering methods
    public List<Debt> searchDebts(String searchTerm, Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        if (userPrincipal.getRole() == User.Role.ADMIN) {
            return debtRepository.findByDescriptionContainingIgnoreCase(searchTerm);
        } else {
            Client client = clientService.findByPhone(userPrincipal.getUsername())
                    .orElseThrow(() -> new RuntimeException("Client not found for user"));
            return debtRepository.findByClientAndDescriptionContainingIgnoreCase(client, searchTerm);
        }
    }

    public List<Debt> getDebtsByStatus(Debt.Status status, Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        if (userPrincipal.getRole() == User.Role.ADMIN) {
            return debtRepository.findByStatus(status);
        } else {
            Client client = clientService.findByPhone(userPrincipal.getUsername())
                    .orElseThrow(() -> new RuntimeException("Client not found for user"));
            return debtRepository.findByClientAndStatus(client, status);
        }
    }

    public List<Debt> getDebtsByAmountRange(BigDecimal minAmount, BigDecimal maxAmount, Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        List<Debt> allDebts;

        if (userPrincipal.getRole() == User.Role.ADMIN) {
            allDebts = debtRepository.findAll();
        } else {
            Client client = clientService.findByPhone(userPrincipal.getUsername())
                    .orElseThrow(() -> new RuntimeException("Client not found for user"));
            allDebts = debtRepository.findByClient(client);
        }

        // Filter by amount range
        return allDebts.stream()
                .filter(debt -> debt.getTotalAmount().compareTo(minAmount) >= 0 &&
                               debt.getTotalAmount().compareTo(maxAmount) <= 0)
                .toList();
    }

    // Statistics methods
    public DebtStatistics getDebtStatistics(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        if (userPrincipal.getRole() == User.Role.ADMIN) {
            return getGlobalDebtStatistics();
        } else {
            Client client = clientService.findByPhone(userPrincipal.getUsername())
                    .orElseThrow(() -> new RuntimeException("Client not found for user"));
            return getClientDebtStatistics(client);
        }
    }

    private DebtStatistics getGlobalDebtStatistics() {
        Double totalActiveAmount = debtRepository.getTotalActiveDebtAmount();
        Double totalRemainingAmount = debtRepository.getTotalRemainingDebtAmount();
        Long activeCount = debtRepository.getActiveDebtsCount();
        Long settledCount = debtRepository.getSettledDebtsCount();
        Double averageAmount = debtRepository.getAverageActiveDebtAmount();

        return new DebtStatistics(
            totalActiveAmount != null ? totalActiveAmount : 0.0,
            totalRemainingAmount != null ? totalRemainingAmount : 0.0,
            activeCount != null ? activeCount : 0L,
            settledCount != null ? settledCount : 0L,
            averageAmount != null ? averageAmount : 0.0
        );
    }

    private DebtStatistics getClientDebtStatistics(Client client) {
        List<Debt> clientDebts = debtRepository.findByClient(client);
        Double totalRemaining = debtRepository.getTotalRemainingAmountByClient(client);

        long activeCount = clientDebts.stream()
                .filter(debt -> debt.getStatus() == Debt.Status.ACTIVE)
                .count();

        long settledCount = clientDebts.stream()
                .filter(debt -> debt.getStatus() == Debt.Status.SETTLED)
                .count();

        double totalActiveAmount = clientDebts.stream()
                .filter(debt -> debt.getStatus() == Debt.Status.ACTIVE)
                .mapToDouble(debt -> debt.getTotalAmount().doubleValue())
                .sum();

        double averageAmount = activeCount > 0 ? totalActiveAmount / activeCount : 0.0;

        return new DebtStatistics(
            totalActiveAmount,
            totalRemaining != null ? totalRemaining : 0.0,
            activeCount,
            settledCount,
            averageAmount
        );
    }

    // Bulk operations
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public BulkOperationResult markMultipleDebtsAsSettled(List<Long> debtIds) {
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new java.util.ArrayList<>();

        for (Long debtId : debtIds) {
            try {
                Debt debt = debtRepository.findById(debtId)
                        .orElseThrow(() -> new RuntimeException("Debt not found: " + debtId));

                debt.setRemainingAmount(BigDecimal.ZERO);
                debt.setStatus(Debt.Status.SETTLED);
                debt.setUpdatedAt(java.time.LocalDateTime.now());
                debtRepository.save(debt);

                successCount++;
            } catch (Exception e) {
                failureCount++;
                errors.add("Debt " + debtId + ": " + e.getMessage());
            }
        }

        return new BulkOperationResult(successCount, failureCount, errors);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public BulkOperationResult deleteMultipleDebts(List<Long> debtIds) {
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new java.util.ArrayList<>();

        for (Long debtId : debtIds) {
            try {
                if (debtRepository.existsById(debtId)) {
                    debtRepository.deleteById(debtId);
                    successCount++;
                } else {
                    failureCount++;
                    errors.add("Debt not found: " + debtId);
                }
            } catch (Exception e) {
                failureCount++;
                errors.add("Debt " + debtId + ": " + e.getMessage());
            }
        }

        return new BulkOperationResult(successCount, failureCount, errors);
    }

    // Priority and overdue management
    public List<Debt> getHighPriorityDebts(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        if (userPrincipal.getRole() == User.Role.ADMIN) {
            return debtRepository.findHighValueActiveDebts(BigDecimal.valueOf(1000.0));
        } else {
            Client client = clientService.findByPhone(userPrincipal.getUsername())
                    .orElseThrow(() -> new RuntimeException("Client not found for user"));
            List<Debt> clientDebts = debtRepository.findByClientAndStatus(client, Debt.Status.ACTIVE);
            return clientDebts.stream()
                    .filter(debt -> debt.getTotalAmount().compareTo(BigDecimal.valueOf(500.0)) >= 0)
                    .sorted((a, b) -> b.getTotalAmount().compareTo(a.getTotalAmount()))
                    .toList();
        }
    }

    // Validation methods
    public void validateDebtCreation(Long clientId, BigDecimal amount, String description) {
        if (clientId == null) {
            throw new RuntimeException("Client ID is required");
        }

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Amount must be greater than 0");
        }

        if (description == null || description.trim().isEmpty()) {
            throw new RuntimeException("Description is required");
        }

        // Check if client exists
        clientService.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
    }

    // Data classes
    public static class DebtStatistics {
        private final double totalActiveAmount;
        private final double totalRemainingAmount;
        private final long activeCount;
        private final long settledCount;
        private final double averageAmount;

        public DebtStatistics(double totalActiveAmount, double totalRemainingAmount,
                            long activeCount, long settledCount, double averageAmount) {
            this.totalActiveAmount = totalActiveAmount;
            this.totalRemainingAmount = totalRemainingAmount;
            this.activeCount = activeCount;
            this.settledCount = settledCount;
            this.averageAmount = averageAmount;
        }

        // Getters
        public double getTotalActiveAmount() { return totalActiveAmount; }
        public double getTotalRemainingAmount() { return totalRemainingAmount; }
        public long getActiveCount() { return activeCount; }
        public long getSettledCount() { return settledCount; }
        public double getAverageAmount() { return averageAmount; }
    }

    public static class BulkOperationResult {
        private final int successCount;
        private final int failureCount;
        private final List<String> errors;

        public BulkOperationResult(int successCount, int failureCount, List<String> errors) {
            this.successCount = successCount;
            this.failureCount = failureCount;
            this.errors = errors;
        }

        // Getters
        public int getSuccessCount() { return successCount; }
        public int getFailureCount() { return failureCount; }
        public List<String> getErrors() { return errors; }
    }
}