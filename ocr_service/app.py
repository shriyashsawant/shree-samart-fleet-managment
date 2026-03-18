# OCR Invoice Scanner Service
# Uses OCR.space API (free tier) - no installation required!
# Requires: pip install requests

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
import os
import tempfile
from werkzeug.utils import secure_filename

app = Flask(__name__)
# Allow all origins for the OCR service since it's a private internal utility
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# OCR.space API (free, no installation required)
OCR_API_URL = 'https://api.ocr.space/parse/image'
OCR_API_KEY = os.environ.get('OCR_API_KEY', 'helloworld')  # Set via environment variable

def extract_text_from_api(image_path):
    """Extract text using OCR.space free API"""
    try:
        with open(image_path, 'rb') as f:
            response = requests.post(
                OCR_API_URL,
                files={'file': f},
                data={
                    'apikey': OCR_API_KEY,
                    'language': 'eng',
                    'isOverlayRequired': 'false',
                }
            )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ParsedResults'):
                return result['ParsedResults'][0].get('ParsedText', '')
        return ''
    except Exception as e:
        print(f"OCR API Error: {e}")
        return ''

def clean_text(text):
    """Clean OCR text to improve extraction"""
    # Replace common OCR mistakes
    text = text.replace('l', '1').replace('O', '0')
    text = text.replace('—', '-').replace('–', '-')
    text = text.replace('₹', '').replace('Rs', '').replace('Rs.', '')
    text = text.replace(',', '')  # Remove commas for number extraction
    return text

