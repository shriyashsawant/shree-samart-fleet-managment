# OCR Microservice
# Routes to appropriate parser based on document type
# Using modular structure with parsers/, preprocessing/, utils/

from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import os
import tempfile
import uuid

from ocr_engine import extract_text
from parsers.invoice_parser import parse_invoice
from parsers.vehicle_parser import parse_vehicle_document
from parsers.driver_parser import parse_driver_document
from utils.learning_memory import learn_correction, get_suggestions, get_corrections, apply_corrections, load_memory
from preprocessing.image_cleaner import preprocess_image, deskew_image

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
    """Validate extracted fields with detailed errors"""
    errors = []
    field_validations = {}
    
    if doc_type == 'invoice':
        # Validate GST - must be 15 characters
        for gst_field in ['company_gst', 'party_gst']:
            if result.get(gst_field):
                gst_clean = result[gst_field].replace(' ', '')
                is_valid = len(gst_clean) == 15
                field_validations[gst_field] = is_valid
                if not is_valid:
                    errors.append(f"{gst_field} must be 15 characters")
        
        # Validate amounts - Total > Basic
        basic = result.get('basic_amount')
        total = result.get('total_amount')
        if basic and total:
            is_valid = total >= basic
            field_validations['amount'] = is_valid
            if not is_valid:
                errors.append("Total must be greater than or equal to Basic")
        
        # Validate date format
        date_val = result.get('date')
        if date_val:
            import re
            date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
            is_valid = bool(re.match(date_pattern, date_val))
            field_validations['date'] = is_valid
            if not is_valid:
                errors.append("Invalid date format")
    
    elif doc_type in ['vehicle_rc', 'rc']:
        # Validate registration number format (MH12AB1234)
        reg_num = result.get('registration_number')
        if reg_num:
            import re
            reg_pattern = r'^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}


