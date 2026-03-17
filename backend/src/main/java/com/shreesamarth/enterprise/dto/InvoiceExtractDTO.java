package com.shreesamarth.enterprise.dto;

import lombok.Data;

@Data
public class InvoiceExtractDTO {
    private String billNo;
    private String date;
    private String companyName;
    private String companyGst;
    private String companyMobile;
    private String companyAddress;
    private String invoiceType;
    private String partyName;
    private String partyGst;
    private String partyPan;
    private String partyAddress;
    private String serviceDescription;
    private String hsnCode;
    private Double basicAmount;
    private Double cgstAmount;
    private Double sgstAmount;
    private Double totalAmount;
    private String billType;
    private String month;
    private String year;
    private String bankName;
    private String bankAccountNo;
    private String bankIfsc;
    private Double confidence;
    private String rawText;
}
