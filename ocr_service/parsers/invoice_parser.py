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
            val = match.group(1).strip()
            # Clean up leading/trailing symbols like - or /
            val = re.sub(r'^[\-\/s#]+|[\-\/s#]+$', '', val)
            return val
    
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


def extract_all_gsts(text, company_gst=None):
    """Extract all valid 15-char GSTINs from OCR text. Handles merged blobs.
    Returns (company_gst, party_gst)."""
    GST_STRICT = r'[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][0-9A-Z]{2}'

    normalized = text.upper()
    found = re.findall(GST_STRICT, normalized)

    for blob in re.findall(r'[0-9]{2}[A-Z0-9]{28,32}', normalized):
        for split_at in range(13, 18):
            p1, p2 = blob[:split_at], blob[split_at:]
            for f1 in [fix_gst_errors(p1), fix_gst_errors(p1[:15])]:
                if re.fullmatch(GST_STRICT, f1):
                    for f2 in [fix_gst_errors(p2), fix_gst_errors(p2[:15])]:
                        if re.fullmatch(GST_STRICT, f2):
                            found.extend([f1, f2])
                            blob_split = True
                            break
                    break
            else:
                continue
            break

    seen, unique = set(), []
    for g in found:
        fg = fix_gst_errors(g)
        if fg not in seen:
            seen.add(fg)
            unique.append(fg)

    if not unique:
        return None, None

    company_gst_upper = company_gst.strip().upper() if company_gst else None
    if company_gst_upper:
        matched_idx = next((i for i, g in enumerate(unique) if g.upper() == company_gst_upper), None)
        if matched_idx is not None:
            return unique[matched_idx], (unique[matched_idx + 1] if len(unique) > matched_idx + 1 else unique[0])
        return unique[0], (unique[1] if len(unique) > 1 else unique[0])
    return unique[0], (unique[1] if len(unique) > 1 else None)


