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
OCR_API_KEY = 'helloworld'  # Free demo key

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
    """Parse extracted text to find invoice fields with improved regex for Indian invoices"""
    # Create clean version for numeric extraction
    clean = clean_text(text)
    
    result = {
        'bill_no': None,
        'date': None,
        'party_name': None,
        'party_gst': None,
        'hsn_code': None,
        'basic_amount': None,
        'cgst_amount': None,
        'sgst_amount': None,
        'total_amount': None,
        'bill_type': None,
        'month': None,
        'year': None,
        'raw_text': text
    }
    
    # 1. Extract Date (DO NOT use simple numbers to avoid confusing with amounts)
    date_patterns = [
        r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})',
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            day, month, year = match.groups()
            if len(year) == 2: year = "20" + year
            result['date'] = f"{day}/{month}/{year}"
            break
            
    # 2. Extract Bill No
    bill_patterns = [
        r'(?:Bill|Invoice|Inv)\s*(?:No|#)?[:\-\s\.]+\s*([A-Z0-9\/\-]+)', # Prioritize Bill/Invoice keywords
        r'(?<!Plot\s)No[:\-\s\.]+\s*(\d+)', # Avoid "Plot no"
    ]
    for pattern in bill_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # Clean up the found bill no (remove trailing dots, etc)
            val = match.group(1).strip().strip('.')
            if len(val) > 1: # Avoid single digit noise unless labeled
                result['bill_no'] = val
                break

    # 3. Extract GST Number (15 digits)
    gst_match = re.search(r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})', text)
    if gst_match:
        result['party_gst'] = gst_match.group(1)

    # 4. Extract HSN/SAC
    hsn_match = re.search(r'(?:HSN|SAC|HSC)[:\-\s]*(\d{4,8})', text, re.IGNORECASE)
    if hsn_match:
        result['hsn_code'] = hsn_match.group(1)

    # 5. Extract Amounts (Improved logic with Relationship Checking)
    # Get all potential numeric values excluding dates and phone numbers
    amount_text = text.replace(',', '').replace('/-', '')
    all_numbers = re.findall(r'\b(\d+(?:\.\d{1,2})?)\b', amount_text)
    
    def is_money(val_str):
        try:
            val = float(val_str)
            if val > 100000000: return False
            if 7000000000 <= val <= 9999999999: return False
            if result['date'] and val_str in re.findall(r'\d+', result['date']): return False
            return val > 10
        except: return False

    candidates = sorted(list(set([float(n) for n in all_numbers if is_money(n)])), reverse=True)
    
    # Logic to find relationships: A (Basic) + B (CGST) + C (SGST) = D (Total)
    # Most common: B = C = A * 0.09, D = A * 1.18
    found_via_relationship = False
    
    for i, a in enumerate(candidates):
        for b in candidates:
            # Check if b is approx 9% of a (standard GST)
            if 0.085 <= (b / a) <= 0.095:
                result['basic_amount'] = a
                result['cgst_amount'] = b
                result['sgst_amount'] = b
                # Check if we have a total that matches a + 2*b
                total_calc = a + 2*b
                # Look for this total in candidates
                for c in candidates:
                    if 0.99 <= (c / total_calc) <= 1.01:
                        result['total_amount'] = c
                        found_via_relationship = True
                        break
                
                if not result['total_amount']:
                    # Calculate total if not found
                    result['total_amount'] = total_calc
                
                found_via_relationship = True
                break
        if found_via_relationship: break

    # Fallback to keyword-based search if relationship logic didn't work
    if not found_via_relationship:
        lines = text.split('\n')
        # Try finding Total first
        for i, line in enumerate(lines):
            line_l = line.lower()
            if any(k in line_l for k in ['total', 'grand', 'payable']):
                ctx = " ".join(lines[i:i+4]).replace(',', '').replace('/-', '')
                matches = re.findall(r'\b(\d+(?:\.\d{1,2})?)\b', ctx)
                valid = [float(m) for m in matches if is_money(m)]
                if valid:
                    result['total_amount'] = max(valid)
                    break

        # Try finding Basic
        for i, line in enumerate(lines):
            line_l = line.lower()
            if any(k in line_l for k in ['basic', 'sub', 'net', 'amount']):
                ctx = " ".join(lines[i:i+4]).replace(',', '').replace('/-', '')
                matches = re.findall(r'\b(\d+(?:\.\d{1,2})?)\b', ctx)
                valid = [float(m) for m in matches if is_money(m)]
                if valid:
                    val = max(valid)
                    if not result['total_amount'] or val < result['total_amount']:
                        result['basic_amount'] = val
                        break

    # Final calculations if missing components
    if result['total_amount'] and not result['basic_amount']:
        result['basic_amount'] = round(result['total_amount'] / 1.18, 0)
    
    if result['basic_amount'] and not result['cgst_amount']:
        gst_total = (result['total_amount'] or (result['basic_amount'] * 1.18)) - result['basic_amount']
        result['cgst_amount'] = round(gst_total / 2, 2)
        result['sgst_amount'] = round(gst_total / 2, 2)
        if not result['total_amount']:
            result['total_amount'] = round(result['basic_amount'] + gst_total, 2)

    # 6. Extract Party Name
    known_parties = ['PRISM JOHNSON', 'ULTRA TECH', 'AMBUJA', 'ACC', 'BIRLA']
    for party in known_parties:
        if party.lower() in text.lower():
            result['party_name'] = party.title()
            if 'Limited' in text or 'LIMITED' in text:
                result['party_name'] += " Limited"
            break

    # 7. Bill Type and Month
    text_lower = text.lower()
    if any(k in text_lower for k in ['rent', 'transit', 'mixer', 'rental']):
        result['bill_type'] = 'Rent'
    elif any(k in text_lower for k in ['diesel', 'fuel']):
        result['bill_type'] = 'Diseal'
    elif 'service' in text_lower:
        result['bill_type'] = 'Service'
    else:
        result['bill_type'] = 'Main'

    # Extract Month Name
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
              'August', 'September', 'October', 'November', 'December']
    for m in months:
        if m.lower() in text_lower:
            result['month'] = m
            break
            
    return result

@app.route('/extract', methods=['POST'])
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
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'OCR Invoice Scanner', 'type': 'ocr.space API'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
