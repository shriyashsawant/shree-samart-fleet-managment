package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.dto.AuthResponse;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        AuthResponse response = authService.authenticate(username, password);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(user -> ResponseEntity.ok(Map.of(
                        "id", user.getId(),
                        "username", user.getUsername(),
                        "role", user.getRole() != null ? user.getRole() : "USER"
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> userData) {
        if (userRepository.existsByUsername(userData.get("username"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }

        User user = new User();
        user.setUsername(userData.get("username"));
        user.setPassword(passwordEncoder.encode(userData.get("password")));
        user.setRole(userData.getOrDefault("role", "USER"));

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }
}
