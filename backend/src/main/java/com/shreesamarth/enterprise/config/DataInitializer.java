package com.shreesamarth.enterprise.config;

import com.shreesamarth.enterprise.entity.*;
import com.shreesamarth.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("d-M-yyyy");

    @Override
    public void run(String... args) {
        // Create default tenant (Shree Samarth Enterprises)
        Tenant defaultTenant;
        if (tenantRepository.count() == 0) {
            defaultTenant = new Tenant();
            defaultTenant.setCompanyName("Shree Samarth Enterprises");
            defaultTenant.setCompanyCode("SSE001");
            defaultTenant.setEmail("shreesamarthenterprises@gmail.com");
            defaultTenant.setPhone("9876543210");
            defaultTenant.setAddress("Kolhapur, Maharashtra");
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

        // Create vehicles with real data
        if (vehicleRepository.count() == 0) {
            // Vehicle 1: MH09CU1605
            Vehicle v1 = new Vehicle();
            v1.setVehicleNumber("MH09CU1605");
            v1.setModel("TATA LPK 2518TC BSIII");
            v1.setManufacturer("TATA MOTORS LTD");
            v1.setRegistrationDate(LocalDate.parse("16-12-2013", dateFormatter));
            v1.setPurchaseDate(LocalDate.parse("16-12-2013", dateFormatter));
            v1.setChassisNumber("MAT448062D3E10979");
            v1.setEngineNumber("B591803231E63327001");
            v1.setStatus("ACTIVE");
            v1.setTenant(defaultTenant);
            v1 = vehicleRepository.save(v1);

            // Driver 1: Janak Biswakarma
            Driver d1 = new Driver();
            d1.setName("Janak Biswakarma");
            d1.setPhone("9035867447");
            d1.setAddress("Bengaluru, Karnataka");
            d1.setAadhaarNumber("258671660132");
            d1.setDrivingLicense("MH12 20210046267");
            d1.setLicenseExpiry(LocalDate.parse("13-02-2041", dateFormatter));
            d1.setSalary(new BigDecimal("30000"));
            d1.setJoiningDate(LocalDate.now());
            d1.setStatus("ACTIVE");
            d1.setAssignedVehicle(v1);
            d1.setTenant(defaultTenant);
            driverRepository.save(d1);

            // Vehicle 2: MH43Y2651
            Vehicle v2 = new Vehicle();
            v2.setVehicleNumber("MH43Y2651");
            v2.setModel("EICHER");
            v2.setManufacturer("VE Commercial Vehicles Ltd");
            v2.setRegistrationDate(LocalDate.parse("02-05-2014", dateFormatter));
            v2.setPurchaseDate(LocalDate.parse("02-05-2014", dateFormatter));
            v2.setChassisNumber("MC236GRC0EA001727");
            v2.setEngineNumber("3IK84132674");
            v2.setStatus("ACTIVE");
            v2.setTenant(defaultTenant);
            v2 = vehicleRepository.save(v2);

            // Driver 2: Rabin
            Driver d2 = new Driver();
            d2.setName("Rabin");
            d2.setPhone("7249532760");
            d2.setAddress("Bengaluru, Karnataka");
            d2.setAadhaarNumber("732880818926");
            d2.setDrivingLicense("MH02 20080179498");
            d2.setLicenseExpiry(LocalDate.parse("14-07-2029", dateFormatter));
            d2.setSalary(new BigDecimal("30000"));
            d2.setJoiningDate(LocalDate.now());
            d2.setStatus("ACTIVE");
            d2.setAssignedVehicle(v2);
            d2.setTenant(defaultTenant);
            driverRepository.save(d2);

            // Create sample clients
            Client client1 = new Client();
            client1.setPartyName("PRISM JOHNSON LIMITED");
            client1.setGstNumber("27ASXPP6488L1ZD");
            client1.setAddress("Mumbai, Maharashtra");
            client1.setPhone("9876543210");
            client1.setEmail("prismjohnson@example.com");
            client1.setTenant(defaultTenant);
            clientRepository.save(client1);

            Client client2 = new Client();
            client2.setPartyName("ULTRA TECH CEMENT");
            client2.setGstNumber("27AABCT8719Q1ZO");
            client2.setAddress("Mumbai, Maharashtra");
            client2.setPhone("9876543211");
            client2.setEmail("ultratech@example.com");
            client2.setTenant(defaultTenant);
            clientRepository.save(client2);

            Client client3 = new Client();
            client3.setPartyName("AMBUJA CEMENTS");
            client3.setGstNumber("27AABCA7507Q1ZI");
            client3.setAddress("Mumbai, Maharashtra");
            client3.setPhone("9876543212");
            client3.setEmail("ambuja@example.com");
            client3.setTenant(defaultTenant);
            clientRepository.save(client3);
        }
    }
}
