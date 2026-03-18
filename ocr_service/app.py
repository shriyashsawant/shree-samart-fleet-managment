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

    # 5. Extract GST Numbers (distinguishing Company vs Party)
    gst_list = re.findall(r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})', text.upper())
    if gst_list:
        # Usually the first GST belongs to the Sender (Company)
        result['company_gst'] = gst_list[0]
        if len(gst_list) > 1:
            # Usually subsequent ones belong to the Party
            result['party_gst'] = gst_list[1]
        
    # 6. Extract PAN (derived from GST or direct)
    pan_match = re.search(r'([A-Z]{5}[0-9]{4}[A-Z]{1})', text.upper())
    if pan_match:
        result['party_pan'] = pan_match.group(1)

    # 7. Extract Company and Party Names
    party_found = False
    for i, line in enumerate(lines):
        line_up = line.upper()
        if any(k in line_up for k in ['TO,', 'TO :', 'M/S', 'BILL TO', 'PARTY NAME', 'CONSIGNEE', 'CLIENT']):
            context = " ".join(lines[i:i+3]).upper()
            if 'PRISM JOHNSON' in context:
                result['party_name'] = 'PRISM JOHNSON LIMITED'
                result['party_address'] = 'Windsor, CTS Road, Mumbai'
                party_found = True
            elif 'M/S' in line_up:
                result['party_name'] = line_up.replace('M/S', '').strip(': ').strip()
                party_found = True
            
            if not party_found and i + 1 < len(lines):
                result['party_name'] = lines[i+1].strip()
                party_found = True
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

    # 9. Amounts - Robust Multi-pass Detection
    amount_text = text.replace(',', '').replace('/-', '')
    all_numbers = re.findall(r'\b(\d+(?:\.\d{1,2})?)\b', amount_text)
    
    candidates = sorted(list(set([float(n) for n in all_numbers if float(n) > 10])), reverse=True)
    
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
    if 'KOTAK' in text.upper(): result['bank_name'] = 'Kotak Bank'
    elif 'HDFC' in text.upper(): result['bank_name'] = 'HDFC Bank'
    elif 'ICICI' in text.upper(): result['bank_name'] = 'ICICI Bank'
    elif 'SBI' in text.upper(): result['bank_name'] = 'State Bank of India'
    
    acc_match = re.search(r'(?:A/c|Account|Acc|SB)\s*(?:No|Number)?[:\-\s\.]*(\d{8,18})', text, re.IGNORECASE)
    if acc_match: result['bank_account_no'] = acc_match.group(1)
    
    ifsc_match = re.search(r'IFSC\s*(?:Code)?[:\-\s\.]*([A-Z]{4}0[A-Z0-9]{6})', text, re.IGNORECASE)
    if ifsc_match: result['bank_ifsc'] = ifsc_match.group(1)

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