def parse_invoice_text(text):
    """Parse extracted text to find invoice fields with highly granular extraction for Indian invoices"""
    # Create clean version for numeric extraction
    clean = clean_text(text)
    lines = text.split('\n')
    lines = [L.strip() for L in lines if L.strip()]
    
    result = {
        'bill_no': None,
        'date': None,
        'company_name': None,
        'company_gst': None,
        'company_mobile': None,
        'company_address': None,
        'invoice_type': None,
        'party_name': None,
        'party_gst': None,
        'party_pan': None,
        'party_address': None,
        'service_description': None,
        'hsn_code': None,
        'basic_amount': None,
        'cgst_amount': None,
        'sgst_amount': None,
        'igst_amount': 0,
        'total_amount': None,
        'bill_type': None,
        'month': None,
        'year': None,
        'bank_name': None,
        'bank_account_no': None,
        'bank_ifsc': None,
        'raw_text': text
    }
    
    # 1. Extract Invoice Type
    if any(k in text.upper() for k in ['TAX INVOICE', 'GST INVOICE', 'CASH MEMO']):
        result['invoice_type'] = 'TAX INVOICE'
    
    # 2. Extract Date
    date_patterns = [
        r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})',
        r'Date\s*[:\-\s]*(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{2,4})',
        r'Dated\s*[:\-\s]*(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{2,4})',
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            day, month, year = match.groups()
            if len(year) == 2: year = "20" + year
            result['date'] = f"{day}/{month}/{year}"
            break
            
    # 3. Extract Bill No
    bill_patterns = [
        r'(?:Bill|Invoice|Inv|Sr|Invoice|Voucher)\s*(?:No|#)[:\-\s\.]+\s*([A-Z0-9\/\-]+)',
        r'No[:\-\s\.]+\s*(\d+)',
        r'Bill\s*(\d+)',
    ]
    for pattern in bill_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = match.group(1).strip().strip('.')
            if len(val) >= 1:
                result['bill_no'] = val
                break

    # 4. Extract Mobile / Phone
    mobile_match = re.search(r'(?:Mob|Mobile|Phone|Tel|Cell)[:\-\s]*([6-9]\d{9})', text, re.IGNORECASE)
    if mobile_match:
        result['company_mobile'] = mobile_match.group(1)

    # 5. Extract GST Numbers (with OCR error handling)
    # First try standard pattern
    gst_list = re.findall(r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1})', text.upper())
    if not gst_list:
        # Try with OCR errors: I->1, l->1, 0->O
        gst_list = re.findall(r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1})', text)
    
    if gst_list:
        # Clean up GST numbers (fix common OCR errors)
        cleaned_gsts = []
        for gst in gst_list:
            # Replace common OCR mistakes
            cleaned = gst.replace('I', '1').replace('l', '1').replace('0', 'O')
            cleaned_gsts.append(cleaned)
        
        # Usually the first GST belongs to the Sender (Company)
        result['company_gst'] = cleaned_gsts[0]
        if len(cleaned_gsts) > 1:
            # Usually subsequent ones belong to the Party
            result['party_gst'] = cleaned_gsts[1]
        
    # 6. Extract PAN (derived from GST or direct)
    pan_match = re.search(r'([A-Z]{5}[0-9]{4}[A-Z]{1})', text.upper())
    if pan_match:
        result['party_pan'] = pan_match.group(1)

    # 7. Extract Company and Party Names (improved for OCR errors)
    party_found = False
    for i, line in enumerate(lines):
        line_up = line.upper()
        # Look for party section - to, bill to, m/s
        if any(k in line_up for k in ['TO,', 'TO :', 'M/S', 'BILL TO', 'PARTY NAME', 'CONSIGNEE', 'CLIENT']):
            # Try next few lines for party name
            for j in range(i+1, min(i+5, len(lines))):
                next_line = lines[j].strip()
                if next_line and len(next_line) > 2:
                    # Skip lines with only numbers or common keywords
                    if not any(x in next_line.upper() for x in ['GST:', 'PAN:', 'MOBILE:', 'PHONE:', 'ADDRESS:', 'VAT', 'NOTE:']):
                        result['party_name'] = next_line
                        party_found = True
                        break
            break
    
    # Also search for known party names directly in text (handles OCR errors like PRSM -> PRISM)
    if not party_found:
        # Look for patterns like "JOHNSON" which is a known party
        if 'JOHNSON' in text.upper():
            match = re.search(r'([A-Z][A-Za-z\s]+(?:LIMITED|LTD|JOHNSON))', text.upper())
            if match:
                result['party_name'] = match.group(1).strip()
                party_found = True
    
    # If still not found, try the first prominent company name after our company
    if not party_found:
        lines_after_company = lines[1:8]  # Look in first few lines after company name
        for line in lines_after_company:
            line_clean = line.strip()
            # Skip if it's our company, empty, or too short
            if 'SHRI SAMARTH' in line_clean.upper() or len(line_clean) < 3:
                continue
            # Skip if it looks like address or other info
            if any(x in line_clean.upper() for x in ['GST', 'PAN', 'MOBILE', 'PHONE', 'MAHARASHTRA', 'KOLHAPUR']):
                continue
            result['party_name'] = line_clean
            break

    # Extract Company Details (Header logic)
    if 'SHRI SAMARTH' in text.upper():
        result['company_name'] = 'SHRI SAMARTH ENTERPRISES'
        result['company_mobile'] = result.get('company_mobile') or '8624077666'
        result['company_address'] = 'Rajopadhya Nagar, Kolhapur'
    elif not result['company_name'] and len(lines) > 0:
        result['company_name'] = lines[0].strip()

    # 8. Service Description & HSN
    if any(k in text.upper() for k in ['MIXER', 'RENTAL', 'RENT', 'CHARGES']):
        result['service_description'] = 'Fixed Transit Mixer Rental Charges'
        result['bill_type'] = 'Rent'

    hsn_match = re.search(r'(?:HSN|SAC|HSC)[:\-\s]*(\d{4,8})', text, re.IGNORECASE)
    if hsn_match:
        result['hsn_code'] = hsn_match.group(1)

    # 11. Month & Year extraction
    months_list = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    for m in months_list:
        if m.lower() in text.lower():
            result['month'] = m
            yr_match = re.search(rf'{m}.*?(\d{{4}})', text, re.IGNORECASE | re.DOTALL)
            if yr_match:
                result['year'] = yr_match.group(1)
            break

    # 9. Amounts - First try to find explicit patterns
    amount_text = text.replace(',', '').replace('/-', '')
    
    # Look for explicit Total keywords first
    total_match = re.search(r'(?:Grand Total|Net Amount|Total Amount|Bill Amount|TOTAL)[:\s]*[Rs\.\₹]*\s*([0-9,]+(?:\.\d{1,2})?)', amount_text, re.IGNORECASE)
    if total_match:
        total_str = total_match.group(1).replace(',', '')
        result['total_amount'] = float(total_str)
    
    # Also look for "Amount Payable" which often contains the final amount in words
    payable_match = re.search(r'Amount Payable[:\s]*[Rs\.\₹]*\s*([0-9,]+)', amount_text, re.IGNORECASE)
    if payable_match and not result.get('total_amount'):
        result['total_amount'] = float(payable_match.group(1).replace(',', ''))
    
    # Also try to find basic amount from common patterns
    basic_match = re.search(r'(?:Sub Total|Subtotal|Basic Amount|Amount)[:\s]*[Rs\.\₹]*\s*([0-9,]+)', amount_text, re.IGNORECASE)
    if basic_match:
        basic_str = basic_match.group(1).replace(',', '')
        result['basic_amount'] = float(basic_str)
    
    # Find CGST - look for "CGS3" OCR error or "CGST"
    cgst_match = re.search(r'(?:CGS[3T]|CGST)[:\s]*[0-9%]*\s*([0-9,]+(?:\.\d{1,2})?)', amount_text, re.IGNORECASE)
    if cgst_match:
        result['cgst_amount'] = float(cgst_match.group(1).replace(',', ''))
    
    # Find SGST - look for "SGS1" OCR error or "SGST"
    sgst_match = re.search(r'(?:SGS[1T]|SGST)[:\s]*[0-9%]*\s*([0-9,]+(?:\.\d{1,2})?)', amount_text, re.IGNORECASE)
    if sgst_match:
        result['sgst_amount'] = float(sgst_match.group(1).replace(',', ''))
    
    # If we have basic + cgst + sgst, calculate total if not already found
    if result.get('basic_amount') and result.get('cgst_amount') and not result.get('total_amount'):
        result['total_amount'] = result['basic_amount'] + result.get('cgst_amount', 0) + result.get('sgst_amount', 0)
    
    # Fallback: If total still not found, use heuristic but be more careful
    all_numbers = re.findall(r'\b(\d+(?:\.\d{1,2})?)\b', amount_text)
    
    # Filter out phone numbers and very large numbers
    candidates = []
    for n in all_numbers:
        try:
            val = float(n)
            if val > 100:
                # Skip 10-digit numbers that look like phone numbers
                if len(n) == 10 and n[0] in '6789':
                    continue
                # Skip very large numbers that are likely not amounts
                if val > 10000000:
                    continue
                candidates.append(val)
        except:
            pass
    
    candidates = sorted(list(set(candidates)), reverse=True)
    
    # Only use heuristic if we haven't found total yet
    if not result.get('total_amount'):
        # Heuristic for Indian Tax Invoices: Total = Basic + CGST + SGST (where CGST=SGST)
        found_financials = False
        for total in candidates:
            if found_financials: break
            for basic in candidates:
                if basic >= total: continue
                if found_financials: break
                
                remaining = total - basic
                # Check for CGST/SGST split (usually half of remaining)
                tax_comp = remaining / 2.0
                
                for tax_val in candidates:
                    if 0.98 <= (tax_val / tax_comp) <= 1.02:
                        result['basic_amount'] = basic
                        result['cgst_amount'] = tax_val
                        result['sgst_amount'] = tax_val
                        result['total_amount'] = total
                        found_financials = True
                        break
    
    # Heuristic for Indian Tax Invoices: Total = Basic + CGST + SGST (where CGST=SGST)
    found_financials = False
    for total in candidates:
        if found_financials: break
        for basic in candidates:
            if basic >= total: continue
            if found_financials: break
            
            remaining = total - basic
            # Check for CGST/SGST split (usually half of remaining)
            tax_comp = remaining / 2.0
            
            for tax_val in candidates:
                if 0.98 <= (tax_val / tax_comp) <= 1.02:
                    result['basic_amount'] = basic
                    result['cgst_amount'] = tax_val
                    result['sgst_amount'] = tax_val
                    result['total_amount'] = total
                    found_financials = True
                    break
            
            # Check for IGST (full remaining)
            if not found_financials:
                for tax_val in candidates:
                    if 0.98 <= (tax_val / remaining) <= 1.02:
                        result['basic_amount'] = basic
                        result['igst_amount'] = tax_val
                        result['total_amount'] = total
                        found_financials = True
                        break

    # 10. Bank Details
    # Look for bank name
    if 'KOTAK' in text.upper():
        result['bank_name'] = 'Kotak Bank'
    elif 'HDFC' in text.upper(): 
        result['bank_name'] = 'HDFC Bank'
    elif 'ICICI' in text.upper():
        result['bank_name'] = 'ICICI Bank'
    elif 'SBI' in text.upper():
        result['bank_name'] = 'State Bank of India'
    
    # Look for account number - more flexible pattern
    acc_match = re.search(r'(?:A/c|Account|Acc|SB)[:\s]*(?:No|Number)?[:\-\s\.]*(\d{8,18})', text, re.IGNORECASE)
    if acc_match:
        result['bank_account_no'] = acc_match.group(1)
    
    # Also try to find any 9-18 digit number near bank keywords
    if not result.get('bank_account_no'):
        bank_context = re.search(r'Bank[:\s]+(\d{9,18})', text, re.IGNORECASE)
        if bank_context:
            result['bank_account_no'] = bank_context.group(1)
    
    # Look for IFSC code
    ifsc_match = re.search(r'IFSC[:\s]*(?:Code)?[:\-\s\.]*([A-Z]{4}0[A-Z0-9]{6})', text, re.IGNORECASE)
    if ifsc_match:
        result['bank_ifsc'] = ifsc_match.group(1).upper()

    return result

    return result

@app.route('/extract', methods=['POST'])
@app.route('/api/ocr/extract', methods=['POST'])
def extract_invoice():
    """Main endpoint to extract invoice data from uploaded image/PDF"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Save uploaded file
    filename = secure_filename(file.filename)
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, filename)
    file.save(file_path)
    
    try:
        # Extract text using OCR API
        text = extract_text_from_api(file_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text from image'}), 500
        
        # Parse extracted text
        result = parse_invoice_text(text)
        
        # Add confidence score
        fields_found = sum([
            result['bill_no'] is not None,
            result['date'] is not None,
            result['party_name'] is not None or result['party_gst'] is not None,
            result['basic_amount'] is not None or result['total_amount'] is not None,
            result['hsn_code'] is not None,
        ])
        result['confidence'] = fields_found / 5.0
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)

@app.route('/health', methods=['GET'])
@app.route('/api/ocr/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'OCR Invoice Scanner', 'type': 'ocr.space API'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
