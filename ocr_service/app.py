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
    """Parse extracted text to find invoice fields"""
    # Clean the text first
    clean = clean_text(text)
    lines = text.split('\n')
    
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
    
    # Extract Bill No - look for patterns like "Bill 00-01" or "Bill No: 03"
    bill_patterns = [
        r'Bill\s*[/\\-]?\s*(\d+)',
        r'Bill\s*(?:No|#)[:\-\.]?\s*(\d+)',
        r'Invoice\s*(?:No|#)[:\-\.]?\s*(\d+)',
    ]
    for pattern in bill_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['bill_no'] = match.group(1)
            break
    
    # Extract Date - look for patterns like "Date: 21/06/2024" or "Date 21-03-2024"
    date_patterns = [
        r'Date[:\-\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})',
        r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})',
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['date'] = f"{match.group(1)}/{match.group(2)}/{match.group(3)}"
            break
    
    # Extract Party Name (known parties)
    known_parties = [
        'PRISM JOHNSON', 'PRISM JOHNSON LIMITED',
        'ULTRA TECH', 'AMBUJA', 'ACC', 'BIRLA',
    ]
    for party in known_parties:
        if party.lower() in text.lower():
            result['party_name'] = party.title().replace(' ', ' ')
            if 'limited' in text.lower():
                result['party_name'] = 'Prism Johnson Limited'
            break
    
    if not result['party_name']:
        # Try to find party from "GST No -" lines
        match = re.search(r'GST\s*No\s*[-–]\s*([A-Z0-9]{15})', text, re.IGNORECASE)
        if match:
            # Look for company name near GST number
            gst = match.group(1)
            result['party_gst'] = gst
    
    # Extract Party GST (15 character format) - improved pattern
    gst_patterns = [
        r'GST\s*(?:NO|No|no|NO)?\s*[-–]?\s*([A-Z0-9]{15})',
        r'GSTIN\s*[:]?\s*([A-Z0-9]{15})',
    ]
    for pattern in gst_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['party_gst'] = match.group(1)
            break
    
    # Extract HSN Code
    hsn_patterns = [
        r'HS[N/C]/[SC]\s*(\d{4,8})',
        r'HS[N/C][:\s]+(\d{4,8})',
    ]
    for pattern in hsn_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['hsn_code'] = match.group(1)
            break
    
    if not result['hsn_code']:
        # Try simpler pattern
        match = re.search(r'(\d{4})\s*$', clean, re.MULTILINE)
        if match:
            result['hsn_code'] = match.group(1)
    
    # Extract Amounts - look for patterns with "Payable" or "Grand Total"
    # First try to find total amount
    total_patterns = [
        r'(?:Grand\s*Total|Payable)[:\-\s]*[\u20b9Rs]*\s*([\d]+)',
        r'Total\s*(?:Amount|Payable)[:\-\s]*([\d]+)',
    ]
    for pattern in total_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                result['total_amount'] = int(match.group(1))
            except:
                pass
            break
    
    # Try to find basic amount - look for amounts near "Sub" or "Basic"
    if not result['basic_amount']:
        # If we have total and CGST/SGST, we can calculate backwards
        if result['total_amount']:
            # Common case: total includes 18% GST, so basic = total / 1.18
            result['basic_amount'] = int(result['total_amount'] / 1.18)
            cgst = int(result['basic_amount'] * 0.09)
            result['cgst_amount'] = cgst
            result['sgst_amount'] = cgst
    
    # Extract Month and Year
    month_year_patterns = [
        r'(January|February|March|April|May|June|July|August|September|October|November|December)\s*[-]?\s*(\d{4})',
        r'(?:Month of|For the month of)[:\s]+([A-Za-z]+)[-\s]+(\d{4})',
    ]
    for pattern in month_year_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['month'] = match.group(1).capitalize()
            result['year'] = match.group(2)
            break
    
    # Determine Bill Type
    text_lower = text.lower()
    if 'diesel' in text_lower or 'fuel' in text_lower or 'oil' in text_lower:
        result['bill_type'] = 'Diseal'
    elif 'rent' in text_lower or 'rental' in text_lower or 'transit' in text_lower:
        result['bill_type'] = 'Rent'
    elif 'service' in text_lower:
        result['bill_type'] = 'Service'
    elif 'maintenance' in text_lower or 'repair' in text_lower:
        result['bill_type'] = 'Main'
    else:
        result['bill_type'] = 'Other'
    
    return result

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

@app.route('/api/ocr/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'OCR Invoice Scanner', 'type': 'ocr.space API'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
