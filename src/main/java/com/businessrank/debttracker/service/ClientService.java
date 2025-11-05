package com.businessrank.debttracker.service;

import com.businessrank.debttracker.model.Client;
import com.businessrank.debttracker.model.User;
import com.businessrank.debttracker.repository.ClientRepository;
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

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Client createClient(String name, String phone, String address) {
        if (clientRepository.existsByPhone(phone)) {
            throw new RuntimeException("Client with this phone number already exists");
        }

        // Create user first (without password initially)
        User user = new User(name, phone, User.Role.CLIENT);
        user = userRepository.save(user);

        // Create client linked to user
        Client client = new Client(name, phone, address, user);
        return clientRepository.save(client);
    }

    public Optional<Client> findByPhone(String phone) {
        return clientRepository.findByPhone(phone);
    }

    public Optional<Client> findById(Long id) {
        return clientRepository.findById(id);
    }

    public List<Client> findAll() {
        return clientRepository.findAll();
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
    public void deleteClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        clientRepository.delete(client);
        // Note: User is not deleted to maintain history
    }
}