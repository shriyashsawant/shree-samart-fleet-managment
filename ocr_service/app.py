# OCR Microservice
# Routes to appropriate parser based on document type
# Using modular structure with parsers/, preprocessing/, utils/

from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import os
import tempfile
import uuid
import sys

# Add current directory to path for absolute imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ocr_engine import extract_with_paddle
from parsers.invoice_parser import parse_invoice
from parsers.vehicle_parser import parse_vehicle_document
from parsers.driver_parser import parse_driver_document
from utils.learning_memory import learn_correction, get_suggestions, get_corrections, apply_corrections, load_memory
from preprocessing.image_cleaner import preprocess_image, deskew_image

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Pre-load models on startup in the background
try:
    from ocr_engine import get_ocr_instance
    import threading
    threading.Thread(target=get_ocr_instance).start()
except: pass


def detect_document_type(text):
    """Detect document type from OCR text"""
    text_upper = text.upper()
    
    # Priority 1: Invoice / Sales Bill / Tax Invoice
    if any(k in text_upper for k in ['TAX INVOICE', 'SALES INVOICE', 'CASH MEMO', 'BILL NO', 'GSTIN']):
        return 'invoice'
    
    # Priority 2: Fitness Certificate (check BEFORE RC since fitness docs also have chassis)
    if any(k in text_upper for k in ['FITNESS CERTIFICATE', 'FORM 38', 'FORM.38', 'CERTIFICATE OF FITNESS', 'CERTIFICATEOFFITNESS']):
        return 'fitness'
    if any(k in text_upper for k in ['REGISTRATION CERTIFICATE', 'FORM 23', 'RC BOOK']):
        return 'vehicle_rc'
    if any(k in text_upper for k in ['DRIVING LICENCE', 'DRIVING LICENSE', 'DL NO']):
        return 'driving_license'
    if any(k in text_upper for k in ['AADHAAR', 'UIDAI', 'GOVERNMENT OF INDIA']):
        return 'aadhaar'
    
    # Priority 3: Commercial Documents
    if any(k in text_upper for k in ['PUC', 'POLLUTION', 'EMISSION']):
        return 'puc'
    if any(k in text_upper for k in ['INSURANCE', 'POLICY', 'PREMIUM', 'LIABILITY']):
        return 'insurance'
    if any(k in text_upper for k in ['TAX RECEIPT', 'ROAD TAX', 'VIVA']):
        return 'tax_receipt'
    # Permit detection
    if any(k in text_upper for k in ['PERMIT', 'GOODS PERMIT', 'TRANSPORT PERMIT', 'PERMIT NO', 'VALIDITY OF PERMIT', 'PERMIT IN RESPECT']):
        return 'permit'
    
    # FALLBACK: Keyword density search for invoice
    if len(re.findall(r'GST|CGST|SGST|IGST|AMOUNT|TOTAL', text_upper)) >= 2:
        return 'invoice'
    
    return 'unknown'


def validate_fields(result, doc_type):
    """Validate extracted fields with detailed errors"""
    errors = []
    field_validations = {}
    
    if doc_type == 'invoice':
        # Validate GST
        for gst_field in ['company_gst', 'party_gst']:
            if result.get(gst_field):
                gst_clean = str(result[gst_field]).replace(' ', '')
                is_valid = len(gst_clean) == 15
                field_validations[gst_field] = is_valid
        
        # Validate amounts
        basic = result.get('basic_amount')
        total = result.get('total_amount')
        if basic and total:
            try:
                is_valid = float(total) >= float(basic)
                field_validations['amount'] = is_valid
            except: pass
        
        # Validate date
        date_val = result.get('date')
        if date_val:
            date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
            is_valid = bool(re.search(date_pattern, str(date_val)))
            field_validations['date'] = is_valid
    
    elif doc_type in ['vehicle_rc', 'rc']:
        reg_num = result.get('registration_number')
        if reg_num:
            reg_pattern = r'^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}'
            is_valid = bool(re.match(reg_pattern, str(reg_num).upper()))
            field_validations['registration_number'] = is_valid
            
    result['validations'] = field_validations
    result['errors'] = errors
    return result


def add_confidence(result, text, doc_type):
    """Calculate confidence score per field"""
    expected_fields = {
        'invoice': [('bill_no', 15), ('date', 15), ('party_name', 15), ('party_gst', 15), ('total_amount', 15)],
        'vehicle_rc': [('registration_number', 25), ('chassis_number', 25), ('engine_number', 20)],
    }
    fields = expected_fields.get(doc_type, [])
    field_confidences = {}
    total_weight = 0
    weighted_score = 0
    for field, weight in fields:
        total_weight += weight
        if result.get(field):
            weighted_score += weight
            field_confidences[field] = 100
        else:
            field_confidences[field] = 0
    
    overall_confidence = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    result['confidence'] = overall_confidence
    result['field_confidences'] = field_confidences
    return result


@app.route('/extract', methods=['POST'])
@app.route('/api/ocr/extract', methods=['POST'])
def extract_document():
    """Main endpoint - auto-detects document type"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    company_gst = request.form.get('company_gst', '').strip() or None
    
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        processed_path = preprocess_image(temp_path)
        from ocr_engine import extract_with_ocr_space, extract_with_paddle
        
        text = extract_with_ocr_space(processed_path)
        
        if not text:
            print("OCR.space failed, trying local Paddle...")
            text = extract_with_paddle(processed_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text after multiple attempts'}), 400
        
        # Apply learned corrections from memory
        memory = load_memory()
        text = apply_corrections(text, memory)
        print("Applied learned corrections to OCR text.")

        doc_type = detect_document_type(text)
        
        if doc_type == 'invoice':
            result = parse_invoice(text, company_gst=company_gst)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_document(text, 'rc')
        elif doc_type == 'driving_license':
            result = parse_driver_document(text, 'driving_license')
        elif doc_type == 'fitness':
            result = parse_vehicle_document(text, 'fitness')
        else:
            result = {'message': 'Unknown document type', 'raw_text': text}
        
        result['document_type'] = doc_type
        result = validate_fields(result, doc_type)
        result = add_confidence(result, text, doc_type)
        result['raw_text'] = text
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try: os.remove(temp_path)
        except: pass


@app.route('/health', methods=['GET'])
@app.route('/api/ocr/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
