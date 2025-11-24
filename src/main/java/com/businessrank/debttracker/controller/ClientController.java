package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.model.Client;
import com.businessrank.debttracker.service.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clients")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://10.0.2.2:8080", "http://192.168.1.65:8080"})
public class ClientController {

    @Autowired
    private ClientService clientService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> createClient(@RequestBody CreateClientRequest request) {
        try {
            Client client = clientService.createClient(
                request.getName(),
                request.getPhone(),
                request.getAddress()
            );

            // Set email if provided
            if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                client.setEmail(request.getEmail());
                client = clientService.save(client);
            }

            // User account is created automatically in createClient method
            // Verify that the user relationship is properly set
            System.out.println("ClientController Debug - Building response for client ID: " + client.getId());
            System.out.println("ClientController Debug - Client user relationship: " + (client.getUser() != null ? "OK" : "NULL"));

            if (client.getUser() == null) {
                System.out.println("ClientController Warning: Client created but user relationship is null");
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Client created successfully (user relationship issue)");

                Map<String, Object> clientData = new HashMap<>();
                clientData.put("id", client.getId());
                clientData.put("name", client.getName());
                clientData.put("email", client.getEmail());
                clientData.put("phone", client.getPhone());
                clientData.put("address", client.getAddress());
                clientData.put("createdAt", client.getCreatedAt().toString());
                response.put("client", clientData);

                return ResponseEntity.ok(response);
            }

            System.out.println("ClientController Debug - User ID: " + client.getUser().getId());
            System.out.println("ClientController Debug - User name: " + client.getUser().getName());
            System.out.println("ClientController Debug - User phone: " + client.getUser().getPhone());
            System.out.println("ClientController Debug - User role: " + client.getUser().getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Client and user account created successfully");

            Map<String, Object> clientData = new HashMap<>();
            clientData.put("id", client.getId());
            clientData.put("name", client.getName());
            clientData.put("email", client.getEmail()); // Can be null
            clientData.put("phone", client.getPhone());
            clientData.put("address", client.getAddress()); // Can be null
            clientData.put("createdAt", client.getCreatedAt().toString());
            response.put("client", clientData);

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", client.getUser().getId());
            userData.put("name", client.getUser().getName());
            userData.put("phone", client.getUser().getPhone());
            userData.put("role", client.getUser().getRole());
            response.put("user", userData);

            System.out.println("ClientController Debug - Response built successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("ClientController Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Client>> getAllClients() {
        // Debug logs for authorization
        System.out.println("ClientController Debug:");
        System.out.println("  Endpoint: GET /api/clients");
        System.out.println("  Authentication: " + org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
        if (org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication() != null) {
            System.out.println("  Principal: " + org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal());
            System.out.println("  Authorities: " + org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getAuthorities());
        }

        List<Client> clients = clientService.findAll();
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClient(@PathVariable Long id) {
        return clientService.findById(id)
                .map(client -> ResponseEntity.ok(client))
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateClient(@PathVariable Long id, @RequestBody UpdateClientRequest request) {
        try {
            Client client = clientService.updateClient(id, request.getName(), request.getPhone(), request.getAddress());
            if (request.getEmail() != null) {
                client.setEmail(request.getEmail());
                client = clientService.save(client);
            }
            return ResponseEntity.ok(client);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> archiveClient(@PathVariable Long id) {
        try {
            System.out.println("ClientController Debug - Archiving client with ID: " + id);
            clientService.archiveClient(id);
            System.out.println("ClientController Debug - Client archived successfully");
            return ResponseEntity.ok(Map.of("message", "Client archived successfully"));
        } catch (RuntimeException e) {
            System.out.println("ClientController Error - Failed to archive client: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/unarchive")
    public ResponseEntity<?> unarchiveClient(@PathVariable Long id) {
        try {
            System.out.println("ClientController Debug - Unarchiving client with ID: " + id);
            clientService.unarchiveClient(id);
            System.out.println("ClientController Debug - Client unarchived successfully");
            return ResponseEntity.ok(Map.of("message", "Client unarchived successfully"));
        } catch (RuntimeException e) {
            System.out.println("ClientController Error - Failed to unarchive client: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/archived")
    public ResponseEntity<List<Client>> getArchivedClients() {
        System.out.println("ClientController Debug - Getting archived clients");
        List<Client> archivedClients = clientService.findAllArchived();
        System.out.println("ClientController Debug - Found " + archivedClients.size() + " archived clients");
        return ResponseEntity.ok(archivedClients);
    }

    public static class CreateClientRequest {
        private String name;
        private String email;
        private String phone;
        private String address;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
    }

    public static class UpdateClientRequest {
        private String name;
        private String email;
        private String phone;
        private String address;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
    }
}