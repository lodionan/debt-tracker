package com.businessrank.debttracker.controller;

import com.businessrank.debttracker.model.User;
import com.businessrank.debttracker.repository.UserRepository;
import com.businessrank.debttracker.security.JwtUtils;
import com.businessrank.debttracker.security.UserPrincipal;
import com.businessrank.debttracker.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://192.168.1.65:3000", "http://192.168.1.65:3001", "http://10.0.2.2:8080", "http://192.168.1.65:8080", "https://mirijoyeria.vercel.app"})
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        return ResponseEntity.ok(Map.of("message", "API is working!", "status", "success"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        // Check if user exists
        User user = authService.findByPhone(loginRequest.getPhone());
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Usuario no encontrado"));
        }

        // For CLIENT role, allow login without password
        if (user.getRole() == User.Role.CLIENT) {
            // Create authentication token without password validation
            UserPrincipal userPrincipal = new UserPrincipal(user);
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "phone", user.getPhone(),
                "role", user.getRole()
            ));

            return ResponseEntity.ok(response);
        } else {
            // For ADMIN role, require password authentication
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getPhone(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserPrincipal userDetails = (UserPrincipal) authentication.getPrincipal();

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", Map.of(
                "id", userDetails.getId(),
                "name", userDetails.getName(),
                "phone", userDetails.getUsername(),
                "role", userDetails.getRole()
            ));

            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/register-client")
    public ResponseEntity<?> registerClient(@RequestBody RegisterRequest registerRequest) {
        try {
            User user = authService.registerClient(
                registerRequest.getName(),
                registerRequest.getPhone(),
                registerRequest.getPassword()
            );

            return ResponseEntity.ok(Map.of("message", "Client registered successfully", "userId", user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/client-login")
    public ResponseEntity<?> clientLogin(@RequestBody ClientLoginRequest loginRequest) {
        try {
            User user = authService.findByPhone(loginRequest.getPhone());
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Usuario no encontrado"));
            }

            if (user.getRole() != User.Role.CLIENT) {
                return ResponseEntity.badRequest().body(Map.of("error", "Este endpoint es solo para clientes"));
            }

            // Create authentication token for client (no password required)
            UserPrincipal userPrincipal = new UserPrincipal(user);
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "phone", user.getPhone(),
                "role", user.getRole()
            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error en login de cliente"));
        }
    }

    // Temporary endpoint to promote user to admin (remove in production)
    @PostMapping("/promote-to-admin")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> promoteToAdmin(@RequestBody PromoteRequest promoteRequest) {
        try {
            User user = authService.findByPhone(promoteRequest.getPhone());
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Usuario no encontrado"));
            }

            // Update role to ADMIN
            user.setRole(User.Role.ADMIN);
            // Save using repository (authService doesn't have save method)
            User savedUser = userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "User promoted to admin successfully", "userId", savedUser.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class LoginRequest {
        private String phone;
        private String password;

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class ClientLoginRequest {
        private String phone;

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }

    public static class RegisterRequest {
        private String name;
        private String phone;
        private String password;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class PromoteRequest {
        private String phone;

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }
}