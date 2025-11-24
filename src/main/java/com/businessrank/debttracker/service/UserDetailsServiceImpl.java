package com.businessrank.debttracker.service;

import com.businessrank.debttracker.model.User;
import com.businessrank.debttracker.repository.UserRepository;
import com.businessrank.debttracker.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with phone: " + phone));

        // Debug logs for user loading
        System.out.println("UserDetailsServiceImpl Debug:");
        System.out.println("  Loading user by phone: " + phone);
        System.out.println("  User found: " + user.getName());
        System.out.println("  User role: " + user.getRole());
        System.out.println("  User ID: " + user.getId());

        return UserPrincipal.create(user);
    }
}