package com.shreesamarth.enterprise.config;

import com.shreesamarth.enterprise.entity.*;
import com.shreesamarth.enterprise.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final ClientRepository clientRepository;
    private final BillRepository billRepository;
    private final PasswordEncoder passwordEncoder;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("d-M-yyyy");

    @PostConstruct
    public void init() {
        System.out.println("🚀 [DATA_INIT] >>> PULSE DETECTED: DataInitializer is starting now...");
        
        // Only initialize data on FIRST RUN - skip if users already exist
        if (userRepository.count() > 0) {
            System.out.println("🚀 [DATA_INIT] ⏭️ Data already exists, skipping initialization...");
            return;
        }
        
        // ── 1. TENANT ──────────────────────────────────────────────────────────
        Tenant defaultTenant;
        try {
            System.out.println("🚀 [DATA_INIT] Checking for existing tenants...");
            if (tenantRepository.count() == 0) {
                System.out.println("🚀 [DATA_INIT] No tenant found. Creating 'Shree Samarth Enterprises'...");
                Tenant t = new Tenant();
                t.setCompanyName("Shree Samarth Enterprises");
                t.setCompanyCode("SSE001");
                t.setEmail("shreesamarthenterprises@gmail.com");
                t.setPhone("9876543210");
                t.setAddress("Kolhapur, Maharashtra");
                t.setGstNumber("27ASXPP6488L1ZD");
                t.setStatus("ACTIVE");
                defaultTenant = tenantRepository.save(t);
                System.out.println("🚀 [DATA_INIT] ✅ Tenant created with ID=" + defaultTenant.getId());
            } else {
                defaultTenant = tenantRepository.findAll().get(0);
                System.out.println("🚀 [DATA_INIT] ✅ Using existing tenant: " + defaultTenant.getCompanyName());
            }
        } catch (Exception e) {
            System.err.println("❌ [DATA_INIT] CRITICAL ERROR during Tenant init: " + e.getMessage());
            e.printStackTrace();
            return;
        }

        // ── 2. USERS ───────────────────────────────────────────────────────────
        try {
            System.out.println("🚀 [DATA_INIT] Synchronizing administrative users...");
            User admin = userRepository.findByUsername("admin").orElse(new User());
            if (admin.getId() == null) {
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
            }
            admin.setRole("ADMIN");
            admin.setTenant(defaultTenant);
            userRepository.save(admin);

            User shrUser = userRepository.findByUsername("ShreeSamarth").orElse(new User());
            if (shrUser.getId() == null) {
                shrUser.setUsername("ShreeSamarth");
                shrUser.setPassword(passwordEncoder.encode("Aarti@2005"));
            }
            shrUser.setRole("ADMIN");
            shrUser.setTenant(defaultTenant);
            userRepository.save(shrUser);
            System.out.println("🚀 [DATA_INIT] ✅ Users synchronized.");
        } catch (Exception e) {
            System.err.println("❌ [DATA_INIT] ERROR during User init: " + e.getMessage());
        }

        // ── 3. VEHICLES ────────────────────────────────────────────────────────
        try {
            System.out.println("🚀 [DATA_INIT] Synchronizing fleet detail...");
            Vehicle v1 = vehicleRepository.findByVehicleNumber("MH09CU1605").orElse(new Vehicle());
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
            vehicleRepository.save(v1);

            Vehicle v2 = vehicleRepository.findByVehicleNumber("MH43Y2651").orElse(new Vehicle());
            v2.setVehicleNumber("MH43Y2651");
            v2.setModel("EICHER");
            v2.setManufacturer("VE Commercial Vehicles Ltd");
            v2.setRegistrationDate(LocalDate.parse("02-05-2014", dateFormatter));
            v2.setPurchaseDate(LocalDate.parse("02-05-2014", dateFormatter));
            v2.setChassisNumber("MC236GRC0EA001727");
            v2.setEngineNumber("3IK84132674");
            v2.setStatus("ACTIVE");
            v2.setTenant(defaultTenant);
            vehicleRepository.save(v2);
            System.out.println("🚀 [DATA_INIT] ✅ Fleet synchronized (MH09CU1605, MH43Y2651).");
        } catch (Exception e) {
            System.err.println("❌ [DATA_INIT] ERROR during Vehicle init: " + e.getMessage());
        }

        // ── 4. DRIVERS ─────────────────────────────────────────────────────────
        try {
            System.out.println("🚀 [DATA_INIT] Synchronizing driver team...");
            Vehicle v1 = vehicleRepository.findByVehicleNumber("MH09CU1605").orElse(null);
            Vehicle v2 = vehicleRepository.findByVehicleNumber("MH43Y2651").orElse(null);

            if (!driverRepository.existsByName("Janak Biswakarma")) {
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
            }

            if (!driverRepository.existsByName("Rabin")) {
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
            }
            System.out.println("🚀 [DATA_INIT] ✅ Driver team synchronized.");
        } catch (Exception e) {
            System.err.println("❌ [DATA_INIT] ERROR during Driver init: " + e.getMessage());
        }

        // ── 5. CLIENTS ─────────────────────────────────────────────────────────
        try {
            System.out.println("🚀 [DATA_INIT] Checking client registry...");
            if (clientRepository.count() == 0) {
                Client c1 = new Client();
                c1.setPartyName("PRISM JOHNSON LIMITED");
                c1.setGstNumber("27ASXPP6488L1ZD");
                c1.setAddress("Mumbai, Maharashtra");
                c1.setPhone("9876543210");
                c1.setEmail("prismjohnson@example.com");
                c1.setTenant(defaultTenant);
                clientRepository.save(c1);

                Client c2 = new Client();
                c2.setPartyName("ULTRA TECH CEMENT");
                c2.setGstNumber("27AABCT8719Q1ZO");
                c2.setAddress("Mumbai, Maharashtra");
                c2.setPhone("9876543211");
                c2.setEmail("ultratech@example.com");
                c2.setTenant(defaultTenant);
                clientRepository.save(c2);

                Client c3 = new Client();
                c3.setPartyName("AMBUJA CEMENTS");
                c3.setGstNumber("27AABCA7507Q1ZI");
                c3.setAddress("Mumbai, Maharashtra");
                c3.setPhone("9876543212");
                c3.setEmail("ambuja@example.com");
                c3.setTenant(defaultTenant);
                clientRepository.save(c3);
                System.out.println("🚀 [DATA_INIT] ✅ 3 professional clients created.");
            }
        } catch (Exception e) {
            System.err.println("❌ [DATA_INIT] ERROR during Client init: " + e.getMessage());
        }

        // ── 6. BILLS ───────────────────────────────────────────────────────────
        try {
            System.out.println("🚀 [DATA_INIT] Checking financial yield (bills)...");
            if (billRepository.count() == 0) {
                Vehicle v1 = vehicleRepository.findByVehicleNumber("MH09CU1605").orElse(null);
                Vehicle v2 = vehicleRepository.findByVehicleNumber("MH43Y2651").orElse(null);
                List<Client> clients = clientRepository.findAll();

                if (v1 != null && clients.size() > 0) {
                    Bill b1 = new Bill();
                    b1.setBillNo("BILL-2026-001");
                    b1.setClient(clients.get(0));
                    b1.setVehicle(v1);
                    b1.setBillDate(LocalDate.of(2026, 3, 15));
                    b1.setBasicAmount(new BigDecimal("25000"));
                    b1.setCgstAmount(new BigDecimal("2250"));
                    b1.setSgstAmount(new BigDecimal("2250"));
                    b1.setTotalAmount(new BigDecimal("29500"));
                    b1.setStatus("PENDING");
                    b1.setTenant(defaultTenant);
                    billRepository.save(b1);
                }

                if (v2 != null && clients.size() > 1) {
                    Bill b2 = new Bill();
                    b2.setBillNo("BILL-2026-002");
                    b2.setClient(clients.get(1));
                    b2.setVehicle(v2);
                    b2.setBillDate(LocalDate.of(2026, 3, 12));
                    b2.setBasicAmount(new BigDecimal("18500"));
                    b2.setCgstAmount(new BigDecimal("1665"));
                    b2.setSgstAmount(new BigDecimal("1665"));
                    b2.setTotalAmount(new BigDecimal("21830"));
                    b2.setStatus("PAID");
                    b2.setTenant(defaultTenant);
                    billRepository.save(b2);
                }

                if (v1 != null && clients.size() > 2) {
                    Bill b3 = new Bill();
                    b3.setBillNo("BILL-2026-003");
                    b3.setClient(clients.get(2));
                    b3.setVehicle(v1);
                    b3.setBillDate(LocalDate.of(2026, 3, 10));
                    b3.setBasicAmount(new BigDecimal("42000"));
                    b3.setCgstAmount(new BigDecimal("3780"));
                    b3.setSgstAmount(new BigDecimal("3780"));
                    b3.setTotalAmount(new BigDecimal("49560"));
                    b3.setStatus("PARTIAL");
                    b3.setTenant(defaultTenant);
                    billRepository.save(b3);
                }
                System.out.println("🚀 [DATA_INIT] ✅ professional bills synchronized.");
            }
            System.out.println("🚀 [DATA_INIT] ⭐ ⭐ ⭐ SYSTEM DATA INITIALIZATION COMPLETED ⭐ ⭐ ⭐");
        } catch (Exception e) {
            System.err.println("❌ [DATA_INIT] ERROR during Bill init: " + e.getMessage());
        }
    }
}