def add_confidence(result, text, doc_type):
    """Calculate confidence score per field"""
    # Expected fields per document type with weights
    expected_fields = {
        'invoice': [
            ('bill_no', 15),
            ('date', 15),
            ('party_name', 15),
            ('party_gst', 15),
            ('basic_amount', 15),
            ('cgst_amount', 5),
            ('sgst_amount', 5),
            ('total_amount', 15),
        ],
        'vehicle_rc': [
            ('registration_number', 25),
            ('chassis_number', 25),
            ('engine_number', 20),
            ('owner_name', 15),
            ('make_model', 10),
            ('fitness_validity', 5),
        ],
        'insurance': [
            ('registration_number', 20),
            ('insurance_company', 20),
            ('policy_number', 20),
            ('valid_to', 20),
            ('sum_insured', 20),
        ],
        'puc': [
            ('registration_number', 30),
            ('valid_to', 30),
            ('puc_number', 20),
            ('emission_level', 20),
        ],
        'driving_license': [
            ('license_number', 30),
            ('driver_name', 20),
            ('license_expiry', 25),
            ('father_name', 10),
            ('address', 10),
            ('license_type', 5),
        ],
        'aadhaar': [
            ('aadhaar_number', 35),
            ('name', 25),
            ('dob', 15),
            ('gender', 10),
            ('address', 15),
        ],
    }
    
    fields = expected_fields.get(doc_type, [])
    
    # Calculate per-field confidence
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
    
    # Overall confidence
    overall_confidence = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    
    result['confidence'] = overall_confidence
    result['field_confidences'] = field_confidences
    
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
    
    # Save temp file with UUID for security
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        # Step 1: Preprocess image (grayscale, threshold, denoise, deskew)
        processed_path = preprocess_image(temp_path)
        if processed_path != temp_path:
            # Deskew if needed
            processed_path = deskew_image(processed_path)
        
        # Step 2: Extract text using OCR
        text = extract_text(processed_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400
        
        # Detect document type
        doc_type = detect_document_type(text)
        
        # Parse based on type
        if doc_type == 'invoice':
            result = parse_invoice(text)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_document(text, 'rc')
        elif doc_type == 'insurance':
            result = parse_vehicle_document(text, 'insurance')
        elif doc_type == 'puc':
            result = parse_vehicle_document(text, 'puc')
        elif doc_type == 'driving_license':
            result = parse_driver_document(text, 'driving_license')
        elif doc_type == 'aadhaar':
            result = parse_driver_document(text, 'aadhaar')
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
        # Clean up temp files
        try:
            os.remove(temp_path)
        except:
            pass
        try:
            if 'processed_path' in locals() and processed_path != temp_path:
                os.remove(processed_path)
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
        
        result = parse_vehicle_document(text, 'rc')
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
        
        result = parse_driver_document(text, 'driving_license')
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


# Learning Memory API
@app.route('/api/ocr/learn', methods=['POST'])
def learn_correction_api():
    """Learn a correction from user input"""
    data = request.get_json()
    
    wrong_text = data.get('wrong')
    correct_text = data.get('correct')
    field_type = data.get('field_type')
    
    if not wrong_text or not correct_text:
        return jsonify({'error': 'Missing wrong or correct text'}), 400
    
    success = learn_correction(wrong_text, correct_text, field_type)
    
    return jsonify({'success': success, 'message': 'Correction learned' if success else 'No change'})


@app.route('/api/ocr/suggestions', methods=['GET'])
def get_suggestions_api():
    """Get autocomplete suggestions"""
    field_type = request.args.get('field_type', '')
    prefix = request.args.get('prefix', '')
    
    memory = load_memory()
    suggestions = get_suggestions(field_type, prefix, memory)
    
    return jsonify({'suggestions': suggestions})


@app.route('/api/ocr/corrections', methods=['GET'])
def get_corrections_api():
    """Get all learned corrections"""
    corrections = get_corrections()
    return jsonify({'corrections': corrections})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

            is_valid = bool(re.match(reg_pattern, reg_num.upper()))
            field_validations['registration_number'] = is_valid
            if not is_valid:
                errors.append("Invalid registration number format")
        
        # Validate chassis number (should be 17 chars)
        chassis = result.get('chassis_number')
        if chassis:
            is_valid = len(chassis) >= 10
            field_validations['chassis_number'] = is_valid
            if not is_valid:
                errors.append("Invalid chassis number")
    
    elif doc_type == 'insurance':
        # Validate policy number
        policy = result.get('policy_number')
        if policy:
            field_validations['policy_number'] = len(policy) > 0
        
        # Validate dates
        valid_to = result.get('valid_to')
        if valid_to:
            import re
            date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
            is_valid = bool(re.match(date_pattern, str(valid_to)))
            field_validations['valid_to'] = is_valid
    
    elif doc_type == 'driving_license':
        # Validate license number format
        license_num = result.get('license_number')
        if license_num:
            import re
            # DL format: 2 letters + 13 digits
            dl_pattern = r'^[A-Z]{2}\d{13}


def add_confidence(result, text, doc_type):
    """Calculate confidence score per field"""
    # Expected fields per document type with weights
    expected_fields = {
        'invoice': [
            ('bill_no', 15),
            ('date', 15),
            ('party_name', 15),
            ('party_gst', 15),
            ('basic_amount', 15),
            ('cgst_amount', 5),
            ('sgst_amount', 5),
            ('total_amount', 15),
        ],
        'vehicle_rc': [
            ('registration_number', 25),
            ('chassis_number', 25),
            ('engine_number', 20),
            ('owner_name', 15),
            ('make_model', 10),
            ('fitness_validity', 5),
        ],
        'insurance': [
            ('registration_number', 20),
            ('insurance_company', 20),
            ('policy_number', 20),
            ('valid_to', 20),
            ('sum_insured', 20),
        ],
        'puc': [
            ('registration_number', 30),
            ('valid_to', 30),
            ('puc_number', 20),
            ('emission_level', 20),
        ],
        'driving_license': [
            ('license_number', 30),
            ('driver_name', 20),
            ('license_expiry', 25),
            ('father_name', 10),
            ('address', 10),
            ('license_type', 5),
        ],
        'aadhaar': [
            ('aadhaar_number', 35),
            ('name', 25),
            ('dob', 15),
            ('gender', 10),
            ('address', 15),
        ],
    }
    
    fields = expected_fields.get(doc_type, [])
    
    # Calculate per-field confidence
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
    
    # Overall confidence
    overall_confidence = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    
    result['confidence'] = overall_confidence
    result['field_confidences'] = field_confidences
    
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
    
    # Save temp file with UUID for security
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        # Step 1: Preprocess image (grayscale, threshold, denoise, deskew)
        processed_path = preprocess_image(temp_path)
        if processed_path != temp_path:
            # Deskew if needed
            processed_path = deskew_image(processed_path)
        
        # Step 2: Extract text using OCR
        text = extract_text(processed_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400
        
        # Detect document type
        doc_type = detect_document_type(text)
        
        # Parse based on type
        if doc_type == 'invoice':
            result = parse_invoice(text)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_document(text, 'rc')
        elif doc_type == 'insurance':
            result = parse_vehicle_document(text, 'insurance')
        elif doc_type == 'puc':
            result = parse_vehicle_document(text, 'puc')
        elif doc_type == 'driving_license':
            result = parse_driver_document(text, 'driving_license')
        elif doc_type == 'aadhaar':
            result = parse_driver_document(text, 'aadhaar')
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
        # Clean up temp files
        try:
            os.remove(temp_path)
        except:
            pass
        try:
            if 'processed_path' in locals() and processed_path != temp_path:
                os.remove(processed_path)
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
        
        result = parse_vehicle_document(text, 'rc')
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
        
        result = parse_driver_document(text, 'driving_license')
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


# Learning Memory API
@app.route('/api/ocr/learn', methods=['POST'])
def learn_correction_api():
    """Learn a correction from user input"""
    data = request.get_json()
    
    wrong_text = data.get('wrong')
    correct_text = data.get('correct')
    field_type = data.get('field_type')
    
    if not wrong_text or not correct_text:
        return jsonify({'error': 'Missing wrong or correct text'}), 400
    
    success = learn_correction(wrong_text, correct_text, field_type)
    
    return jsonify({'success': success, 'message': 'Correction learned' if success else 'No change'})


@app.route('/api/ocr/suggestions', methods=['GET'])
def get_suggestions_api():
    """Get autocomplete suggestions"""
    field_type = request.args.get('field_type', '')
    prefix = request.args.get('prefix', '')
    
    memory = load_memory()
    suggestions = get_suggestions(field_type, prefix, memory)
    
    return jsonify({'suggestions': suggestions})


@app.route('/api/ocr/corrections', methods=['GET'])
def get_corrections_api():
    """Get all learned corrections"""
    corrections = get_corrections()
    return jsonify({'corrections': corrections})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

            is_valid = bool(re.match(dl_pattern, license_num.upper()))
            field_validations['license_number'] = is_valid
            if not is_valid:
                errors.append("Invalid license number format")
    
    elif doc_type == 'aadhaar':
        # Validate aadhaar number (12 digits)
        aadhaar = result.get('aadhaar_number')
        if aadhaar:
            is_valid = len(aadhaar.replace(' ', '')) == 12 and aadhaar.replace(' ', '').isdigit()
            field_validations['aadhaar_number'] = is_valid
            if not is_valid:
                errors.append("Invalid aadhaar number - must be 12 digits")
    
    # Add validation results to result
    result['validations'] = field_validations
    result['errors'] = errors
    
    return result


def add_confidence(result, text, doc_type):
    """Calculate confidence score per field"""
    # Expected fields per document type with weights
    expected_fields = {
        'invoice': [
            ('bill_no', 15),
            ('date', 15),
            ('party_name', 15),
            ('party_gst', 15),
            ('basic_amount', 15),
            ('cgst_amount', 5),
            ('sgst_amount', 5),
            ('total_amount', 15),
        ],
        'vehicle_rc': [
            ('registration_number', 25),
            ('chassis_number', 25),
            ('engine_number', 20),
            ('owner_name', 15),
            ('make_model', 10),
            ('fitness_validity', 5),
        ],
        'insurance': [
            ('registration_number', 20),
            ('insurance_company', 20),
            ('policy_number', 20),
            ('valid_to', 20),
            ('sum_insured', 20),
        ],
        'puc': [
            ('registration_number', 30),
            ('valid_to', 30),
            ('puc_number', 20),
            ('emission_level', 20),
        ],
        'driving_license': [
            ('license_number', 30),
            ('driver_name', 20),
            ('license_expiry', 25),
            ('father_name', 10),
            ('address', 10),
            ('license_type', 5),
        ],
        'aadhaar': [
            ('aadhaar_number', 35),
            ('name', 25),
            ('dob', 15),
            ('gender', 10),
            ('address', 15),
        ],
    }
    
    fields = expected_fields.get(doc_type, [])
    
    # Calculate per-field confidence
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
    
    # Overall confidence
    overall_confidence = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    
    result['confidence'] = overall_confidence
    result['field_confidences'] = field_confidences
    
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
    
    # Save temp file with UUID for security
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        # Step 1: Preprocess image (grayscale, threshold, denoise, deskew)
        processed_path = preprocess_image(temp_path)
        if processed_path != temp_path:
            # Deskew if needed
            processed_path = deskew_image(processed_path)
        
        # Step 2: Extract text using OCR
        text = extract_text(processed_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400
        
        # Detect document type
        doc_type = detect_document_type(text)
        
        # Parse based on type
        if doc_type == 'invoice':
            result = parse_invoice(text)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_document(text, 'rc')
        elif doc_type == 'insurance':
            result = parse_vehicle_document(text, 'insurance')
        elif doc_type == 'puc':
            result = parse_vehicle_document(text, 'puc')
        elif doc_type == 'driving_license':
            result = parse_driver_document(text, 'driving_license')
        elif doc_type == 'aadhaar':
            result = parse_driver_document(text, 'aadhaar')
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
        # Clean up temp files
        try:
            os.remove(temp_path)
        except:
            pass
        try:
            if 'processed_path' in locals() and processed_path != temp_path:
                os.remove(processed_path)
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
        
        result = parse_vehicle_document(text, 'rc')
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
        
        result = parse_driver_document(text, 'driving_license')
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


# Learning Memory API
@app.route('/api/ocr/learn', methods=['POST'])
def learn_correction_api():
    """Learn a correction from user input"""
    data = request.get_json()
    
    wrong_text = data.get('wrong')
    correct_text = data.get('correct')
    field_type = data.get('field_type')
    
    if not wrong_text or not correct_text:
        return jsonify({'error': 'Missing wrong or correct text'}), 400
    
    success = learn_correction(wrong_text, correct_text, field_type)
    
    return jsonify({'success': success, 'message': 'Correction learned' if success else 'No change'})


@app.route('/api/ocr/suggestions', methods=['GET'])
def get_suggestions_api():
    """Get autocomplete suggestions"""
    field_type = request.args.get('field_type', '')
    prefix = request.args.get('prefix', '')
    
    memory = load_memory()
    suggestions = get_suggestions(field_type, prefix, memory)
    
    return jsonify({'suggestions': suggestions})


@app.route('/api/ocr/corrections', methods=['GET'])
def get_corrections_api():
    """Get all learned corrections"""
    corrections = get_corrections()
    return jsonify({'corrections': corrections})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

            is_valid = bool(re.match(reg_pattern, reg_num.upper()))
            field_validations['registration_number'] = is_valid
            if not is_valid:
                errors.append("Invalid registration number format")
        
        # Validate chassis number (should be 17 chars)
        chassis = result.get('chassis_number')
        if chassis:
            is_valid = len(chassis) >= 10
            field_validations['chassis_number'] = is_valid
            if not is_valid:
                errors.append("Invalid chassis number")
    
    elif doc_type == 'insurance':
        # Validate policy number
        policy = result.get('policy_number')
        if policy:
            field_validations['policy_number'] = len(policy) > 0
        
        # Validate dates
        valid_to = result.get('valid_to')
        if valid_to:
            import re
            date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
            is_valid = bool(re.match(date_pattern, str(valid_to)))
            field_validations['valid_to'] = is_valid
    
    elif doc_type == 'driving_license':
        # Validate license number format
        license_num = result.get('license_number')
        if license_num:
            import re
            # DL format: 2 letters + 13 digits
            dl_pattern = r'^[A-Z]{2}\d{13}


def add_confidence(result, text, doc_type):
    """Calculate confidence score per field"""
    # Expected fields per document type with weights
    expected_fields = {
        'invoice': [
            ('bill_no', 15),
            ('date', 15),
            ('party_name', 15),
            ('party_gst', 15),
            ('basic_amount', 15),
            ('cgst_amount', 5),
            ('sgst_amount', 5),
            ('total_amount', 15),
        ],
        'vehicle_rc': [
            ('registration_number', 25),
            ('chassis_number', 25),
            ('engine_number', 20),
            ('owner_name', 15),
            ('make_model', 10),
            ('fitness_validity', 5),
        ],
        'insurance': [
            ('registration_number', 20),
            ('insurance_company', 20),
            ('policy_number', 20),
            ('valid_to', 20),
            ('sum_insured', 20),
        ],
        'puc': [
            ('registration_number', 30),
            ('valid_to', 30),
            ('puc_number', 20),
            ('emission_level', 20),
        ],
        'driving_license': [
            ('license_number', 30),
            ('driver_name', 20),
            ('license_expiry', 25),
            ('father_name', 10),
            ('address', 10),
            ('license_type', 5),
        ],
        'aadhaar': [
            ('aadhaar_number', 35),
            ('name', 25),
            ('dob', 15),
            ('gender', 10),
            ('address', 15),
        ],
    }
    
    fields = expected_fields.get(doc_type, [])
    
    # Calculate per-field confidence
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
    
    # Overall confidence
    overall_confidence = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    
    result['confidence'] = overall_confidence
    result['field_confidences'] = field_confidences
    
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
    
    # Save temp file with UUID for security
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        # Step 1: Preprocess image (grayscale, threshold, denoise, deskew)
        processed_path = preprocess_image(temp_path)
        if processed_path != temp_path:
            # Deskew if needed
            processed_path = deskew_image(processed_path)
        
        # Step 2: Extract text using OCR
        text = extract_text(processed_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400
        
        # Detect document type
        doc_type = detect_document_type(text)
        
        # Parse based on type
        if doc_type == 'invoice':
            result = parse_invoice(text)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_document(text, 'rc')
        elif doc_type == 'insurance':
            result = parse_vehicle_document(text, 'insurance')
        elif doc_type == 'puc':
            result = parse_vehicle_document(text, 'puc')
        elif doc_type == 'driving_license':
            result = parse_driver_document(text, 'driving_license')
        elif doc_type == 'aadhaar':
            result = parse_driver_document(text, 'aadhaar')
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
        # Clean up temp files
        try:
            os.remove(temp_path)
        except:
            pass
        try:
            if 'processed_path' in locals() and processed_path != temp_path:
                os.remove(processed_path)
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
        
        result = parse_vehicle_document(text, 'rc')
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
        
        result = parse_driver_document(text, 'driving_license')
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


# Learning Memory API
@app.route('/api/ocr/learn', methods=['POST'])
def learn_correction_api():
    """Learn a correction from user input"""
    data = request.get_json()
    
    wrong_text = data.get('wrong')
    correct_text = data.get('correct')
    field_type = data.get('field_type')
    
    if not wrong_text or not correct_text:
        return jsonify({'error': 'Missing wrong or correct text'}), 400
    
    success = learn_correction(wrong_text, correct_text, field_type)
    
    return jsonify({'success': success, 'message': 'Correction learned' if success else 'No change'})


@app.route('/api/ocr/suggestions', methods=['GET'])
def get_suggestions_api():
    """Get autocomplete suggestions"""
    field_type = request.args.get('field_type', '')
    prefix = request.args.get('prefix', '')
    
    memory = load_memory()
    suggestions = get_suggestions(field_type, prefix, memory)
    
    return jsonify({'suggestions': suggestions})


@app.route('/api/ocr/corrections', methods=['GET'])
def get_corrections_api():
    """Get all learned corrections"""
    corrections = get_corrections()
    return jsonify({'corrections': corrections})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

            is_valid = bool(re.match(reg_pattern, reg_num.upper()))
            field_validations['registration_number'] = is_valid
            if not is_valid:
                errors.append("Invalid registration number format")
        
        # Validate chassis number (should be 17 chars)
        chassis = result.get('chassis_number')
        if chassis:
            is_valid = len(chassis) >= 10
            field_validations['chassis_number'] = is_valid
            if not is_valid:
                errors.append("Invalid chassis number")
    
    elif doc_type == 'insurance':
        # Validate policy number
        policy = result.get('policy_number')
        if policy:
            field_validations['policy_number'] = len(policy) > 0
        
        # Validate dates
        valid_to = result.get('valid_to')
        if valid_to:
            import re
            date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
            is_valid = bool(re.match(date_pattern, str(valid_to)))
            field_validations['valid_to'] = is_valid
    
    elif doc_type == 'driving_license':
        # Validate license number format
        license_num = result.get('license_number')
        if license_num:
            import re
            # DL format: 2 letters + 13 digits
            dl_pattern = r'^[A-Z]{2}\d{13}


def add_confidence(result, text, doc_type):
    """Calculate confidence score per field"""
    # Expected fields per document type with weights
    expected_fields = {
        'invoice': [
            ('bill_no', 15),
            ('date', 15),
            ('party_name', 15),
            ('party_gst', 15),
            ('basic_amount', 15),
            ('cgst_amount', 5),
            ('sgst_amount', 5),
            ('total_amount', 15),
        ],
        'vehicle_rc': [
            ('registration_number', 25),
            ('chassis_number', 25),
            ('engine_number', 20),
            ('owner_name', 15),
            ('make_model', 10),
            ('fitness_validity', 5),
        ],
        'insurance': [
            ('registration_number', 20),
            ('insurance_company', 20),
            ('policy_number', 20),
            ('valid_to', 20),
            ('sum_insured', 20),
        ],
        'puc': [
            ('registration_number', 30),
            ('valid_to', 30),
            ('puc_number', 20),
            ('emission_level', 20),
        ],
        'driving_license': [
            ('license_number', 30),
            ('driver_name', 20),
            ('license_expiry', 25),
            ('father_name', 10),
            ('address', 10),
            ('license_type', 5),
        ],
        'aadhaar': [
            ('aadhaar_number', 35),
            ('name', 25),
            ('dob', 15),
            ('gender', 10),
            ('address', 15),
        ],
    }
    
    fields = expected_fields.get(doc_type, [])
    
    # Calculate per-field confidence
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
    
    # Overall confidence
    overall_confidence = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    
    result['confidence'] = overall_confidence
    result['field_confidences'] = field_confidences
    
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
    
    # Save temp file with UUID for security
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        # Step 1: Preprocess image (grayscale, threshold, denoise, deskew)
        processed_path = preprocess_image(temp_path)
        if processed_path != temp_path:
            # Deskew if needed
            processed_path = deskew_image(processed_path)
        
        # Step 2: Extract text using OCR
        text = extract_text(processed_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400
        
        # Detect document type
        doc_type = detect_document_type(text)
        
        # Parse based on type
        if doc_type == 'invoice':
            result = parse_invoice(text)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_document(text, 'rc')
        elif doc_type == 'insurance':
            result = parse_vehicle_document(text, 'insurance')
        elif doc_type == 'puc':
            result = parse_vehicle_document(text, 'puc')
        elif doc_type == 'driving_license':
            result = parse_driver_document(text, 'driving_license')
        elif doc_type == 'aadhaar':
            result = parse_driver_document(text, 'aadhaar')
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
        # Clean up temp files
        try:
            os.remove(temp_path)
        except:
            pass
        try:
            if 'processed_path' in locals() and processed_path != temp_path:
                os.remove(processed_path)
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
        
        result = parse_vehicle_document(text, 'rc')
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
        
        result = parse_driver_document(text, 'driving_license')
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


# Learning Memory API
@app.route('/api/ocr/learn', methods=['POST'])
def learn_correction_api():
    """Learn a correction from user input"""
    data = request.get_json()
    
    wrong_text = data.get('wrong')
    correct_text = data.get('correct')
    field_type = data.get('field_type')
    
    if not wrong_text or not correct_text:
        return jsonify({'error': 'Missing wrong or correct text'}), 400
    
    success = learn_correction(wrong_text, correct_text, field_type)
    
    return jsonify({'success': success, 'message': 'Correction learned' if success else 'No change'})


@app.route('/api/ocr/suggestions', methods=['GET'])
def get_suggestions_api():
    """Get autocomplete suggestions"""
    field_type = request.args.get('field_type', '')
    prefix = request.args.get('prefix', '')
    
    memory = load_memory()
    suggestions = get_suggestions(field_type, prefix, memory)
    
    return jsonify({'suggestions': suggestions})


@app.route('/api/ocr/corrections', methods=['GET'])
def get_corrections_api():
    """Get all learned corrections"""
    corrections = get_corrections()
    return jsonify({'corrections': corrections})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

            is_valid = bool(re.match(dl_pattern, license_num.upper()))
            field_validations['license_number'] = is_valid
            if not is_valid:
                errors.append("Invalid license number format")
    
    elif doc_type == 'aadhaar':
        # Validate aadhaar number (12 digits)
        aadhaar = result.get('aadhaar_number')
        if aadhaar:
            is_valid = len(aadhaar.replace(' ', '')) == 12 and aadhaar.replace(' ', '').isdigit()
            field_validations['aadhaar_number'] = is_valid
            if not is_valid:
                errors.append("Invalid aadhaar number - must be 12 digits")
    
    # Add validation results to result
    result['validations'] = field_validations
    result['errors'] = errors
    
    return result


def add_confidence(result, text, doc_type):
    """Calculate confidence score per field"""
    # Expected fields per document type with weights
    expected_fields = {
        'invoice': [
            ('bill_no', 15),
            ('date', 15),
            ('party_name', 15),
            ('party_gst', 15),
            ('basic_amount', 15),
            ('cgst_amount', 5),
            ('sgst_amount', 5),
            ('total_amount', 15),
        ],
        'vehicle_rc': [
            ('registration_number', 25),
            ('chassis_number', 25),
            ('engine_number', 20),
            ('owner_name', 15),
            ('make_model', 10),
            ('fitness_validity', 5),
        ],
        'insurance': [
            ('registration_number', 20),
            ('insurance_company', 20),
            ('policy_number', 20),
            ('valid_to', 20),
            ('sum_insured', 20),
        ],
        'puc': [
            ('registration_number', 30),
            ('valid_to', 30),
            ('puc_number', 20),
            ('emission_level', 20),
        ],
        'driving_license': [
            ('license_number', 30),
            ('driver_name', 20),
            ('license_expiry', 25),
            ('father_name', 10),
            ('address', 10),
            ('license_type', 5),
        ],
        'aadhaar': [
            ('aadhaar_number', 35),
            ('name', 25),
            ('dob', 15),
            ('gender', 10),
            ('address', 15),
        ],
    }
    
    fields = expected_fields.get(doc_type, [])
    
    # Calculate per-field confidence
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
    
    # Overall confidence
    overall_confidence = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    
    result['confidence'] = overall_confidence
    result['field_confidences'] = field_confidences
    
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
    
    # Save temp file with UUID for security
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        # Step 1: Preprocess image (grayscale, threshold, denoise, deskew)
        processed_path = preprocess_image(temp_path)
        if processed_path != temp_path:
            # Deskew if needed
            processed_path = deskew_image(processed_path)
        
        # Step 2: Extract text using OCR
        text = extract_text(processed_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400
        
        # Detect document type
        doc_type = detect_document_type(text)
        
        # Parse based on type
        if doc_type == 'invoice':
            result = parse_invoice(text)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_document(text, 'rc')
        elif doc_type == 'insurance':
            result = parse_vehicle_document(text, 'insurance')
        elif doc_type == 'puc':
            result = parse_vehicle_document(text, 'puc')
        elif doc_type == 'driving_license':
            result = parse_driver_document(text, 'driving_license')
        elif doc_type == 'aadhaar':
            result = parse_driver_document(text, 'aadhaar')
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
        # Clean up temp files
        try:
            os.remove(temp_path)
        except:
            pass
        try:
            if 'processed_path' in locals() and processed_path != temp_path:
                os.remove(processed_path)
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
        
        result = parse_vehicle_document(text, 'rc')
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
        
        result = parse_driver_document(text, 'driving_license')
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


# Learning Memory API
@app.route('/api/ocr/learn', methods=['POST'])
def learn_correction_api():
    """Learn a correction from user input"""
    data = request.get_json()
    
    wrong_text = data.get('wrong')
    correct_text = data.get('correct')
    field_type = data.get('field_type')
    
    if not wrong_text or not correct_text:
        return jsonify({'error': 'Missing wrong or correct text'}), 400
    
    success = learn_correction(wrong_text, correct_text, field_type)
    
    return jsonify({'success': success, 'message': 'Correction learned' if success else 'No change'})


@app.route('/api/ocr/suggestions', methods=['GET'])
def get_suggestions_api():
    """Get autocomplete suggestions"""
    field_type = request.args.get('field_type', '')
    prefix = request.args.get('prefix', '')
    
    memory = load_memory()
    suggestions = get_suggestions(field_type, prefix, memory)
    
    return jsonify({'suggestions': suggestions})


@app.route('/api/ocr/corrections', methods=['GET'])
def get_corrections_api():
    """Get all learned corrections"""
    corrections = get_corrections()
    return jsonify({'corrections': corrections})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

            is_valid = bool(re.match(dl_pattern, license_num.upper()))
            field_validations['license_number'] = is_valid
            if not is_valid:
                errors.append("Invalid license number format")
    
    elif doc_type == 'aadhaar':
        # Validate aadhaar number (12 digits)
        aadhaar = result.get('aadhaar_number')
        if aadhaar:
            is_valid = len(aadhaar.replace(' ', '')) == 12 and aadhaar.replace(' ', '').isdigit()
            field_validations['aadhaar_number'] = is_valid
            if not is_valid:
                errors.append("Invalid aadhaar number - must be 12 digits")


def add_confidence(result, text, doc_type):
    """Calculate confidence score per field"""
    # Expected fields per document type with weights
    expected_fields = {
        'invoice': [
            ('bill_no', 15),
            ('date', 15),
            ('party_name', 15),
            ('party_gst', 15),
            ('basic_amount', 15),
            ('cgst_amount', 5),
            ('sgst_amount', 5),
            ('total_amount', 15),
        ],
        'vehicle_rc': [
            ('registration_number', 25),
            ('chassis_number', 25),
            ('engine_number', 20),
            ('owner_name', 15),
            ('make_model', 10),
            ('fitness_validity', 5),
        ],
        'insurance': [
            ('registration_number', 20),
            ('insurance_company', 20),
            ('policy_number', 20),
            ('valid_to', 20),
            ('sum_insured', 20),
        ],
        'puc': [
            ('registration_number', 30),
            ('valid_to', 30),
            ('puc_number', 20),
            ('emission_level', 20),
        ],
        'driving_license': [
            ('license_number', 30),
            ('driver_name', 20),
            ('license_expiry', 25),
            ('father_name', 10),
            ('address', 10),
            ('license_type', 5),
        ],
        'aadhaar': [
            ('aadhaar_number', 35),
            ('name', 25),
            ('dob', 15),
            ('gender', 10),
            ('address', 15),
        ],
    }
    
    fields = expected_fields.get(doc_type, [])
    
    # Calculate per-field confidence
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
    
    # Overall confidence
    overall_confidence = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    
    result['confidence'] = overall_confidence
    result['field_confidences'] = field_confidences
    
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
    
    # Save temp file with UUID for security
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        # Step 1: Preprocess image (grayscale, threshold, denoise, deskew)
        processed_path = preprocess_image(temp_path)
        if processed_path != temp_path:
            # Deskew if needed
            processed_path = deskew_image(processed_path)
        
        # Step 2: Extract text using OCR
        text = extract_text(processed_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400
        
        # Detect document type
        doc_type = detect_document_type(text)
        
        # Parse based on type
        if doc_type == 'invoice':
            result = parse_invoice(text)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_document(text, 'rc')
        elif doc_type == 'insurance':
            result = parse_vehicle_document(text, 'insurance')
        elif doc_type == 'puc':
            result = parse_vehicle_document(text, 'puc')
        elif doc_type == 'driving_license':
            result = parse_driver_document(text, 'driving_license')
        elif doc_type == 'aadhaar':
            result = parse_driver_document(text, 'aadhaar')
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
        # Clean up temp files
        try:
            os.remove(temp_path)
        except:
            pass
        try:
            if 'processed_path' in locals() and processed_path != temp_path:
                os.remove(processed_path)
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
        
        result = parse_vehicle_document(text, 'rc')
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
        
        result = parse_driver_document(text, 'driving_license')
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


# Learning Memory API
@app.route('/api/ocr/learn', methods=['POST'])
def learn_correction_api():
    """Learn a correction from user input"""
    data = request.get_json()
    
    wrong_text = data.get('wrong')
    correct_text = data.get('correct')
    field_type = data.get('field_type')
    
    if not wrong_text or not correct_text:
        return jsonify({'error': 'Missing wrong or correct text'}), 400
    
    success = learn_correction(wrong_text, correct_text, field_type)
    
    return jsonify({'success': success, 'message': 'Correction learned' if success else 'No change'})


@app.route('/api/ocr/suggestions', methods=['GET'])
def get_suggestions_api():
    """Get autocomplete suggestions"""
    field_type = request.args.get('field_type', '')
    prefix = request.args.get('prefix', '')
    
    memory = load_memory()
    suggestions = get_suggestions(field_type, prefix, memory)
    
    return jsonify({'suggestions': suggestions})


@app.route('/api/ocr/corrections', methods=['GET'])
def get_corrections_api():
    """Get all learned corrections"""
    corrections = get_corrections()
    return jsonify({'corrections': corrections})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

            is_valid = bool(re.match(reg_pattern, reg_num.upper()))
            field_validations['registration_number'] = is_valid
            if not is_valid:
                errors.append("Invalid registration number format")
        
        # Validate chassis number (should be 17 chars)
        chassis = result.get('chassis_number')
        if chassis:
            is_valid = len(chassis) >= 10
            field_validations['chassis_number'] = is_valid
            if not is_valid:
                errors.append("Invalid chassis number")
    
    elif doc_type == 'insurance':
        # Validate policy number
        policy = result.get('policy_number')
        if policy:
            field_validations['policy_number'] = len(policy) > 0
        
        # Validate dates
        valid_to = result.get('valid_to')
        if valid_to:
            import re
            date_pattern = r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
            is_valid = bool(re.match(date_pattern, str(valid_to)))
            field_validations['valid_to'] = is_valid
    
    elif doc_type == 'driving_license':
        # Validate license number format
        license_num = result.get('license_number')
        if license_num:
            import re
            # DL format: 2 letters + 13 digits
            dl_pattern = r'^[A-Z]{2}\d{13}


def add_confidence(result, text, doc_type):
    """Calculate confidence score per field"""
    # Expected fields per document type with weights
    expected_fields = {
        'invoice': [
            ('bill_no', 15),
            ('date', 15),
            ('party_name', 15),
            ('party_gst', 15),
            ('basic_amount', 15),
            ('cgst_amount', 5),
            ('sgst_amount', 5),
            ('total_amount', 15),
        ],
        'vehicle_rc': [
            ('registration_number', 25),
            ('chassis_number', 25),
            ('engine_number', 20),
            ('owner_name', 15),
            ('make_model', 10),
            ('fitness_validity', 5),
        ],
        'insurance': [
            ('registration_number', 20),
            ('insurance_company', 20),
            ('policy_number', 20),
            ('valid_to', 20),
            ('sum_insured', 20),
        ],
        'puc': [
            ('registration_number', 30),
            ('valid_to', 30),
            ('puc_number', 20),
            ('emission_level', 20),
        ],
        'driving_license': [
            ('license_number', 30),
            ('driver_name', 20),
            ('license_expiry', 25),
            ('father_name', 10),
            ('address', 10),
            ('license_type', 5),
        ],
        'aadhaar': [
            ('aadhaar_number', 35),
            ('name', 25),
            ('dob', 15),
            ('gender', 10),
            ('address', 15),
        ],
    }
    
    fields = expected_fields.get(doc_type, [])
    
    # Calculate per-field confidence
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
    
    # Overall confidence
    overall_confidence = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    
    result['confidence'] = overall_confidence
    result['field_confidences'] = field_confidences
    
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
    
    # Save temp file with UUID for security
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        # Step 1: Preprocess image (grayscale, threshold, denoise, deskew)
        processed_path = preprocess_image(temp_path)
        if processed_path != temp_path:
            # Deskew if needed
            processed_path = deskew_image(processed_path)
        
        # Step 2: Extract text using OCR
        text = extract_text(processed_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400
        
        # Detect document type
        doc_type = detect_document_type(text)
        
        # Parse based on type
        if doc_type == 'invoice':
            result = parse_invoice(text)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_document(text, 'rc')
        elif doc_type == 'insurance':
            result = parse_vehicle_document(text, 'insurance')
        elif doc_type == 'puc':
            result = parse_vehicle_document(text, 'puc')
        elif doc_type == 'driving_license':
            result = parse_driver_document(text, 'driving_license')
        elif doc_type == 'aadhaar':
            result = parse_driver_document(text, 'aadhaar')
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
        # Clean up temp files
        try:
            os.remove(temp_path)
        except:
            pass
        try:
            if 'processed_path' in locals() and processed_path != temp_path:
                os.remove(processed_path)
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
        
        result = parse_vehicle_document(text, 'rc')
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
        
        result = parse_driver_document(text, 'driving_license')
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


# Learning Memory API
@app.route('/api/ocr/learn', methods=['POST'])
def learn_correction_api():
    """Learn a correction from user input"""
    data = request.get_json()
    
    wrong_text = data.get('wrong')
    correct_text = data.get('correct')
    field_type = data.get('field_type')
    
    if not wrong_text or not correct_text:
        return jsonify({'error': 'Missing wrong or correct text'}), 400
    
    success = learn_correction(wrong_text, correct_text, field_type)
    
    return jsonify({'success': success, 'message': 'Correction learned' if success else 'No change'})


@app.route('/api/ocr/suggestions', methods=['GET'])
def get_suggestions_api():
    """Get autocomplete suggestions"""
    field_type = request.args.get('field_type', '')
    prefix = request.args.get('prefix', '')
    
    memory = load_memory()
    suggestions = get_suggestions(field_type, prefix, memory)
    
    return jsonify({'suggestions': suggestions})


@app.route('/api/ocr/corrections', methods=['GET'])
def get_corrections_api():
    """Get all learned corrections"""
    corrections = get_corrections()
    return jsonify({'corrections': corrections})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

            is_valid = bool(re.match(dl_pattern, license_num.upper()))
            field_validations['license_number'] = is_valid
            if not is_valid:
                errors.append("Invalid license number format")
    
    elif doc_type == 'aadhaar':
        # Validate aadhaar number (12 digits)
        aadhaar = result.get('aadhaar_number')
        if aadhaar:
            is_valid = len(aadhaar.replace(' ', '')) == 12 and aadhaar.replace(' ', '').isdigit()
            field_validations['aadhaar_number'] = is_valid
            if not is_valid:
                errors.append("Invalid aadhaar number - must be 12 digits")
    
    # Add validation results to result
    result['validations'] = field_validations
    result['errors'] = errors
    
    return result


def add_confidence(result, text, doc_type):
    """Calculate confidence score per field"""
    # Expected fields per document type with weights
    expected_fields = {
        'invoice': [
            ('bill_no', 15),
            ('date', 15),
            ('party_name', 15),
            ('party_gst', 15),
            ('basic_amount', 15),
            ('cgst_amount', 5),
            ('sgst_amount', 5),
            ('total_amount', 15),
        ],
        'vehicle_rc': [
            ('registration_number', 25),
            ('chassis_number', 25),
            ('engine_number', 20),
            ('owner_name', 15),
            ('make_model', 10),
            ('fitness_validity', 5),
        ],
        'insurance': [
            ('registration_number', 20),
            ('insurance_company', 20),
            ('policy_number', 20),
            ('valid_to', 20),
            ('sum_insured', 20),
        ],
        'puc': [
            ('registration_number', 30),
            ('valid_to', 30),
            ('puc_number', 20),
            ('emission_level', 20),
        ],
        'driving_license': [
            ('license_number', 30),
            ('driver_name', 20),
            ('license_expiry', 25),
            ('father_name', 10),
            ('address', 10),
            ('license_type', 5),
        ],
        'aadhaar': [
            ('aadhaar_number', 35),
            ('name', 25),
            ('dob', 15),
            ('gender', 10),
            ('address', 15),
        ],
    }
    
    fields = expected_fields.get(doc_type, [])
    
    # Calculate per-field confidence
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
    
    # Overall confidence
    overall_confidence = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    
    result['confidence'] = overall_confidence
    result['field_confidences'] = field_confidences
    
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
    
    # Save temp file with UUID for security
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    file.save(temp_path)
    
    try:
        # Step 1: Preprocess image (grayscale, threshold, denoise, deskew)
        processed_path = preprocess_image(temp_path)
        if processed_path != temp_path:
            # Deskew if needed
            processed_path = deskew_image(processed_path)
        
        # Step 2: Extract text using OCR
        text = extract_text(processed_path)
        
        if not text:
            return jsonify({'error': 'Failed to extract text'}), 400
        
        # Detect document type
        doc_type = detect_document_type(text)
        
        # Parse based on type
        if doc_type == 'invoice':
            result = parse_invoice(text)
        elif doc_type == 'vehicle_rc':
            result = parse_vehicle_document(text, 'rc')
        elif doc_type == 'insurance':
            result = parse_vehicle_document(text, 'insurance')
        elif doc_type == 'puc':
            result = parse_vehicle_document(text, 'puc')
        elif doc_type == 'driving_license':
            result = parse_driver_document(text, 'driving_license')
        elif doc_type == 'aadhaar':
            result = parse_driver_document(text, 'aadhaar')
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
        # Clean up temp files
        try:
            os.remove(temp_path)
        except:
            pass
        try:
            if 'processed_path' in locals() and processed_path != temp_path:
                os.remove(processed_path)
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
        
        result = parse_vehicle_document(text, 'rc')
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
        
        result = parse_driver_document(text, 'driving_license')
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


# Learning Memory API
@app.route('/api/ocr/learn', methods=['POST'])
def learn_correction_api():
    """Learn a correction from user input"""
    data = request.get_json()
    
    wrong_text = data.get('wrong')
    correct_text = data.get('correct')
    field_type = data.get('field_type')
    
    if not wrong_text or not correct_text:
        return jsonify({'error': 'Missing wrong or correct text'}), 400
    
    success = learn_correction(wrong_text, correct_text, field_type)
    
    return jsonify({'success': success, 'message': 'Correction learned' if success else 'No change'})


@app.route('/api/ocr/suggestions', methods=['GET'])
def get_suggestions_api():
    """Get autocomplete suggestions"""
    field_type = request.args.get('field_type', '')
    prefix = request.args.get('prefix', '')
    
    memory = load_memory()
    suggestions = get_suggestions(field_type, prefix, memory)
    
    return jsonify({'suggestions': suggestions})


@app.route('/api/ocr/corrections', methods=['GET'])
def get_corrections_api():
    """Get all learned corrections"""
    corrections = get_corrections()
    return jsonify({'corrections': corrections})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
