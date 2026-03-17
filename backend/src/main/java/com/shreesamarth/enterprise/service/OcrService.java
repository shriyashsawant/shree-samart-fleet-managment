package com.shreesamarth.enterprise.service;

import com.shreesamarth.enterprise.dto.InvoiceExtractDTO;
import lombok.Data;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OcrService {

    private final RestTemplate restTemplate;
    private static final String OCR_API_URL = "https://api.ocr.space/parse/image";
    private static final String OCR_API_KEY = "helloworld"; // Free demo key

    public OcrService() {
        this.restTemplate = new RestTemplate();
    }

    public InvoiceExtractDTO extractFromImage(byte[] imageData, String filename) {
        // For now, we'll use a simple approach - call OCR.space API
        // In production, you'd want to handle this differently
        
        InvoiceExtractDTO dto = new InvoiceExtractDTO();
        
        // Return a placeholder - actual OCR would be done via the Python service
        // This allows the backend to work standalone
        dto.setBillNo(null);
        dto.setDate(null);
        dto.setPartyName(null);
        dto.setPartyGst(null);
        dto.setHsnCode("9973");
        dto.setBasicAmount(0.0);
        dto.setCgstAmount(0.0);
        dto.setSgstAmount(0.0);
        dto.setTotalAmount(0.0);
        dto.setBillType("Other");
        dto.setConfidence(0.0);
        
        return dto;
    }

    public InvoiceExtractDTO parseExtractedText(String rawText) {
        InvoiceExtractDTO dto = new InvoiceExtractDTO();
        dto.setRawText(rawText);
        
        // Extract Bill No
        String billNo = extractPattern(rawText, "(?i)bill\\s*no[:\\-\\.]?\\s*(\\d+)");
        if (billNo == null) {
            billNo = extractPattern(rawText, "(?i)invoice\\s*no[:\\-\\.]?\\s*(\\d+)");
        }
        dto.setBillNo(billNo);
        
        // Extract Date
        String date = extractPattern(rawText, "(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4})");
        dto.setDate(date);
        
        // Extract Party Name (known parties)
        String[] knownParties = {"PRISM JOHNSON", "ULTRA TECH", "AMBUJA", "ACC", "BIRLA"};
        String partyName = null;
        for (String party : knownParties) {
            if (rawText.toUpperCase().contains(party)) {
                partyName = party;
                break;
            }
        }
        dto.setPartyName(partyName);
        
        // Extract GST
        String gst = extractPattern(rawText, "\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}\\d[Z]{1}[A-Z\\d]{1}");
        dto.setPartyGst(gst);
        
        // Extract HSN
        String hsn = extractPattern(rawText, "(?i)hsn[:\\-\\.]?\\s*(\\d{4,8})");
        dto.setHsnCode(hsn);
        
        // Extract Amounts
        Double basicAmount = extractAmount(rawText, "(?i)basic\\s*amount[:\\-\\.]?\\s*[₹Rs]?\\s*([\\d,]+)");
        if (basicAmount == null) {
            basicAmount = extractAmount(rawText, "(?i)sub\\s*total[:\\-\\.]?\\s*[₹Rs]?\\s*([\\d,]+)");
        }
        dto.setBasicAmount(basicAmount);
        
        // CGST
        Double cgst = extractAmount(rawText, "(?i)cgst\\s*\\(?\\d*%?\\)?[:\\-\\.]?\\s*[₹Rs]?\\s*([\\d,]+)");
        dto.setCgstAmount(cgst);
        
        // SGST
        Double sgst = extractAmount(rawText, "(?i)sgst\\s*\\(?\\d*%?\\)?[:\\-\\.]?\\s*[₹Rs]?\\s*([\\d,]+)");
        dto.setSgstAmount(sgst);
        
        // Total
        Double total = extractAmount(rawText, "(?i)(?:grand\\s*)?total[:\\-\\.]?\\s*[₹Rs]?\\s*([\\d,]+)");
        dto.setTotalAmount(total);
        
        // Bill Type
        String textLower = rawText.toLowerCase();
        if (textLower.contains("diesel") || textLower.contains("fuel") || textLower.contains("oil")) {
            dto.setBillType("Diseal");
        } else if (textLower.contains("rent") || textLower.contains("rental") || textLower.contains("transit")) {
            dto.setBillType("Rent");
        } else if (textLower.contains("service")) {
            dto.setBillType("Service");
        } else if (textLower.contains("maintenance") || textLower.contains("repair")) {
            dto.setBillType("Main");
        } else {
            dto.setBillType("Other");
        }
        
        // Calculate confidence
        int fields = 0;
        if (dto.getBillNo() != null) fields++;
        if (dto.getDate() != null) fields++;
        if (dto.getPartyName() != null || dto.getPartyGst() != null) fields++;
        if (dto.getBasicAmount() != null) fields++;
        if (dto.getTotalAmount() != null) fields++;
        dto.setConfidence(fields / 5.0);
        
        return dto;
    }

    private String extractPattern(String text, String regex) {
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private Double extractAmount(String text, String regex) {
        String amount = extractPattern(text, regex);
        if (amount != null) {
            try {
                return Double.parseDouble(amount.replace(",", ""));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
