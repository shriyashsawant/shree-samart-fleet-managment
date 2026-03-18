import sys
sys.path.insert(0, r'c:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\ocr_service')

# Read the function directly from the file
import re
import os

# Copy the parsing logic from app.py for testing
def extract_invoice_data(text):
    result = {
        'bill_no': None,
        'date': None,
        'party_name': None,
        'party_gst': None,
        'party_pan': None,
        'basic_amount': None,
        'cgst_amount': None,
        'sgst_amount': None,
        'igst_amount': None,
        'total_amount': None,
        'hsn_code': None,
        'bill_type': None,
        'company_name': None,
        'company_gst': None,
        'company_mobile': None,
        'company_address': None,
        'bank_name': None,
        'bank_account_no': None,
        'bank_ifsc': None,
    }
    
    lines = text.split('\n')
    
    # ... (rest of the parsing logic)

# The raw OCR text from the image
raw_text = """SHRI SAMARTH ENTERPRISES
Rajopadhya Nagar,LastBus Stop,Plot no 24 , Haripriva Nagar , Kolhapur , Karvir Maharashtra
pone 416012.
GST NO 27ASXPPP6488LlZO
Mobile NO 8624077666
TAX INVOICE
3/1 No-02
PRSM JOHNSON LIMITED 7'" E Mumbai Maharashtra India. 400098
GST NO - 27ASXPP6488LIZD
PAN NO - AAACP6224A
S.no Particu lars
Charges For
Fixed Taansit Mixer Rental Charges
For The Month Of
PRISM JOHNSON LIMITED. T",
Windsor . Windsor ,CTS Road
Mumbai.
Note 60 Days 30 = 1.47 Average
Bank Details
Shri samaratha ENTERPRISES
Kotak Bank 7945113154
IFSC code KKBK0000692
HSC/SAC
9973
Qty.
Date
W.ONO
Date
Rate
Seb Tczi
CGS3
SGSi
Grand Total
21/06/2024
Amount
95000
95,000/-
8,550.00
8,550.00
Amount Payable: - One Lakh Twelve Thousand one Hundred Rupees Only .
Terms And Conditions
please pay by A/C payee Cheque.
Received Signature with stamp
Date
Name
Samarth Enterprises
Authorized Signatory"""

print("Testing OCR parsing with raw text...")
print("=" * 50)
result = extract_invoice_data(raw_text)
print("\n=== EXTRACTED DATA ===")
for key, value in result.items():
    if value:
        print(f"{key}: {value}")
print("=" * 50)
