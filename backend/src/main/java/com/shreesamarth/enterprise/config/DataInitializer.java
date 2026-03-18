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
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final ClientRepository clientRepository;
    private final BillRepository billRepository;
    private final PasswordEncoder passwordEncoder;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("d-M-yyyy");

    @Override
    public void run(String... args) {
        // Global variables for linking
        Tenant defaultTenant = null;
        Vehicle v1 = null;
        Vehicle v2 = null;
        Client client1 = null;
        Client client2 = null;
        Client client3 = null;

        // Create default tenant (Shree Samarth Enterprises)
        try {
            if (tenantRepository.count() == 0) {
                System.out.println("DEBUG: Creating default tenant 'Shree Samarth Enterprises'...");
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
                System.out.println("DEBUG: Using existing tenant: " + defaultTenant.getCompanyName());
            }
        } catch (Exception e) {
            System.err.println("CRITICAL: Failed to initialize tenant: " + e.getMessage());
            return;
        }

        // Create users
        try {
            System.out.println("DEBUG: Ensuring 'admin' user is synchronized...");
            User admin = userRepository.findByUsername("admin")
                                        .orElse(new User());
            if (admin.getId() == null) {
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
            }
            admin.setRole("ADMIN");
            admin.setTenant(defaultTenant);
            userRepository.save(admin);

            System.out.println("DEBUG: Ensuring 'ShreeSamarth' user is synchronized...");
            User user = userRepository.findByUsername("ShreeSamarth")
                                        .orElse(new User());
            if (user.getId() == null) {
                user.setUsername("ShreeSamarth");
                user.setPassword(passwordEncoder.encode("Aarti@2005"));
            }
            user.setRole("ADMIN");
            user.setTenant(defaultTenant);
            userRepository.save(user);
        } catch (Exception e) {
            System.err.println("ERROR: Failed to initialize users: " + e.getMessage());
        }

        // Create vehicles and drivers
        try {
            System.out.println("DEBUG: Ensuring vehicle MH09CU1605 exists and is updated...");
            v1 = vehicleRepository.findByVehicleNumber("MH09CU1605")
                                            .orElse(new Vehicle());
            v1.setVehicleNumber("MH09CU1605");
            v1.setModel("TATA LPK 2518TC BSIII");
            v1.setManufacturer("TATA MOTORS LTD");
            v1.setRegistrationDate(LocalDate.parse("16-12-2013", dateFormatter));
            v1.setPurchaseDate(LocalDate.parse("16-12-2013", dateFormatter));
            v1.setChassisNumber("MAT448062D3E10979");
            v1.setEngineNumber("B591803231E63327001");
            v1.setOwnerName("MARUTI PATIL");
            v1.setStatus("ACTIVE");
            v1.setTenant(defaultTenant);
            v1 = vehicleRepository.save(v1);

            if (driverRepository.count() == 0 || !driverRepository.existsByName("Janak Biswakarma")) {
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
                System.out.println("DEBUG: Synchronized Driver Janak.");
            }

            System.out.println("DEBUG: Ensuring vehicle MH43Y2651 exists and is updated...");
            v2 = vehicleRepository.findByVehicleNumber("MH43Y2651")
                                            .orElse(new Vehicle());
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

            if (driverRepository.count() < 2 || !driverRepository.existsByName("Rabin")) {
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
                System.out.println("DEBUG: Synchronized Driver Rabin.");
            }
        } catch (Exception e) {
            System.err.println("ERROR: Failed to initialize fleet: " + e.getMessage());
        }

        // Create sample clients
        try {
            if (clientRepository.count() < 3) {
                System.out.println("DEBUG: Creating sample clients...");
                client1 = new Client();
                client1.setPartyName("PRISM JOHNSON LIMITED");
                client1.setGstNumber("27ASXPP6488L1ZD");
                client1.setAddress("Mumbai, Maharashtra");
                client1.setPhone("9876543210");
                client1.setEmail("prismjohnson@example.com");
                client1.setTenant(defaultTenant);
                client1 = clientRepository.save(client1);

                client2 = new Client();
                client2.setPartyName("ULTRA TECH CEMENT");
                client2.setGstNumber("27AABCT8719Q1ZO");
                client2.setAddress("Mumbai, Maharashtra");
                client2.setPhone("9876543211");
                client2.setEmail("ultratech@example.com");
                client2.setTenant(defaultTenant);
                client2 = clientRepository.save(client2);

                client3 = new Client();
                client3.setPartyName("AMBUJA CEMENTS");
                client3.setGstNumber("27AABCA7507Q1ZI");
                client3.setAddress("Mumbai, Maharashtra");
                client3.setPhone("9876543212");
                client3.setEmail("ambuja@example.com");
                client3.setTenant(defaultTenant);
                client3 = clientRepository.save(client3);

                // Add sample bills for these clients
                System.out.println("DEBUG: Creating professional invoices...");
                Bill b1 = new Bill();
                b1.setBillNo("BILL-2026-001");
                b1.setClient(client1); // PRISM JOHNSON
                b1.setVehicle(v1); // MH09CU1605
                b1.setBillDate(LocalDate.parse("15-03-2026", dateFormatter));
                b1.setBasicAmount(new BigDecimal("25000"));
                b1.setCgstAmount(new BigDecimal("2250"));
                b1.setSgstAmount(new BigDecimal("2250"));
                b1.setTotalAmount(new BigDecimal("29500"));
                b1.setStatus("PENDING");
                b1.setTenant(defaultTenant);
                billRepository.save(b1);

                Bill b2 = new Bill();
                b2.setBillNo("BILL-2026-002");
                b2.setClient(client2); // ULTRA TECH
                b2.setVehicle(v2); // MH43Y2651
                b2.setBillDate(LocalDate.parse("12-03-2026", dateFormatter));
                b2.setBasicAmount(new BigDecimal("18500"));
                b2.setCgstAmount(new BigDecimal("1665"));
                b2.setSgstAmount(new BigDecimal("1665"));
                b2.setTotalAmount(new BigDecimal("21830"));
                b2.setStatus("PAID");
                b2.setTenant(defaultTenant);
                billRepository.save(b2);

                Bill b3 = new Bill();
                b3.setBillNo("BILL-2026-003");
                b3.setClient(client3); // AMBUJA
                b3.setVehicle(v1);
                b3.setBillDate(LocalDate.parse("10-03-2026", dateFormatter));
                b3.setBasicAmount(new BigDecimal("42000"));
                b3.setCgstAmount(new BigDecimal("3780"));
                b3.setSgstAmount(new BigDecimal("3780"));
                b3.setTotalAmount(new BigDecimal("49560"));
                b3.setStatus("PARTIAL");
                b3.setTenant(defaultTenant);
                billRepository.save(b3);
            } else {
                List<Client> existingClients = clientRepository.findAll();
                client1 = existingClients.size() > 0 ? existingClients.get(0) : null;
                client2 = existingClients.size() > 1 ? existingClients.get(1) : null;
                client3 = existingClients.size() > 2 ? existingClients.get(2) : null;
            }
        } catch (Exception e) {
            System.err.println("ERROR: Failed to initialize clients/bills: " + e.getMessage());
        }
    }
}
