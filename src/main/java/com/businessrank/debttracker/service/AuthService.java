package com.businessrank.debttracker.service;

import com.businessrank.debttracker.model.User;
import com.businessrank.debttracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerClient(String name, String phone, String password) {
        if (userRepository.existsByPhone(phone)) {
            throw new RuntimeException("Phone number already exists");
        }

        User user = new User(name, phone, User.Role.CLIENT);
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    public User createAdmin(String name, String phone, String password) {
        if (userRepository.existsByPhone(phone)) {
            throw new RuntimeException("Phone number already exists");
        }

        User user = new User(name, phone, User.Role.ADMIN);
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    public User findByPhone(String phone) {
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}