def parse_invoice(text, company_gst=None):
    """Parse invoice using keyword anchors for better accuracy.
    
    Args:
        text: Raw OCR text from the invoice image
        company_gst: The tenant's own GST number (from settings). Used to distinguish
                     company GST from party GST in the OCR text. If provided, the parser
                     will match GSTs in the text against this value to identify which is
                     which.
    """
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
    
    # Sanity Checks
    # 1. Back-calculate basic amount if it's 0 but total is present
    if (not result.get('basic_amount') or result['basic_amount'] == 0) and result.get('total_amount'):
        gst_perc = 18.0
        result['basic_amount'] = round(result['total_amount'] / (1 + (gst_perc / 100)), 2)
        result['cgst_amount'] = round((result['total_amount'] - result['basic_amount']) / 2, 2)
        result['sgst_amount'] = result['cgst_amount']
    
    # Ensure totals match (Final Sanity Check)
    if result.get('basic_amount') and result.get('total_amount') == 0:
        result['total_amount'] = result['basic_amount'] + result.get('cgst_amount', 0) + result.get('sgst_amount', 0) + result.get('igst_amount', 0)
        
    # Bill No
    bill_match = re.search(r'(?:Bill\.?\s*No\.?|Invoice\s*No)[\s:\-]*(\d+[\w\-]*)', text, re.IGNORECASE)
    if bill_match:
        result['bill_no'] = bill_match.group(1).strip().lstrip('-')
    else:
        result['bill_no'] = extract_with_anchor(text, 'bill_no')
    
    # Date - look for "Date" or "Dt" followed by actual date value (DD/MM/YYYY)
    date_found = False
    for i, line in enumerate(lines):
        date_match = re.search(r'\b(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})\b', line)
        if date_match and i > 3:
            result['date'] = date_match.group(1)
            date_found = True
            break
    
    # Fallback: look for month + year pattern only if no DD/MM/YYYY found
    if not date_found:
        for line in lines:
            month_match = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[- ]*(\d{4})', line, re.IGNORECASE)
            if month_match:
                result['date'] = f"{month_match.group(1).title()}-{month_match.group(2)}"
                break
    
    # HSN Code
    result['hsn_code'] = extract_with_anchor(text, 'hsn_code')
    
    # Bank Account - look for Kotak Bank:- followed by number, or Kotak followed by number
    account_match = re.search(r'Kotak\s*(?:Bank)?[:\-\s]*(\d{9,18})', text, re.IGNORECASE)
    if account_match:
        result['bank_account_no'] = account_match.group(1)
    else:
        account_match = re.search(r'(?:A/C|Account|Account\s*No)[:\s]*(\d{9,18})', text, re.IGNORECASE)
        if account_match:
            result['bank_account_no'] = account_match.group(1)
        else:
            account_match = re.search(r'(?:IFSC\s*Code|Kotak|IFSC)[:\s]*([A-Z]{4}\d{7})', text, re.IGNORECASE)
    
    # IFSC - look for IFSC code in text
    ifsc_match = re.search(r'(?:IFSC\s*Code|IFSC|IFS\s*Code)[:\s]*([A-Z]{4}\d{7})', text, re.IGNORECASE)
    if not ifsc_match:
        ifsc_match = re.search(r'([A-Z]{4}0\d{6})', text.upper())
    if ifsc_match:
        result['bank_ifsc'] = ifsc_match.group(1).upper()
    result['company_gst'], result['party_gst'] = extract_all_gsts(text, company_gst)
    
    # PAN
    pan_match = re.search(r'(?:PAN|PAN\s*NO)[:\-\s]*([A-Z]{5}[0-9]{4}[A-Z]{1})', text, re.IGNORECASE)
    if pan_match:
        result['party_pan'] = pan_match.group(1)
    else:
        pan_match = re.search(r'([A-Z]{5}[0-9]{4}[A-Z]{1})', text.upper())
        if pan_match:
            result['party_pan'] = pan_match.group(1)
    
    # Mobile - look for any 10-digit number starting with 6-9, anywhere in text
    mobile_match = re.search(r'(?:Mob|Mobile|Phone)[@\s:]*[-:_\s]*\s*([6-9]\d{9})', text, re.IGNORECASE)
    if not mobile_match:
        mobile_match = re.search(r'\b([6-9]\d{9})\b', text)
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
                party_name = line.strip()
                # Clean address garbage after company name (numbers, state codes, pin codes, special chars)
                party_name = re.sub(r'\s*[\d\*,#]+\s*(?:E|Mumbai|Maharashtra|India|Pune|Kolhapur|Tamil|Country|Post|400\d+|411\d+|416\d+).*$', '', party_name, flags=re.IGNORECASE).strip()
                # Remove trailing punctuation and numbers
                party_name = re.sub(r'\s+[A-Z0-9]{2,}$', '', party_name).strip()
                result['party_name'] = party_name
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


def fix_gst_errors(gst):
    """Fix common OCR errors in GST: handles 16-char PPP->PP (extra P in letter segment), I->1, l->1, 0->O"""
    if not gst:
        return gst
    if len(gst) > 15:
        working = list(gst)
        if len(working) >= 11 and working[10] not in '0123456789':
            del working[10]
        elif len(working) >= 8 and working[7] not in '0123456789':
            del working[7]
        gst = ''.join(working[:15])
    if len(gst) < 14:
        return gst
    fixed = list(gst)
    for i in range(10, len(fixed)):
        if fixed[i] in ('I', 'l'):
            fixed[i] = '1'
        elif fixed[i] == '0' and i > 12:
            fixed[i] = 'O'
    return ''.join(fixed)

def normalize_gst(text):
    """Fix common OCR errors in GST for extraction"""
    fixed = text.upper()
    fixed = re.sub(
        r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z])([A-Z]{1}[0-9]{1}[A-Z])',
        lambda m: m.group(1).replace('I', '1').replace('l', '1') +
                   m.group(2).replace('I', '1').replace('l', '1').replace('0', 'O'),
        fixed
    )
    return fixed
