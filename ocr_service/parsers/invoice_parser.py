"""
Invoice Parser with Keyword Anchors
More accurate extraction by scanning near specific keywords
Handles various bill formats including GST bills
"""

import re
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.regex_patterns import INVOICE_PATTERNS


def clean_amount(amt_str):
    """Clean amount string - handle Indian format like 1,12,100 and various notations"""
    # First, try to extract the full number with commas
    # Handle patterns like "1,12,100", "195,000", "8,550.00", "12100"
    # Remove all non-digit characters except . and ,
    clean = amt_str.strip()
    
    # If it has commas, check if it's Indian format (1,12,100) or standard (195,000)
    if ',' in clean:
        # Remove commas
        clean = clean.replace(',', '')
    else:
        # Still remove other characters
        clean = clean.replace("'", '').replace('-', '').replace('+', '').replace('/', '').strip()
    
    if not clean:
        return None
    try:
        return float(clean)
    except:
        return None


def extract_full_amount(line):
    """Extract full amount from a line - handles various formats"""
    # First try to find patterns like "1,12,100" or "195,000"
    # Look for the entire number pattern
    patterns = [
        r'(\d{1,2},\d{1,3},\d{3})',  # Indian: 1,12,100 or 1,95,000
        r'(\d{3},\d{3})',  # Standard: 195,000
        r'(\d+\.?\d*)',  # Simple: 195000 or 195000.00
    ]
    
    for pattern in patterns:
        match = re.search(pattern, line)
        if match:
            return clean_amount(match.group(1))
    return None


def scan_all_amounts_by_position(text):
    """
    Scan amounts in order: subtotal -> cgst -> sgst -> grandtotal
    Uses keyword positions to determine correct amounts
    """
    lines = text.split('\n')
    results = {
        'basic_amount': None,
        'cgst_amount': None, 
        'sgst_amount': None,
        'total_amount': None
    }
    
    # Track all amounts found with line numbers - use better extraction
    all_amounts = []
    for i, line in enumerate(lines):
        val = extract_full_amount(line)
        if val and val > 100:
            all_amounts.append({'line': i, 'value': val, 'text': line[:50]})
    
    # Find keyword line positions
    keyword_positions = {}
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if 'subtotal' in line_lower:
            keyword_positions['basic'] = i
        elif 'cgst' in line_lower:
            keyword_positions['cgst'] = i
        elif 'sgst' in line_lower:
            keyword_positions['sgst'] = i
        elif 'grand total' in line_lower or 'grandtotal' in line_lower:
            keyword_positions['total'] = i
    
    # For basic: look for largest amount near subtotal keyword
    if 'basic' in keyword_positions:
        basic_line = keyword_positions['basic']
        candidates = [a for a in all_amounts if basic_line < a['line'] <= basic_line + 5]
        if candidates:
            results['basic_amount'] = max(candidates, key=lambda x: x['value'])['value']
    
    # For CGST: look for amount after CGST keyword (~9% of basic)
    if 'cgst' in keyword_positions and results.get('basic_amount'):
        cgst_line = keyword_positions['cgst']
        expected = results['basic_amount'] * 0.09
        candidates = [a for a in all_amounts if cgst_line < a['line'] <= cgst_line + 4]
        for c in candidates:
            if 0.5 * expected <= c['value'] <= 1.5 * expected:
                results['cgst_amount'] = c['value']
                break
    
    # For SGST: look for amount after SGST keyword (~9% of basic)
    if 'sgst' in keyword_positions and results.get('basic_amount'):
        sgst_line = keyword_positions['sgst']
        expected = results['basic_amount'] * 0.09
        candidates = [a for a in all_amounts if sgst_line < a['line'] <= sgst_line + 4]
        for c in candidates:
            if 0.5 * expected <= c['value'] <= 1.5 * expected:
                results['sgst_amount'] = c['value']
                break
    
    # For Total: look for largest amount near Grand Total keyword
    if 'total' in keyword_positions:
        total_line = keyword_positions['total']
        candidates = [a for a in all_amounts if total_line < a['line'] <= total_line + 5]
        if candidates:
            results['total_amount'] = max(candidates, key=lambda x: x['value'])['value']
    
    return results


