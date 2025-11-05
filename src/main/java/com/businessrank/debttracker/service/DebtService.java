package com.businessrank.debttracker.service;

import com.businessrank.debttracker.model.Client;
import com.businessrank.debttracker.model.Debt;
import com.businessrank.debttracker.model.User;
import com.businessrank.debttracker.repository.DebtRepository;
import com.businessrank.debttracker.security.UserPrincipal;
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

    @Autowired
    private DebtRepository debtRepository;

    @Autowired
    private ClientService clientService;

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Debt createDebt(Long clientId, BigDecimal totalAmount, String description) {
        Client client = clientService.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Debt debt = new Debt(client, totalAmount, description);
        return debtRepository.save(debt);
    }

    public List<Debt> getDebtsForUser(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        if (userPrincipal.getRole() == User.Role.ADMIN) {
            return debtRepository.findAll();
        } else {
            // Find client associated with this user
            Client client = clientService.findByPhone(userPrincipal.getUsername())
                    .orElseThrow(() -> new RuntimeException("Client not found for user"));
            return debtRepository.findByClient(client);
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
    public Debt updateDebt(Long id, BigDecimal totalAmount, String description) {
        Debt debt = debtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Debt not found"));

        debt.setTotalAmount(totalAmount);
        debt.setDescription(description);

        return debtRepository.save(debt);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteDebt(Long id) {
        Debt debt = debtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Debt not found"));

        debtRepository.delete(debt);
    }

    public Double getTotalRemainingAmountForClient(Client client) {
        Double total = debtRepository.getTotalRemainingAmountByClient(client);
        return total != null ? total : 0.0;
    }
}