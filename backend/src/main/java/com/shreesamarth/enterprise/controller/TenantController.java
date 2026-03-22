package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.repository.TenantRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tenant")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TenantController {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyTenant(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        
        User user = userRepository.findByUsernameWithTenant(authentication.getName()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        
        Tenant tenant = user.getTenant();
        if (tenant == null) {
            Tenant template = new Tenant();
            template.setCompanyName("New Entity");
            return ResponseEntity.ok(template);
        }
        return ResponseEntity.ok(tenant);
    }

    @PutMapping("/me")
    @Transactional
    public ResponseEntity<?> updateMyTenant(Authentication authentication, @RequestBody Tenant updatedTenant) {
        if (authentication == null) return ResponseEntity.status(401).build();

        return userRepository.findByUsernameWithTenant(authentication.getName())
                .map(user -> {
                    Tenant tenant = user.getTenant();
                    if (tenant == null) {
                        tenant = new Tenant();
                        tenant.setCreatedAt(java.time.LocalDateTime.now());
                        tenant.setCompanyCode("SM-" + String.format("%04d", user.getId()));
                        user.setTenant(tenant);
                    }

                    tenant.setCompanyName(updatedTenant.getCompanyName());
                    tenant.setEmail(updatedTenant.getEmail());
                    tenant.setPhone(updatedTenant.getPhone());
                    tenant.setAddress(updatedTenant.getAddress());
                    tenant.setGstNumber(updatedTenant.getGstNumber());
                    tenant.setPanNumber(updatedTenant.getPanNumber());
                    tenant.setBankName(updatedTenant.getBankName());
                    tenant.setAccountNumber(updatedTenant.getAccountNumber());
                    tenant.setIfscCode(updatedTenant.getIfscCode());
                    
                    tenantRepository.save(tenant);
                    userRepository.save(user);
                    return ResponseEntity.ok(tenant);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/me/logo")
    @Transactional
    public ResponseEntity<?> updateLogo(Authentication authentication, @RequestBody Map<String, String> payload) {
        if (authentication == null) return ResponseEntity.status(401).build();
        String logoPath = payload.get("logoPath");

        return userRepository.findByUsernameWithTenant(authentication.getName())
                .map(user -> {
                    Tenant tenant = user.getTenant();
                    if (tenant == null) return ResponseEntity.notFound().build();
                    tenant.setLogoPath(logoPath);
                    tenantRepository.save(tenant);
                    return ResponseEntity.ok(tenant);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
