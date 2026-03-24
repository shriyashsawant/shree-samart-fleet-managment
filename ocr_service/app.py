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

from ocr_engine import extract_with_local
from parsers.invoice_parser import parse_invoice
from parsers.vehicle_parser import parse_vehicle_document
from parsers.driver_parser import parse_driver_document
from utils.learning_memory import learn_correction, get_suggestions, get_corrections, apply_corrections, load_memory
from preprocessing.image_cleaner import preprocess_image, deskew_image

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Render specific optimizations 
on_render = os.environ.get('RENDER') == 'true'
if on_render:
    print("Running on Render: Optimization active (Tesseract + OCR.space mode)")

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'service': 'Shree Samarth OCR Microservice',
        'status': 'online',
        'documentation': '/api/ocr/extract via POST'
    })


from utils.ocr_utils import clean_ocr_text, detect_document_type


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
        'fitness': [('registration_number', 20), ('chassis_number', 20), ('engine_number', 20), ('certificate_expires', 20), ('fitness_validity', 20)],
        'permit': [('permit_number', 25), ('registration_number', 25), ('valid_from', 25), ('valid_to', 25)],
        'tax_receipt': [('registration_number', 25), ('tax_amount', 25), ('period_from', 25), ('period_to', 25)],
        'insurance': [('registration_number', 25), ('insurance_company', 25), ('expiry_date', 25), ('policy_number', 25)],
        'puc': [('registration_number', 25), ('puc_validity', 25), ('expiry_date', 25), ('emission_level', 25)],
        'driving_license': [('license_number', 25), ('name', 25), ('expiry_date', 25), ('state', 25)],
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
    
    # Extract the correct extension (e.g., .pdf, .jpg, .png)
    ext = os.path.splitext(file.filename)[1].lower()
    if not ext: ext = ".jpg"
    
    temp_filename = f"{uuid.uuid4()}{ext}"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        processed_path = preprocess_image(temp_path)
        from ocr_engine import extract_with_local, extract_with_ocr_space
        
        # 1. Try Tesseract first (assuming it's installed in production as per user)
        print("Attempting local Tesseract extraction...")
        text = extract_with_local(processed_path)
        engine = "tesseract"
        
        # 2. Try OCR.space if Tesseract failed or returned insufficient text
        if not text or len(text.strip()) < 50:
            print("Tesseract yielded insufficient results. Falling back to OCR.space...")
            text = extract_with_ocr_space(processed_path)
            engine = "ocr_space"
        
        if not text:
            return jsonify({'error': 'Failed to extract text using Tesseract or OCR.space. Please ensure the image is clear.'}), 400
        
        # Add metadata to result later
        
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
        elif doc_type == 'permit':
            result = parse_vehicle_document(text, 'permit')
        elif doc_type == 'tax_receipt':
            result = parse_vehicle_document(text, 'tax_receipt')
        elif doc_type == 'insurance':
            result = parse_vehicle_document(text, 'insurance')
        elif doc_type == 'puc':
            result = parse_vehicle_document(text, 'puc')
        else:
            result = {'message': 'Unknown document type', 'raw_text': text}
        
        result['document_type'] = doc_type
        result = validate_fields(result, doc_type)
        result = add_confidence(result, text, doc_type)
        result['raw_text'] = text
        result['engine'] = engine
        
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