def extract_with_anchor(text, field, context_chars=80):
    """Extract field value by finding keyword anchor first, then looking near it"""
    patterns = INVOICE_PATTERNS.get(field, [])
    
    for pattern in patterns:
        dotall_pattern = pattern.replace('(', '(.*').replace(')', ')')
        match = re.search(dotall_pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            matched = match.group(1) if match.groups() else match.group(0)
            numbers = re.findall(r'[\d,]+\.?\d*', matched)
            if numbers:
                return numbers[-1]
        
        match = re.search(pattern, text, re.IGNORECASE)
        if match and match.groups():
            return match.group(1).strip()
    
    return None


def get_keywords(field):
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
    lines = [l.strip() for l in lines if l.strip()]
    
    result = {
        'bill_no': None, 'date': None,
        'company_name': None, 'company_gst': None, 'company_mobile': None,
        'party_name': None, 'party_gst': None, 'party_pan': None,
        'basic_amount': None, 'cgst_amount': None, 'sgst_amount': None,
        'igst_amount': None, 'total_amount': None,
        'hsn_code': None, 'bill_type': None,
        'bank_name': None, 'bank_account_no': None, 'bank_ifsc': None,
    }
    
    # Use position-based scanning for amounts
    amount_results = scan_all_amounts_by_position(text)
    result['basic_amount'] = amount_results.get('basic_amount')
    result['cgst_amount'] = amount_results.get('cgst_amount')
    result['sgst_amount'] = amount_results.get('sgst_amount')
    result['total_amount'] = amount_results.get('total_amount')
    
    # Bill No
    bill_match = re.search(r'(?:Bill\.?\s*No\.?|Invoice\s*No)[\s:\.]*(\d+[/\\A-Za-z\-]+)', text, re.IGNORECASE)
    if bill_match:
        result['bill_no'] = bill_match.group(1).strip()
    else:
        result['bill_no'] = extract_with_anchor(text, 'bill_no')
    
    # Date
    for line in lines:
        month_match = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[- ]*(\d{4})', line, re.IGNORECASE)
        if month_match:
            result['date'] = f"{month_match.group(1).title()}-{month_match.group(2)}"
            break
    
    if not result['date']:
        date_match = re.search(r'(?:Date|Month)[:\s]*([A-Za-z]+\s*[-/]?\s*\d{4})', text, re.IGNORECASE)
        if date_match:
            result['date'] = date_match.group(1).strip().replace(' ', '-')
    
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
    
    # Extract GST numbers
    gst_list = re.findall(r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1})', 
                         normalize_gst(text))
    if gst_list:
        result['company_gst'] = gst_list[0]
        if len(gst_list) > 1:
            result['party_gst'] = gst_list[1]
    
    # PAN
    pan_match = re.search(r'(?:PAN|PAN\s*NO)[:\-\s]*([A-Z]{5}[0-9]{4}[A-Z]{1})', text, re.IGNORECASE)
    if pan_match:
        result['party_pan'] = pan_match.group(1)
    else:
        pan_match = re.search(r'([A-Z]{5}[0-9]{4}[A-Z]{1})', text.upper())
        if pan_match:
            result['party_pan'] = pan_match.group(1)
    
    # Mobile
    mobile_match = re.search(r'(?:Mob|Mobile|Phone)[:\-\s]*([6-9]\d{9})', text, re.IGNORECASE)
    if mobile_match:
        result['company_mobile'] = mobile_match.group(1)
    
    # Company Name
    company_keywords = ['SHRI', 'SAMARTH', 'ENTERPRISES', 'COMPANY']
    for line in lines[:5]:
        if any(k in line.upper() for k in company_keywords):
            if len(line) > 5:
                result['company_name'] = line.strip()
                break
    
    if not result.get('company_name') and lines:
        result['company_name'] = lines[0].strip()
    
    # Party Name
    party_keywords = ['TO,', 'TO :', 'M/S', 'BILL TO', 'PARTY NAME', 'CONSIGNEE', 'CLIENT', 'BUYER', 'PRISM', 'JOHNSON']
    for i, line in enumerate(lines):
        line_up = line.upper()
        if any(k in line_up for k in party_keywords):
            if len(line) > 3 and 'GST' not in line.upper() and 'PAN' not in line.upper():
                result['party_name'] = line.strip()
                break
    
    # Bill Type
    if any(k in text.upper() for k in ['RENTAL', 'RENT', 'CHARGES', 'DIESEL', 'DIESEL', 'TRANSIT', 'MIXER']):
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
