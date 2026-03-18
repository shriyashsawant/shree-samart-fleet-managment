# OCR Microservice
# Routes to appropriate parser based on document type

from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import os
import tempfile

from ocr_engine import extract_text
from invoice_parser import parse_invoice
from vehicle_parser import parse_vehicle_rc, parse_insurance, parse_puc
from driver_parser import parse_driving_license, parse_aadhaar

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024


def detect_document_type(text):
    """Detect document type from OCR text"""
    text_upper = text.upper()
    
    if any(k in text_upper for k in ['TAX INVOICE', 'INVOICE', 'BILL NO', 'GST', 'CGST', 'SGST']):
        return 'invoice'
    elif any(k in text_upper for k in ['REGISTRATION CERTIFICATE', 'RC BOOK', 'CHASSIS NUMBER', 'ENGINE NUMBER']):
        return 'vehicle_rc'
    elif any(k in text_upper for k in ['INSURANCE', 'POLICY', 'PREMIUM', 'COVER NOTE']):
        return 'insurance'
    elif any(k in text_upper for k in ['PUC', 'POLLUTION', 'EMISSION']):
        return 'puc'
    elif any(k in text_upper for k in ['DRIVING LICENSE', 'DL NO', 'LICENSE']):
        return 'driving_license'
    elif any(k in text_upper for k in ['AADHAAR', 'UIDAI']):
        return 'aadhaar'
    elif any(k in text_upper for k in ['TAX RECEIPT', 'ROAD TAX']):
        return 'tax_receipt'
    
    return 'unknown'


def validate_fields(result, doc_type):
    """Validate extracted fields"""
    errors = []
    
    if doc_type == 'invoice':
        # Validate GST
        for gst_field in ['company_gst', 'party_gst']:
            if result.get(gst_field):
                gst_clean = result[gst_field].replace(' ', '')
                result[f'{gst_field}_valid'] = len(gst_clean) == 15
                if len(gst_clean) != 15:
                    errors.append(f"Invalid GST length")
        
        # Validate amounts
        basic = result.get('basic_amount')
        total = result.get('total_amount')
        if basic and total:
            result['amount_valid'] = total >= basic
            if total < basic:
                errors.append("Total less than basic")
    
    return errors


def add_confidence(result, text, doc_type):
    """Calculate confidence score"""
    # Expected fields per document type
    expected_fields = {
        'invoice': ['bill_no', 'date', 'party_name', 'party_gst', 'basic_amount', 'total_amount'],
        'vehicle_rc': ['vehicle_number', 'chassis_number', 'engine_number', 'owner_name'],
        'insurance': ['vehicle_number', 'insurance_company', 'policy_number'],
        'puc': ['vehicle_number', 'valid_upto'],
        'driving_license': ['license_number', 'name', 'expiry_date'],
        'aadhaar': ['aadhaar_number', 'name'],
    }
    
    fields = expected_fields.get(doc_type, [])
    found = sum(1 for f in fields if result.get(f))
    result['confidence'] = int((found / len(fields)) * 100) if fields else 0
    
    return result


@app.route('/extract', methods=['POST'])
@app.route('/api/ocr/extract', methods=['POST'])
def extract_invoice():
    """Main endpoint - auto-detects document type"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Save temp file
    temp_path = tempfile.NamedTemporaryFile(delete=False).name
    file.save(temp_path)
    
    try:
        # Extract text
        text = extract_text(temp_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400
        
        # Detect document type
        doc_type = detect_document_type(text)
        
        # Parse based on type
        if doc_type == 'invoice':
            result = parse_invoice(text)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_rc(text)
        elif doc_type == 'insurance':
            result = parse_insurance(text)
        elif doc_type == 'puc':
            result = parse_puc(text)
        elif doc_type == 'driving_license':
            result = parse_driving_license(text)
        elif doc_type == 'aadhaar':
            result = parse_aadhaar(text)
        else:
            result = {'message': 'Unknown document type'}
        
        # Add metadata
        result['document_type'] = doc_type
        result = validate_fields(result, doc_type)
        result = add_confidence(result, text, doc_type)
        result['raw_text'] = text
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        try:
            os.remove(temp_path)
        except:
            pass


# Specific endpoints for each parser
@app.route('/extract/invoice', methods=['POST'])
def extract_invoice_specific():
    """Extract invoice only"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    temp_path = tempfile.NamedTemporaryFile(delete=False).name
    request.files['file'].save(temp_path)
    
    try:
        text = extract_text(temp_path)
        if not text:
            return jsonify({'error': 'Failed to extract'}), 400
        
        result = parse_invoice(text)
        result['document_type'] = 'invoice'
        result = validate_fields(result, 'invoice')
        result = add_confidence(result, text, 'invoice')
        
        return jsonify(result)
    finally:
        try:
            os.remove(temp_path)
        except:
            pass


@app.route('/extract/vehicle', methods=['POST'])
def extract_vehicle_specific():
    """Extract vehicle RC"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    temp_path = tempfile.NamedTemporaryFile(delete=False).name
    request.files['file'].save(temp_path)
    
    try:
        text = extract_text(temp_path)
        if not text:
            return jsonify({'error': 'Failed to extract'}), 400
        
        result = parse_vehicle_rc(text)
        result['document_type'] = 'vehicle_rc'
        
        return jsonify(result)
    finally:
        try:
            os.remove(temp_path)
        except:
            pass


@app.route('/extract/driver', methods=['POST'])
def extract_driver_specific():
    """Extract driver license"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    temp_path = tempfile.NamedTemporaryFile(delete=False).name
    request.files['file'].save(temp_path)
    
    try:
        text = extract_text(temp_path)
        if not text:
            return jsonify({'error': 'Failed to extract'}), 400
        
        result = parse_driving_license(text)
        result['document_type'] = 'driving_license'
        
        return jsonify(result)
    finally:
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
