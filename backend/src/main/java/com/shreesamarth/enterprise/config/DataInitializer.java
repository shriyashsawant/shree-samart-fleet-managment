package com.shreesamarth.enterprise.config;

import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.TenantRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create default tenant (Shree Samarth Enterprises)
        Tenant defaultTenant;
        if (tenantRepository.count() == 0) {
            defaultTenant = new Tenant();
            defaultTenant.setCompanyName("Shree Samarth Enterprises");
            defaultTenant.setCompanyCode("SSE001");
            defaultTenant.setEmail("shreesamarth@example.com");
            defaultTenant.setPhone("9876543210");
            defaultTenant.setAddress("Mumbai, Maharashtra");
            defaultTenant.setGstNumber("27ASXPP6488L1ZD");
            defaultTenant.setStatus("ACTIVE");
            defaultTenant = tenantRepository.save(defaultTenant);
        } else {
            defaultTenant = tenantRepository.findAll().get(0);
        }

        // Create default admin user if not exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setTenant(defaultTenant);
            userRepository.save(admin);
        }

        // Create sample vehicles if none exist
        if (vehicleRepository.count() == 0) {
            // Vehicle 1
            Vehicle v1 = new Vehicle();
            v1.setVehicleNumber("MH12AB1234");
            v1.setModel("Tata 712");
            v1.setPurchaseDate(LocalDate.of(2020, 1, 15));
            v1.setChassisNumber("MAT123456789");
            v1.setEngineNumber("ENG123456789");
            v1.setInsuranceCompany("ICICI Lombard");
            v1.setInsuranceExpiry(LocalDate.of(2026, 12, 31));
            v1.setEmiAmount(new BigDecimal("25000"));
            v1.setEmiBank("HDFC Bank");
            v1.setEmiStartDate(LocalDate.of(2020, 2, 1));
            v1.setEmiEndDate(LocalDate.of(2025, 1, 31));
            v1.setStatus("ACTIVE");
            v1.setTenant(defaultTenant);
            vehicleRepository.save(v1);

            // Vehicle 2
            Vehicle v2 = new Vehicle();
            v2.setVehicleNumber("MH12XY4567");
            v2.setModel("Ashok Leyland 312");
            v2.setPurchaseDate(LocalDate.of(2021, 6, 10));
            v2.setChassisNumber("MAT987654321");
            v2.setEngineNumber("ENG987654321");
            v2.setInsuranceCompany("Bajaj Allianz");
            v2.setInsuranceExpiry(LocalDate.of(2026, 6, 9));
            v2.setEmiAmount(new BigDecimal("28000"));
            v2.setEmiBank("Axis Bank");
            v2.setEmiStartDate(LocalDate.of(2021, 7, 1));
            v2.setEmiEndDate(LocalDate.of(2026, 6, 30));
            v2.setStatus("ACTIVE");
            v2.setTenant(defaultTenant);
            vehicleRepository.save(v2);

            // Vehicle 3
            Vehicle v3 = new Vehicle();
            v3.setVehicleNumber("MH14PQ7890");
            v3.setModel("BharatBenz 714");
            v3.setPurchaseDate(LocalDate.of(2022, 3, 20));
            v3.setChassisNumber("MAT456789123");
            v3.setEngineNumber("ENG456789123");
            v3.setInsuranceCompany("Reliance General");
            v3.setInsuranceExpiry(LocalDate.of(2026, 3, 19));
            v3.setEmiAmount(new BigDecimal("30000"));
            v3.setEmiBank("SBI");
            v3.setEmiStartDate(LocalDate.of(2022, 4, 1));
            v3.setEmiEndDate(LocalDate.of(2027, 3, 31));
            v3.setStatus("ACTIVE");
            v3.setTenant(defaultTenant);
            vehicleRepository.save(v3);
        }
    }
}
