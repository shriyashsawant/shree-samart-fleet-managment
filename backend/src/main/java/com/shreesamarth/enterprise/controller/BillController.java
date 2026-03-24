package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Bill;
import com.shreesamarth.enterprise.entity.Client;
import com.shreesamarth.enterprise.entity.Tenant;
import com.shreesamarth.enterprise.entity.User;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.BillRepository;
import com.shreesamarth.enterprise.repository.ClientRepository;
import com.shreesamarth.enterprise.repository.UserRepository;
import com.shreesamarth.enterprise.repository.VehicleRepository;
import com.shreesamarth.enterprise.dto.BillDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillRepository billRepository;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final com.shreesamarth.enterprise.service.FileUploadService fileUploadService;
    private final com.shreesamarth.enterprise.service.OcrService ocrService;

    private Tenant getCurrentTenant(Authentication auth) {
        if (auth == null) return null;
        String username = auth.getName();
        User user = userRepository.findByUsernameWithTenant(username).orElse(null);
        if (user == null) return null;
        return user.getTenant();
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<BillDTO>> getAllBills(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Authentication auth) {

        Tenant tenant = getCurrentTenant(auth);
        List<Bill> allTenant = tenant != null
            ? billRepository.findByTenantId(tenant.getId())
            : billRepository.findAll();

        List<Bill> bills;
        if (clientId != null) {
            bills = allTenant.stream().filter(b -> b.getClient() != null && b.getClient().getId().equals(clientId)).collect(Collectors.toList());
        } else if (vehicleId != null) {
            bills = allTenant.stream().filter(b -> b.getVehicle() != null && b.getVehicle().getId().equals(vehicleId)).collect(Collectors.toList());
        } else if (startDate != null && endDate != null) {
            bills = allTenant.stream()
                .filter(b -> b.getBillDate() != null && !b.getBillDate().isBefore(startDate) && !b.getBillDate().isAfter(endDate))
                .collect(Collectors.toList());
        } else {
            bills = allTenant;
        }
        
        List<BillDTO> billDTOs = bills.stream()
            .map(b -> new BillDTO(
                b.getId(),
                b.getBillNo(),
                b.getBillDate(),
                b.getClient() != null ? b.getClient().getId() : null,
                b.getClient() != null ? b.getClient().getPartyName() : null,
                b.getClient() != null ? b.getClient().getGstNumber() : null,
                b.getVehicle() != null ? b.getVehicle().getId() : null,
                b.getVehicle() != null ? b.getVehicle().getVehicleNumber() : null,
                b.getHsnCode(),
                b.getBasicAmount(),
                b.getCgstAmount(),
                b.getSgstAmount(),
                b.getPfAmount(),
                b.getTotalAmount(),
                b.getBillType(),
                b.getStatus(),
                b.getCompanyName(),
                b.getCompanyGst(),
                b.getCompanyMobile(),
                b.getPartyName(),
                b.getPartyGst(),
                b.getPartyPan(),
                b.getIgstAmount(),
                b.getBankName(),
                b.getBankAccountNo(),
                b.getBankIfsc(),
                b.getMathValid(),
                b.getCreatedAt()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(billDTOs);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Bill> getBillById(@PathVariable Long id) {
        return billRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createBill(@RequestBody Bill bill, Authentication auth) {
        Tenant tenant = getCurrentTenant(auth);
        if (tenant != null) bill.setTenant(tenant);

        if (bill.getClient() != null && bill.getClient().getId() != null) {
            Client client = clientRepository.findById(bill.getClient().getId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            bill.setClient(client);

            if (bill.getBasicAmount() != null && bill.getBillDate() != null) {
                int year = bill.getBillDate().getYear();
                int month = bill.getBillDate().getMonthValue();
                List<Bill> duplicates = billRepository.findPotentialDuplicates(
                        client.getId(), bill.getBasicAmount(), year, month);
                if (!duplicates.isEmpty()) {
                    Bill saved = billRepository.save(bill);
                    return ResponseEntity.ok().body(java.util.Map.of(
                            "bill", saved,
                            "warning", "Potential duplicate bill found for same client, amount, and month"
                    ));
                }
            }
        }

        if (bill.getVehicle() != null && bill.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(bill.getVehicle().getId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            bill.setVehicle(vehicle);
        }

        if (bill.getBillNo() == null || bill.getBillNo().isEmpty()) {
            int year = LocalDate.now().getYear();
            String prefix = year + "-";
            long count = billRepository.countByBillNoStartingWith(prefix);
            int nextNum = (int)count + 1;
            bill.setBillNo(prefix + String.format("%03d", nextNum));
        }

        if (bill.getClient() != null && bill.getBillNo() != null) {
            Optional<Bill> existingBill = billRepository.findByBillNoAndClientId(
                    bill.getBillNo(), bill.getClient().getId());
            if (existingBill.isPresent()) {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                        "error", "Bill with this number already exists for this client"
                ));
            }
        }

        if (bill.getBasicAmount() != null && bill.getGstPercentage() != null) {
            BigDecimal gstHalf = bill.getGstPercentage().divide(BigDecimal.valueOf(2));
            bill.setCgstAmount(bill.getBasicAmount().multiply(gstHalf).divide(BigDecimal.valueOf(100)));
            bill.setSgstAmount(bill.getBasicAmount().multiply(gstHalf).divide(BigDecimal.valueOf(100)));

            BigDecimal total = bill.getBasicAmount()
                    .add(bill.getCgstAmount())
                    .add(bill.getSgstAmount());

            if (bill.getPfAmount() != null) {
                total = total.add(bill.getPfAmount());
            }
            bill.setTotalAmount(total);
        }

        return ResponseEntity.ok(billRepository.save(bill));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Bill> updateBill(@PathVariable Long id, @RequestBody Bill bill) {
        return billRepository.findById(id)
                .map(existing -> {
                    bill.setId(id);
                    bill.setCreatedAt(existing.getCreatedAt());
                    bill.setTenant(existing.getTenant());

                    if (bill.getBasicAmount() != null && bill.getGstPercentage() != null) {
                        BigDecimal gstHalf = bill.getGstPercentage().divide(BigDecimal.valueOf(2));
                        bill.setCgstAmount(bill.getBasicAmount().multiply(gstHalf).divide(BigDecimal.valueOf(100)));
                        bill.setSgstAmount(bill.getBasicAmount().multiply(gstHalf).divide(BigDecimal.valueOf(100)));

                        BigDecimal total = bill.getBasicAmount()
                                .add(bill.getCgstAmount())
                                .add(bill.getSgstAmount());

                        if (bill.getPfAmount() != null) {
                            total = total.add(bill.getPfAmount());
                        }
                        bill.setTotalAmount(total);
                    }

                    return ResponseEntity.ok(billRepository.save(bill));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/extract-ocr")
    @Transactional
    public ResponseEntity<Map<String, Object>> extractOcr(
            @RequestParam("file") MultipartFile file,
            Authentication auth) throws java.io.IOException {
        
        Tenant tenant = getCurrentTenant(auth);
        String fileUrl = fileUploadService.uploadFile(file, "bills");
        
        Map<String, Object> ocrData = new HashMap<>();
        boolean ocrSuccess = false;
        try {
            ocrData = ocrService.extractDocument(file);
            ocrSuccess = (ocrData != null && !ocrData.isEmpty());
        } catch (Exception e) {
            // Error logged in OcrService
        }
        
        Bill bill = new Bill();
        if (tenant != null) bill.setTenant(tenant);
        bill.setNotes(fileUrl); // Save URL in notes for reference or if we add a dedicated column later
        bill.setStatus("PENDING");
        
        if (ocrSuccess) {
            applyOcrToBill(bill, ocrData);
        }
        
        Bill saved = billRepository.save(bill);
        
        Map<String, Object> response = new HashMap<>();
        response.put("bill", saved);
        response.put("ocrData", ocrData);
        response.put("ocrSuccess", ocrSuccess);
        
        return ResponseEntity.ok(response);
    }
    
    private void applyOcrToBill(Bill bill, Map<String, Object> data) {
        if (data.get("bill_no") != null) bill.setBillNo(data.get("bill_no").toString());
        if (data.get("date") != null) bill.setBillDate(parseOcrDate(data.get("date")));
        if (data.get("hsn_code") != null) bill.setHsnCode(data.get("hsn_code").toString());
        if (data.get("basic_amount") != null) bill.setBasicAmount(toBD(data.get("basic_amount")));
        if (data.get("cgst_amount") != null) bill.setCgstAmount(toBD(data.get("cgst_amount")));
        if (data.get("sgst_amount") != null) bill.setSgstAmount(toBD(data.get("sgst_amount")));
        if (data.get("igst_amount") != null) bill.setIgstAmount(toBD(data.get("igst_amount")));
        if (data.get("total_amount") != null) bill.setTotalAmount(toBD(data.get("total_amount")));
        
        bill.setCompanyName((String)data.get("company_name"));
        bill.setCompanyGst((String)data.get("company_gst"));
        bill.setCompanyMobile((String)data.get("company_mobile"));
        bill.setPartyName((String)data.get("party_name"));
        bill.setPartyGst((String)data.get("party_gst"));
        bill.setPartyPan((String)data.get("party_pan"));
        bill.setBankName((String)data.get("bank_name"));
        bill.setBankAccountNo((String)data.get("bank_account_no"));
        bill.setBankIfsc((String)data.get("bank_ifsc"));
        bill.setMathValid((Boolean)data.get("math_valid"));
        bill.setBillType((String)data.get("bill_type"));
    }
    
    private BigDecimal toBD(Object obj) {
        if (obj == null) return null;
        try {
            return new BigDecimal(obj.toString().replace(",", "").replace("₹", "").trim());
        } catch (Exception e) {
            return null;
        }
    }
    
    private LocalDate parseOcrDate(Object dateValue) {
        if (dateValue == null) return null;
        try {
            if (dateValue instanceof String) {
                String dateStr = (String) dateValue;
                if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) return LocalDate.parse(dateStr);
                if (dateStr.matches("\\d{2}[-/]\\d{2}[-/]\\d{4}")) {
                    String[] parts = dateStr.split("[-/]");
                    // Assuming DD/MM/YYYY for Indian locale
                    return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[1]), Integer.parseInt(parts[0]));
                }
            }
        } catch (Exception e) {}
        return null;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBill(@PathVariable Long id) {
        if (billRepository.existsById(id)) {
            billRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/reports/gst-monthly")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportGstMonthly(
            @RequestParam String month,
            Authentication auth) {

        Tenant tenant = getCurrentTenant(auth);
        List<Bill> allTenant = tenant != null
            ? billRepository.findByTenantId(tenant.getId())
            : billRepository.findAll();

        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();

        List<Bill> bills = allTenant.stream()
                .filter(b -> b.getBillDate() != null)
                .filter(b -> !b.getBillDate().isBefore(monthStart) && !b.getBillDate().isAfter(monthEnd))
                .collect(Collectors.toList());
        
        // Group by party (client) and HSN
        Map<String, GstSummaryData> summaryMap = new LinkedHashMap<>();
        
        for (Bill bill : bills) {
            String partyName = bill.getClient() != null ? bill.getClient().getPartyName() : "Unknown";
            String gstNumber = bill.getClient() != null ? bill.getClient().getGstNumber() : "";
            String hsnCode = bill.getHsnCode() != null ? bill.getHsnCode() : "N/A";
            String key = partyName + "|" + hsnCode;
            
            GstSummaryData entry = summaryMap.computeIfAbsent(key, k -> new GstSummaryData(partyName, gstNumber, hsnCode));
            
            entry.basicAmount = entry.basicAmount.add(bill.getBasicAmount() != null ? bill.getBasicAmount() : BigDecimal.ZERO);
            entry.cgstAmount = entry.cgstAmount.add(bill.getCgstAmount() != null ? bill.getCgstAmount() : BigDecimal.ZERO);
            entry.sgstAmount = entry.sgstAmount.add(bill.getSgstAmount() != null ? bill.getSgstAmount() : BigDecimal.ZERO);
            entry.totalAmount = entry.totalAmount.add(bill.getTotalAmount() != null ? bill.getTotalAmount() : BigDecimal.ZERO);
        }
        
        // Generate CSV
        StringBuilder csv = new StringBuilder();
        csv.append("Party Name,GST Number,HSN Code,Basic Amount,CGST,SGST,Total\n");
        
        BigDecimal totalBasic = BigDecimal.ZERO;
        BigDecimal totalCgst = BigDecimal.ZERO;
        BigDecimal totalSgst = BigDecimal.ZERO;
        BigDecimal totalTotal = BigDecimal.ZERO;
        
        for (GstSummaryData entry : summaryMap.values()) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",%.2f,%.2f,%.2f,%.2f\n",
                    entry.partyName, entry.gstNumber, entry.hsnCode,
                    entry.basicAmount, entry.cgstAmount, entry.sgstAmount, entry.totalAmount));
            
            totalBasic = totalBasic.add(entry.basicAmount);
            totalCgst = totalCgst.add(entry.cgstAmount);
            totalSgst = totalSgst.add(entry.sgstAmount);
            totalTotal = totalTotal.add(entry.totalAmount);
        }
        
        // Add totals row
        csv.append(String.format("\"TOTAL\",\"\",\"\",%.2f,%.2f,%.2f,%.2f\n",
                totalBasic, totalCgst, totalSgst, totalTotal));
        
        // Generate filename
        String filename = "GST_Summary_" + month + "_" + System.currentTimeMillis() + ".csv";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", filename);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(csv.toString().getBytes());
    }

    // Simple data class for GST summary
    static class GstSummaryData {
        String partyName;
        String gstNumber;
        String hsnCode;
        BigDecimal basicAmount;
        BigDecimal cgstAmount;
        BigDecimal sgstAmount;
        BigDecimal totalAmount;
        
        GstSummaryData(String partyName, String gstNumber, String hsnCode) {
            this.partyName = partyName;
            this.gstNumber = gstNumber;
            this.hsnCode = hsnCode;
            this.basicAmount = BigDecimal.ZERO;
            this.cgstAmount = BigDecimal.ZERO;
            this.sgstAmount = BigDecimal.ZERO;
            this.totalAmount = BigDecimal.ZERO;
        }
    }
}
