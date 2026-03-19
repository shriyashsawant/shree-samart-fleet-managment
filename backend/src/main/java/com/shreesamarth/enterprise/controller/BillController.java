package com.shreesamarth.enterprise.controller;

import com.shreesamarth.enterprise.entity.Bill;
import com.shreesamarth.enterprise.entity.Client;
import com.shreesamarth.enterprise.entity.Vehicle;
import com.shreesamarth.enterprise.repository.BillRepository;
import com.shreesamarth.enterprise.repository.ClientRepository;
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

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillRepository billRepository;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<BillDTO>> getAllBills(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        
        List<Bill> bills;
        if (clientId != null) {
            bills = billRepository.findByClientId(clientId);
        } else if (vehicleId != null) {
            bills = billRepository.findByVehicleId(vehicleId);
        } else if (startDate != null && endDate != null) {
            bills = billRepository.findByBillDateBetween(startDate, endDate);
        } else {
            bills = billRepository.findAll();
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
                b.getCreatedAt()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(billDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bill> getBillById(@PathVariable Long id) {
        return billRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createBill(@RequestBody Bill bill) {
        // Set client if provided
        if (bill.getClient() != null && bill.getClient().getId() != null) {
            Client client = clientRepository.findById(bill.getClient().getId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            bill.setClient(client);
            
            // Check for potential duplicates
            if (bill.getBasicAmount() != null && bill.getBillDate() != null) {
                int year = bill.getBillDate().getYear();
                int month = bill.getBillDate().getMonthValue();
                List<Bill> duplicates = billRepository.findPotentialDuplicates(
                        client.getId(), bill.getBasicAmount(), year, month);
                if (!duplicates.isEmpty()) {
                    // Return warning but allow saving
                    Bill saved = billRepository.save(bill);
                    return ResponseEntity.ok().body(java.util.Map.of(
                            "bill", saved,
                            "warning", "Potential duplicate bill found for same client, amount, and month"
                    ));
                }
            }
        }
        
        // Set vehicle if provided
        if (bill.getVehicle() != null && bill.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(bill.getVehicle().getId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            bill.setVehicle(vehicle);
        }
        
        // Auto-generate bill number
        if (bill.getBillNo() == null || bill.getBillNo().isEmpty()) {
            String lastBillNo = billRepository.findTopByOrderByBillNoDesc()
                    .map(Bill::getBillNo)
                    .orElse("0");
            try {
                int nextNum = Integer.parseInt(lastBillNo) + 1;
                bill.setBillNo(String.valueOf(nextNum));
            } catch (NumberFormatException e) {
                bill.setBillNo("1");
            }
        }
        
        // Check for exact duplicate bill number for same client
        if (bill.getClient() != null && bill.getBillNo() != null) {
            Optional<Bill> existingBill = billRepository.findByBillNoAndClientId(
                    bill.getBillNo(), bill.getClient().getId());
            if (existingBill.isPresent()) {
                return ResponseEntity.badRequest().body(java.util.Map.of(
                        "error", "Bill with this number already exists for this client"
                ));
            }
        }
        
        // Auto-calculate GST
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
    public ResponseEntity<Bill> updateBill(@PathVariable Long id, @RequestBody Bill bill) {
        return billRepository.findById(id)
                .map(existing -> {
                    bill.setId(id);
                    bill.setCreatedAt(existing.getCreatedAt());
                    
                    // Recalculate GST
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBill(@PathVariable Long id) {
        if (billRepository.existsById(id)) {
            billRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // GST Monthly Export - CSV format grouped by party and HSN
    @GetMapping("/reports/gst-monthly")
    public ResponseEntity<byte[]> exportGstMonthly(
            @RequestParam String month) { // Format: 2025-03
        
        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();
        
        // Get bills for the month
        List<Bill> bills = billRepository.findAll().stream()
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
