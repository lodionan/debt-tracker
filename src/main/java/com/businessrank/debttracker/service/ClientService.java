package com.businessrank.debttracker.service;

import com.businessrank.debttracker.model.Client;
import com.businessrank.debttracker.model.Debt;
import com.businessrank.debttracker.model.User;
import com.businessrank.debttracker.repository.ClientRepository;
import com.businessrank.debttracker.repository.DebtRepository;
import com.businessrank.debttracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DebtRepository debtRepository;

    @Autowired
    private NotificationService notificationService;

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Client createClient(String name, String phone, String address) {
        System.out.println("ClientService Debug - Creating client:");
        System.out.println("  Name: " + name);
        System.out.println("  Phone: " + phone);
        System.out.println("  Address: " + address);

        if (clientRepository.existsByPhone(phone)) {
            System.out.println("ClientService Debug - Client with phone " + phone + " already exists");
            throw new RuntimeException("Client with this phone number already exists");
        }

        // Check if user already exists, if not create it
        User user = userRepository.findByPhone(phone).orElse(null);
        System.out.println("ClientService Debug - User lookup result: " + (user != null ? "Found user " + user.getName() : "User not found, will create"));

        if (user == null) {
            // Create user first (without password initially)
            System.out.println("ClientService Debug - Creating new user");
            user = new User(name, phone, User.Role.CLIENT);
            user = userRepository.save(user);
            System.out.println("ClientService Debug - User created with ID: " + user.getId());
        } else {
            // Update user name if it changed
            if (!user.getName().equals(name)) {
                System.out.println("ClientService Debug - Updating existing user name from " + user.getName() + " to " + name);
                user.setName(name);
                user = userRepository.save(user);
            }
        }

        // Create client linked to user
        System.out.println("ClientService Debug - Creating client linked to user ID: " + user.getId());
        Client client = new Client(name, phone, address, user);
        client = clientRepository.save(client);
        System.out.println("ClientService Debug - Client created with ID: " + client.getId());

        // Ensure bidirectional relationship is set
        if (client.getUser() == null) {
            System.out.println("ClientService Debug - Setting user relationship manually");
            client.setUser(user);
            client = clientRepository.save(client);
        }

        System.out.println("ClientService Debug - Final client user relationship: " + (client.getUser() != null ? "OK" : "NULL"));

        // Send notification to admin about new client
        try {
            notificationService.sendNewClientNotification(client);
        } catch (Exception e) {
            // Log error but don't fail client creation
            System.err.println("Error sending new client notification: " + e.getMessage());
        }

        return client;
    }

    public Client save(Client client) {
        return clientRepository.save(client);
    }

    public Optional<Client> findByPhone(String phone) {
        return clientRepository.findByPhone(phone);
    }

    public Optional<Client> findById(Long id) {
        return clientRepository.findById(id);
    }

    public List<Client> findAll() {
        List<Client> allClients = clientRepository.findAll();
        System.out.println("ClientService Debug - Total clients in DB: " + allClients.size());

        List<Client> activeClients = allClients.stream()
                .filter(client -> !client.isArchived())
                .collect(java.util.stream.Collectors.toList());

        System.out.println("ClientService Debug - Active clients returned: " + activeClients.size());
        System.out.println("ClientService Debug - Archived clients filtered out: " + (allClients.size() - activeClients.size()));

        return activeClients;
    }

    public List<Client> findAllArchived() {
        List<Client> allClients = clientRepository.findAll();
        return allClients.stream()
                .filter(Client::isArchived)
                .collect(java.util.stream.Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Client updateClient(Long id, String name, String phone, String address) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        // Check if phone is being changed and if it's already taken
        if (!client.getPhone().equals(phone) && clientRepository.existsByPhone(phone)) {
            throw new RuntimeException("Phone number already exists");
        }

        client.setName(name);
        client.setPhone(phone);
        client.setAddress(address);

        return clientRepository.save(client);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void archiveClient(Long id) {
        System.out.println("ClientService Debug - Archiving client with ID: " + id);

        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        System.out.println("ClientService Debug - Client found: " + client.getName() + " (archived: " + client.isArchived() + ")");

        // Check if client has active debts before archiving
        boolean hasActiveDebts = checkClientHasActiveDebts(client);
        if (hasActiveDebts) {
            throw new RuntimeException("No se puede archivar el cliente porque tiene deudas activas pendientes de pago");
        }

        // Archive the client
        client.setArchived(true);
        client = clientRepository.save(client);
        System.out.println("ClientService Debug - Client archived successfully: " + client.isArchived());

        // Archive the associated user
        if (client.getUser() != null) {
            System.out.println("ClientService Debug - Archiving associated user: " + client.getUser().getName());
            client.getUser().setArchived(true);
            User archivedUser = userRepository.save(client.getUser());
            System.out.println("ClientService Debug - User archived successfully: " + archivedUser.isArchived());
        } else {
            System.out.println("ClientService Debug - No associated user found for client");
        }
    }

    private boolean checkClientHasActiveDebts(Client client) {
        System.out.println("ClientService Debug - Checking active debts for client: " + client.getName() + " (ID: " + client.getId() + ")");

        try {
            // Query for active debts with remaining amount > 0
            List<Debt> activeDebts = debtRepository.findByClientAndStatus(client, Debt.Status.ACTIVE);

            // Filter debts that actually have remaining amount > 0
            boolean hasUnpaidDebts = activeDebts.stream()
                    .anyMatch(debt -> debt.getRemainingAmount().compareTo(java.math.BigDecimal.ZERO) > 0);

            System.out.println("ClientService Debug - Found " + activeDebts.size() + " active debts, " +
                             (hasUnpaidDebts ? "HAS" : "NO") + " unpaid amounts");

            // Also check total remaining amount as additional validation
            Double totalRemaining = debtRepository.getTotalRemainingAmountByClient(client);
            boolean hasRemainingAmount = totalRemaining != null && totalRemaining > 0.0;

            System.out.println("ClientService Debug - Total remaining amount: " + totalRemaining +
                             ", Has remaining: " + hasRemainingAmount);

            return hasUnpaidDebts || hasRemainingAmount;

        } catch (Exception e) {
            System.err.println("ClientService Error - Failed to check active debts for client " +
                             client.getName() + ": " + e.getMessage());
            // In case of error, assume no active debts to avoid blocking archiving
            return false;
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void unarchiveClient(Long id) {
        System.out.println("ClientService Debug - Unarchiving client with ID: " + id);

        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        System.out.println("ClientService Debug - Client found: " + client.getName() + " (archived: " + client.isArchived() + ")");

        // Unarchive the client
        client.setArchived(false);
        client = clientRepository.save(client);
        System.out.println("ClientService Debug - Client unarchived successfully: " + !client.isArchived());

        // Unarchive the associated user
        if (client.getUser() != null) {
            System.out.println("ClientService Debug - Unarchiving associated user: " + client.getUser().getName());
            client.getUser().setArchived(false);
            User unarchivedUser = userRepository.save(client.getUser());
            System.out.println("ClientService Debug - User unarchived successfully: " + !unarchivedUser.isArchived());
        } else {
            System.out.println("ClientService Debug - No associated user found for client");
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public User createUserForClient(String name, String phone) {
        if (userRepository.existsByPhone(phone)) {
            throw new RuntimeException("User with this phone number already exists");
        }

        User user = new User(name, phone, User.Role.CLIENT);
        return userRepository.save(user);
    }
}