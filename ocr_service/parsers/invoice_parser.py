"""
Invoice Parser with Keyword Anchors
More accurate extraction by scanning near specific keywords
"""

import re
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.regex_patterns import INVOICE_PATTERNS


def extract_with_anchor(text, field, context_chars=80):
    """Extract field value by finding keyword anchor first, then looking near it"""
    patterns = INVOICE_PATTERNS.get(field, [])
    
    for pattern in patterns:
        # Try DOTALL pattern (keyword + nearby amount)
        # Example: "Grand Total" followed by any chars then number
        dotall_pattern = pattern.replace('(', '(.*').replace(')', ')')
        match = re.search(dotall_pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            # Extract the number from the matched group
            matched = match.group(1) if match.groups() else match.group(0)
            # Find numbers in the matched text
            numbers = re.findall(r'[\d,]+\.?\d*', matched)
            if numbers:
                return numbers[-1]  # Last number is usually the amount
        
        # Try full text first
        match = re.search(pattern, text, re.IGNORECASE)
        if match and match.groups():
            return match.group(1).strip()
        
        # Try finding keyword anchors - scan line by line
        if field in ['basic_amount', 'cgst_amount', 'sgst_amount', 'total_amount', 'igst_amount']:
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if any(kw in line.lower() for kw in get_keywords(field)):
                    # Check this line and next few lines for amount
                    for j in range(i, min(i+3, len(lines))):
                        line_text = lines[j]
                        match = re.search(pattern, line_text, re.IGNORECASE)
                        if match and match.groups():
                            return match.group(1).strip()
    
    return None


def get_keywords(field):
    """Get keywords associated with each field"""
    keywords = {
        'basic_amount': ['basic', 'sub total', 'subtotal', 'amount', 'net amount'],
        'cgst_amount': ['cgst', 'cgs3', 'cgst @', 'central gst'],
        'sgst_amount': ['sgst', 'sgs1', 'sgst @', 'state gst'],
        'igst_amount': ['igst', 'igst @', 'integrated gst'],
        'total_amount': ['grand total', 'total', 'net amount', 'payable', 'amount payable', 'rs.'],
    }
    return keywords.get(field, [])


def parse_invoice(text):
    """Parse invoice using keyword anchors for better accuracy"""
    lines = text.split('\n')
    lines = [L.strip() for L in lines if L.strip()]
    
    result = {
        'bill_no': None, 'date': None,
        'company_name': None, 'company_gst': None, 'company_mobile': None,
        'party_name': None, 'party_gst': None, 'party_pan': None,
        'basic_amount': None, 'cgst_amount': None, 'sgst_amount': None,
        'igst_amount': None, 'total_amount': None,
        'hsn_code': None, 'bill_type': None,
        'bank_name': None, 'bank_account_no': None, 'bank_ifsc': None,
    }
    
    # Bill No
    result['bill_no'] = extract_with_anchor(text, 'bill_no')
    
    # Date
    result['date'] = extract_with_anchor(text, 'date')
    
    # Basic Amount
    basic = extract_with_anchor(text, 'basic_amount')
    if basic:
        result['basic_amount'] = float(basic.replace(',', ''))
    
    # CGST Amount
    cgst = extract_with_anchor(text, 'cgst_amount')
    if cgst:
        result['cgst_amount'] = float(cgst.replace(',', ''))
    
    # SGST Amount
    sgst = extract_with_anchor(text, 'sgst_amount')
    if sgst:
        result['sgst_amount'] = float(sgst.replace(',', ''))
    
    # Total Amount
    total = extract_with_anchor(text, 'total_amount')
    if total:
        result['total_amount'] = float(total.replace(',', ''))
    
    # Calculate total if we have basic + tax but no total
    if result.get('basic_amount') and result.get('cgst_amount') and not result.get('total_amount'):
        result['total_amount'] = result['basic_amount'] + result.get('cgst_amount', 0) + result.get('sgst_amount', 0)
    
    # HSN Code
    result['hsn_code'] = extract_with_anchor(text, 'hsn_code')
    
    # Bank Account
    account = extract_with_anchor(text, 'bank_account')
    if account:
        result['bank_account_no'] = account
    
    # IFSC
    ifsc = extract_with_anchor(text, 'ifsc_code')
    if ifsc:
        result['bank_ifsc'] = ifsc.upper()
    
    # Extract GST numbers with normalization
    gst_list = re.findall(r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1})', 
                         normalize_gst(text))
    if gst_list:
        result['company_gst'] = gst_list[0]
        if len(gst_list) > 1:
            result['party_gst'] = gst_list[1]
    
    # PAN
    pan_match = re.search(r'([A-Z]{5}[0-9]{4}[A-Z]{1})', text.upper())
    if pan_match:
        result['party_pan'] = pan_match.group(1)
    
    # Mobile
    mobile_match = re.search(r'(?:Mob|Mobile|Phone)[:\-\s]*([6-9]\d{9})', text, re.IGNORECASE)
    if mobile_match:
        result['company_mobile'] = mobile_match.group(1)
    
    # Company Name (first line)
    if lines:
        result['company_name'] = lines[0].strip()
    
    # Party Name - look near "TO" or "BILL TO"
    party_keywords = ['TO,', 'TO :', 'M/S', 'BILL TO', 'PARTY NAME', 'CONSIGNEE', 'CLIENT', 'BUYER']
    for i, line in enumerate(lines):
        line_up = line.upper()
        if any(k in line_up for k in party_keywords):
            for j in range(i+1, min(i+4, len(lines))):
                next_line = lines[j].strip()
                if next_line and len(next_line) > 2:
                    if not any(x in next_line.upper() for x in ['GST', 'PAN', 'MOBILE', 'ADDRESS']):
                        result['party_name'] = next_line
                        break
            break
    
    # Bill Type
    if any(k in text.upper() for k in ['RENTAL', 'RENT', 'CHARGES']):
        result['bill_type'] = 'Rent'
    
    # Bank Name
    if 'KOTAK' in text.upper():
        result['bank_name'] = 'Kotak Bank'
    elif 'HDFC' in text.upper():
        result['bank_name'] = 'HDFC Bank'
    elif 'ICICI' in text.upper():
        result['bank_name'] = 'ICICI Bank'
    
    return result


def normalize_gst(text):
    """Fix common OCR errors in GST"""
    return re.sub(
        r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z])([A-Z]{1}[0-9]{1}[A-Z])',
        lambda m: m.group(1).replace('I', '1').replace('l', '1') + 
                   m.group(2).replace('I', '1').replace('l', '1').replace('0', 'O'),
        text.upper()
    )
