"""
Vehicle Document Parser - RC, Insurance, PUC, Fitness, Permit, Tax Receipt
"""
import re
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.regex_patterns import VEHICLE_PATTERNS
from utils.ocr_utils import extract_with_anchor, clean_ocr_text

def fix_vehicle_ocr_errors(text):
    """Fix common OCR errors in vehicle documents (e.g. MH09 looks like MH O9)"""
    if not text: return ""
    # Remove excessive spaces in registration numbers (MH 09 CU 1605 -> MH09CU1605)
    # But only in parts that look like vehicle registration
    def fix_reg(match):
        return match.group(0).replace(' ', '').replace('O', '0').replace('o', '0').replace('g', '9').upper()
    
    text = re.sub(r'[A-Z]{2}\s*[\d Oog]{2}\s*[A-Z]{1,2}\s*[\d Oog]{4}', fix_reg, text, flags=re.IGNORECASE)
    return text

def parse_rc(text):
    """Parse Registration Certificate (RC)"""
    text = fix_vehicle_ocr_errors(text)
    result = {
        'document_type': 'rc',
        'registration_number': None,
        'chassis_number': None,
        'engine_number': None,
        'owner_name': None,
        'make_model': None,
        'fuel_type': None,
        'registration_date': None,
        'fitness_validity': None,
    }
    
    for field in result.keys():
        if field == 'document_type': continue
        val = extract_with_anchor(text, field, VEHICLE_PATTERNS)
        if val: result[field] = val
        
    # Extra cleanup for specific fields
    if result.get('registration_number'):
        result['registration_number'] = result['registration_number'].replace(' ', '').upper()
        
    return result

def parse_insurance(text):
    """Parse Vehicle Insurance Policy"""
    result = {
        'document_type': 'insurance',
        'registration_number': None,
        'policy_number': None,
        'insurance_company': None,
        'expiry_date': None,
    }
    # Map 'expiry_date' to patterns if necessary, or use existing anchors
    for field in result.keys():
        if field == 'document_type': continue
        anchor_field = 'policy_number' if field == 'policy_number' else field
        val = extract_with_anchor(text, anchor_field, VEHICLE_PATTERNS)
        if val: result[field] = val
    return result

def parse_puc(text):
    """Parse PUC Certificate"""
    result = {
        'document_type': 'puc',
        'registration_number': None,
        'puc_validity': None,
        'emission_level': None,
    }
    # Handle the fact that 'puc_validity' might be 'fitness_expiry' in patterns
    val = extract_with_anchor(text, 'fitness_expiry', VEHICLE_PATTERNS)
    if val: result['puc_validity'] = val
    
    val_reg = extract_with_anchor(text, 'registration_number', VEHICLE_PATTERNS)
    if val_reg: result['registration_number'] = val_reg
    
    return result

def parse_fitness(text):
    """Parse Fitness Certificate (Form 38)"""
    result = {
        'document_type': 'fitness',
        'registration_number': None,
        'chassis_number': None,
        'fitness_validity': None,
    }
    val_f = extract_with_anchor(text, 'fitness_expiry', VEHICLE_PATTERNS)
    if val_f: result['fitness_validity'] = val_f
    
    val_r = extract_with_anchor(text, 'registration_number', VEHICLE_PATTERNS)
    if val_r: result['registration_number'] = val_r
    
    return result

def parse_permit(text):
    """Parse Vehicle Permit (Form 25/26 etc)"""
    text = fix_vehicle_ocr_errors(text)
    result = {
        'document_type': 'permit',
        'registration_number': None,
        'chassis_number': None,
        'engine_number': None,
        'permit_valid_from': None,
        'permit_valid_to': None,
        'gross_weight': None,
    }
    
    for field in result.keys():
        if field == 'document_type': continue
        val = extract_with_anchor(text, field, VEHICLE_PATTERNS)
        if val: result[field] = val
        
    # Support for the "10-Nov-2023 ... To: 09-Nov-2028" format
    if not result.get('permit_valid_from'):
        match_fm = re.search(r'From[:\s]*(\d{1,2}-[A-Za-z]{3}-\d{4})', text)
        if match_fm: result['permit_valid_from'] = match_fm.group(1)
        
    if not result.get('permit_valid_to'):
        match_to = re.search(r'To[:\s]*(\d{1,2}-[A-Za-z]{3}-\d{4})', text)
        if match_to: result['permit_valid_to'] = match_to.group(1)

    return result

def parse_vehicle_document(text, doc_type):
    """Route to appropriate vehicle parser based on detected subtype"""
    text = clean_ocr_text(text)
    
    if doc_type == 'rc' or doc_type == 'vehicle_rc':
        return parse_rc(text)
    elif doc_type == 'insurance':
        return parse_insurance(text)
    elif doc_type == 'puc':
        return parse_puc(text)
    elif doc_type == 'fitness':
        return parse_fitness(text)
    elif doc_type == 'permit':
        return parse_permit(text)
    else:
        # Fallback to RC if subtype unclear
        return parse_rc(text)
