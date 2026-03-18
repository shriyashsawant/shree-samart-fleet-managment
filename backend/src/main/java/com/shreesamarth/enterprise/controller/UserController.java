package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(Authentication authentication) {
        // Find current user's tenant
        return userRepository.findByUsername(authentication.getName())
                .map(user -> {
                    Tenant tenant = user.getTenant();
                    if (tenant == null) return ResponseEntity.ok(userRepository.findAll());
                    return ResponseEntity.ok(userRepository.findByTenantId(tenant.getId()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createUser(Authentication authentication, @RequestBody Map<String, String> userData) {
        String username = userData.get("username");
        String email = userData.get("email");
        String password = userData.get("password");
        String role = userData.getOrDefault("role", "USER");

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }

        return userRepository.findByUsername(authentication.getName())
                .map(currentUser -> {
                    User newUser = new User();
                    newUser.setUsername(username);
                    newUser.setPassword(passwordEncoder.encode(password));
                    newUser.setRole(role);
                    newUser.setTenant(currentUser.getTenant()); // Link to same tenant

                    userRepository.save(newUser);
                    
                    // Trigger welcome email with details
                    if (email != null && !email.isEmpty()) {
                        emailService.sendWelcomeEmail(email, username, password);
                    }

                    return ResponseEntity.ok(newUser);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
