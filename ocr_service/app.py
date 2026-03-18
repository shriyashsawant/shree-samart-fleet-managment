# OCR Invoice Scanner Service
# Uses OCR.space API with image preprocessing and validation

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
import os
import tempfile
import cv2
import numpy as np
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# OCR.space API
OCR_API_URL = 'https://api.ocr.space/parse/image'
OCR_API_KEY = os.environ.get('OCR_API_KEY', 'helloworld')


def preprocess_image(image_path):
    """Preprocess image to improve OCR accuracy"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding to binarize
        thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]
        
        # Apply slight denoising
        denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
        
        # Save processed image to temp file
        temp_path = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False).name
        cv2.imwrite(temp_path, denoised)
        
        return temp_path
    except Exception as e:
        print(f"Image preprocessing error: {e}")
        return image_path


def detect_document_type(text):
    """Detect the type of document being scanned"""
    text_upper = text.upper()
    
    if any(k in text_upper for k in ['TAX INVOICE', 'INVOICE', 'BILL NO', 'BILL AMOUNT', 'GST', 'CGST', 'SGST']):
        return 'invoice'
    elif any(k in text_upper for k in ['REGISTRATION CERTIFICATE', 'RC BOOK', 'MOTOR VEHICLE', 'CHASSIS NUMBER', 'ENGINE NUMBER']):
        return 'vehicle_rc'
    elif any(k in text_upper for k in ['INSURANCE', 'POLICY', 'PREMIUM', 'COVER NOTE']):
        return 'insurance'
    elif any(k in text_upper for k in ['PUC', 'POLLUTION', 'EMISSION']):
        return 'puc'
    elif any(k in text_upper for k in ['TAX RECEIPT', 'ROAD TAX', 'TEMPORARY REGISTRATION']):
        return 'tax_receipt'
    elif any(k in text_upper for k in ['DRIVING LICENSE', 'DL NO', 'LICENSE VALID']):
        return 'driving_license'
    elif any(k in text_upper for k in ['AADHAAR', 'UIDAI', 'UNIQUE IDENTIFICATION']):
        return 'aadhaar'
    
    return 'unknown'


def extract_text_from_api(image_path):
    """Extract text using OCR.space free API"""
    try:
        # Try preprocessing first
        processed_path = preprocess_image(image_path)
        
        with open(processed_path, 'rb') as f:
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


def normalize_gst_number(text):
    """Fix common OCR errors in GST numbers"""
    # Only fix inside GST-like patterns
    # 27ASXPP6488L1ZD format
    return re.sub(
        r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z])([A-Z]{1}[0-9]{1}[A-Z])',
        lambda m: m.group(1).replace('I', '1').replace('l', '1') + 
                   m.group(2).replace('I', '1').replace('l', '1').replace('0', 'O'),
        text.upper()
    )


def parse_invoice_text(text):
    """Parse extracted text to find invoice fields"""
    lines = text.split('\n')
    lines = [L.strip() for L in lines if L.strip()]
    
    result = {
        'bill_no': None, 'date': None,
        'company_name': None, 'company_gst': None, 'company_mobile': None, 'company_address': None,
        'party_name': None, 'party_gst': None, 'party_pan': None,
        'basic_amount': None, 'cgst_amount': None, 'sgst_amount': None,
        'igst_amount': None, 'total_amount': None,
        'hsn_code': None, 'bill_type': None,
        'bank_name': None, 'bank_account_no': None, 'bank_ifsc': None,
    }
    
    # 1. Extract Bill No
    for pattern in [r'(?:Bill|Invoice|Inv|Sr|No)[:\-\s\.]+\s*([A-Z0-9\/\-]+)', r'No[:\-\s\.]+\s*(\d+)']:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['bill_no'] = match.group(1).strip()
            break
    
    # 2. Extract Date
    for pattern in [r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})']:
        match = re.search(pattern, text)
        if match:
            day, month, year = match.groups()
            if len(year) == 2:
                year = "20" + year
            result['date'] = f"{day}/{month}/{year}"
            break
    
    # 3. Extract GST Numbers
    gst_list = re.findall(r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1})', normalize_gst_number(text))
    if gst_list:
        result['company_gst'] = gst_list[0]
        if len(gst_list) > 1:
            result['party_gst'] = gst_list[1]
    
    # 4. Extract PAN
    pan_match = re.search(r'([A-Z]{5}[0-9]{4}[A-Z]{1})', text.upper())
    if pan_match:
        result['party_pan'] = pan_match.group(1)
    
    # 5. Extract Mobile
    mobile_match = re.search(r'(?:Mob|Mobile|Phone)[:\-\s]*([6-9]\d{9})', text, re.IGNORECASE)
    if mobile_match:
        result['company_mobile'] = mobile_match.group(1)
    
    # 6. Extract Company Name (first line)
    if lines:
        result['company_name'] = lines[0].strip()
    
    # 7. Extract Party Name
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
    
    # 8. Extract HSN
    hsn_match = re.search(r'(?:HSN|SAC)[:\-\s]*(\d{4,8})', text, re.IGNORECASE)
    if hsn_match:
        result['hsn_code'] = hsn_match.group(1)
    
    # 9. Extract Bill Type
    if any(k in text.upper() for k in ['RENTAL', 'RENT', 'CHARGES']):
        result['bill_type'] = 'Rent'
    
    # 10. Extract Amounts - look for keywords first
    amount_text = text.replace(',', '').replace('/-', '')
    
    # Find amounts near keywords
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
    
    # Extract Basic Amount
    basic_match = re.search(r'(?:Basic|Sub Total)[:\s]*([0-9,]+)', amount_text, re.IGNORECASE)
    if basic_match:
        result['basic_amount'] = float(basic_match.group(1).replace(',', ''))
    
    # Extract CGST/SGST
    cgst_match = re.search(r'(?:CGS[3T]|CGST)[:\s]*([0-9,]+)', amount_text, re.IGNORECASE)
    if cgst_match:
        result['cgst_amount'] = float(cgst_match.group(1).replace(',', ''))
    
    sgst_match = re.search(r'(?:SGS[1T]|SGST)[:\s]*([0-9,]+)', amount_text, re.IGNORECASE)
    if sgst_match:
        result['sgst_amount'] = float(sgst_match.group(1).replace(',', ''))
    
    # Calculate total if not found
    if result.get('basic_amount') and result.get('cgst_amount') and not result.get('total_amount'):
        result['total_amount'] = result['basic_amount'] + result.get('cgst_amount', 0) + result.get('sgst_amount', 0)
    
    # 11. Extract Bank Details
    if 'KOTAK' in text.upper():
        result['bank_name'] = 'Kotak Bank'
    elif 'HDFC' in text.upper():
        result['bank_name'] = 'HDFC Bank'
    elif 'ICICI' in text.upper():
        result['bank_name'] = 'ICICI Bank'
    elif 'SBI' in text.upper():
        result['bank_name'] = 'State Bank of India'
    
    acc_match = re.search(r'(?:A/c|Account)[:\s]*(\d{8,18})', text, re.IGNORECASE)
    if acc_match:
        result['bank_account_no'] = acc_match.group(1)
    
    ifsc_match = re.search(r'IFSC[:\s]*([A-Z]{4}0[A-Z0-9]{6})', text, re.IGNORECASE)
    if ifsc_match:
        result['bank_ifsc'] = ifsc_match.group(1)
    
    # Add document type
    result['document_type'] = detect_document_type(text)
    
    # Add validation
    result = validate_fields(result)
    
    # Add confidence scores
    result = add_confidence_scores(result, text)
    
    return result


def validate_fields(result):
    """Validate extracted fields"""
    errors = []
    
    # Validate GST
    for gst_field in ['company_gst', 'party_gst']:
        if result.get(gst_field):
            gst_clean = result[gst_field].replace(' ', '')
            result[f'{gst_field}_valid'] = len(gst_clean) == 15
            if len(gst_clean) != 15:
                errors.append(f"{gst_field}: Invalid length")
    
    # Validate Total >= Basic
    basic = result.get('basic_amount')
    total = result.get('total_amount')
    if basic and total:
        result['amount_valid'] = total >= basic
        if total < basic:
            errors.append("total less than basic")
    
    # Validate Date format
    date = result.get('date')
    if date:
        result['date_valid'] = bool(re.match(r'^\d{1,2}/\d{1,2}/\d{2,4}$', date))
    
    result['validation_errors'] = errors
    return result


def add_confidence_scores(result, text):
    """Calculate confidence scores"""
    fields = ['bill_no', 'date', 'party_name', 'party_gst', 'party_pan',
              'basic_amount', 'cgst_amount', 'sgst_amount', 'total_amount',
              'hsn_code', 'bank_name', 'bank_account_no', 'bank_ifsc']
    
    found = sum(1 for f in fields if result.get(f))
    result['confidence'] = int((found / len(fields)) * 100)
    
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
    temp_path = tempfile.NamedTemporaryFile(delete=False).name
    file.save(temp_path)
    
    try:
        # Extract text
        text = extract_text_from_api(temp_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text from image'}), 400
        
        # Parse extracted text
        result = parse_invoice_text(text)
        result['raw_text'] = text
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Cleanup temp file
        try:
            os.remove(temp_path)
        except:
            pass


@app.route('/health', methods=['GET'])
@app.route('/api/ocr/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
