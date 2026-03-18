"""
Invoice Parser Module
Parses GST invoices and bills
"""

import re


def parse_invoice(text):
    """Parse invoice/GST bill text"""
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
    
    # Extract Bill No
    for pattern in [r'(?:Bill|Invoice|Inv|Sr|No)[:\-\s\.]+\s*([A-Z0-9\/\-]+)', r'No[:\-\s\.]+\s*(\d+)']:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['bill_no'] = match.group(1).strip()
            break
    
    # Extract Date
    for pattern in [r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})']:
        match = re.search(pattern, text)
        if match:
            day, month, year = match.groups()
            if len(year) == 2:
                year = "20" + year
            result['date'] = f"{day}/{month}/{year}"
            break
    
    # Extract GST Numbers
    gst_list = re.findall(r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1})', 
                         normalize_gst(text))
    if gst_list:
        result['company_gst'] = gst_list[0]
        if len(gst_list) > 1:
            result['party_gst'] = gst_list[1]
    
    # Extract PAN
    pan_match = re.search(r'([A-Z]{5}[0-9]{4}[A-Z]{1})', text.upper())
    if pan_match:
        result['party_pan'] = pan_match.group(1)
    
    # Extract Mobile
    mobile_match = re.search(r'(?:Mob|Mobile|Phone)[:\-\s]*([6-9]\d{9})', text, re.IGNORECASE)
    if mobile_match:
        result['company_mobile'] = mobile_match.group(1)
    
    # Company Name (first line)
    if lines:
        result['company_name'] = lines[0].strip()
    
    # Party Name
    party_keywords = ['TO,', 'TO :', 'M/S', 'BILL TO', 'PARTY NAME', 'CONSIGNEE', 'CLIENT', 'BUYER', 'CUSTOMER']
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
    
    # HSN
    hsn_match = re.search(r'(?:HSN|SAC)[:\-\s]*(\d{4,8})', text, re.IGNORECASE)
    if hsn_match:
        result['hsn_code'] = hsn_match.group(1)
    
    # Bill Type
    if any(k in text.upper() for k in ['RENTAL', 'RENT', 'CHARGES']):
        result['bill_type'] = 'Rent'
    
    # Amounts
    amount_text = text.replace(',', '').replace('/-', '')
    
    # Total from keywords
    amount_keywords = ['total', 'grand', 'payable', 'amount']
    for line in lines:
        line_lower = line.lower()
        if any(kw in line_lower for kw in amount_keywords):
            numbers = re.findall(r'([0-9,]+(?:\.\d{1,2})?)', line)
            for n in numbers:
                try:
                    val = float(n.replace(',', ''))
                    if val > 1000 and val < 10000000 and not result.get('total_amount'):
                        result['total_amount'] = val
                except:
                    pass
    
    # Basic Amount
    basic_match = re.search(r'(?:Basic|Sub Total)[:\s]*([0-9,]+)', amount_text, re.IGNORECASE)
    if basic_match:
        result['basic_amount'] = float(basic_match.group(1).replace(',', ''))
    
    # CGST
    cgst_match = re.search(r'(?:CGS[3T]|CGST)[:\s]*([0-9,]+)', amount_text, re.IGNORECASE)
    if cgst_match:
        result['cgst_amount'] = float(cgst_match.group(1).replace(',', ''))
    
    # SGST
    sgst_match = re.search(r'(?:SGS[1T]|SGST)[:\s]*([0-9,]+)', amount_text, re.IGNORECASE)
    if sgst_match:
        result['sgst_amount'] = float(sgst_match.group(1).replace(',', ''))
    
    # Calculate total if missing
    if result.get('basic_amount') and result.get('cgst_amount') and not result.get('total_amount'):
        result['total_amount'] = result['basic_amount'] + result.get('cgst_amount', 0) + result.get('sgst_amount', 0)
    
    # Bank Details
    if 'KOTAK' in text.upper():
        result['bank_name'] = 'Kotak Bank'
    elif 'HDFC' in text.upper():
        result['bank_name'] = 'HDFC Bank'
    elif 'ICICI' in text.upper():
        result['bank_name'] = 'ICICI Bank'
    
    acc_match = re.search(r'(?:A/c|Account)[:\s]*(\d{8,18})', text, re.IGNORECASE)
    if acc_match:
        result['bank_account_no'] = acc_match.group(1)
    
    ifsc_match = re.search(r'IFSC[:\s]*([A-Z]{4}0[A-Z0-9]{6})', text, re.IGNORECASE)
    if ifsc_match:
        result['bank_ifsc'] = ifsc_match.group(1)
    
    return result


def normalize_gst(text):
    """Fix common OCR errors in GST numbers"""
    return re.sub(
        r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z])([A-Z]{1}[0-9]{1}[A-Z])',
        lambda m: m.group(1).replace('I', '1').replace('l', '1') + 
                   m.group(2).replace('I', '1').replace('l', '1').replace('0', 'O'),
        text.upper()
    )
