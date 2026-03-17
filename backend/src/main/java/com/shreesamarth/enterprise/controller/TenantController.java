package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.repository.TenantRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
    public ResponseEntity<?> getMyTenant(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        
        return userRepository.findByUsername(authentication.getName())
                .map(user -> {
                    Tenant tenant = user.getTenant();
                    if (tenant == null) return ResponseEntity.notFound().build();
                    return ResponseEntity.ok(tenant);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyTenant(Authentication authentication, @RequestBody Tenant updatedTenant) {
        if (authentication == null) return ResponseEntity.status(401).build();

        return userRepository.findByUsername(authentication.getName())
                .map(user -> {
                    Tenant tenant = user.getTenant();
                    if (tenant == null) return ResponseEntity.notFound().build();

                    tenant.setCompanyName(updatedTenant.getCompanyName());
                    tenant.setEmail(updatedTenant.getEmail());
                    tenant.setPhone(updatedTenant.getPhone());
                    tenant.setAddress(updatedTenant.getAddress());
                    tenant.setGstNumber(updatedTenant.getGstNumber());
                    tenant.setPanNumber(updatedTenant.getPanNumber());
                    tenant.setBankName(updatedTenant.getBankName());
                    tenant.setAccountNumber(updatedTenant.getAccountNumber());
                    tenant.setIfscCode(updatedTenant.getIfscCode());
                    
                    // logoPath is handled separately by a file upload endpoint
                    
                    tenantRepository.save(tenant);
                    return ResponseEntity.ok(tenant);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/me/logo")
    public ResponseEntity<?> updateLogo(Authentication authentication, @RequestBody Map<String, String> payload) {
        if (authentication == null) return ResponseEntity.status(401).build();
        String logoPath = payload.get("logoPath");

        return userRepository.findByUsername(authentication.getName())
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
