package com.shreesamarth.enterprise.dto;

import lombok.Data;

@Data
public class InvoiceExtractDTO {
    private String billNo;
    private String date;
    private String partyName;
    private String partyGst;
    private String hsnCode;
    private Double basicAmount;
    private Double cgstAmount;
    private Double sgstAmount;
    private Double totalAmount;
    private String billType;
    private String month;
    private String year;
    private Double confidence;
    private String rawText;
}
