"""
Driver Document Parser - Driving License, Aadhaar
"""
import re
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.regex_patterns import DRIVER_PATTERNS
from utils.ocr_utils import extract_with_anchor, clean_ocr_text

def parse_driving_license(text):
    """Parse Driving License"""
    text = clean_ocr_text(text)
    result = {
        'document_type': 'driving_license',
        'license_number': None,
        'license_expiry': None,
        'driver_name': None,
        'father_name': None,
        'dob': None,
        'address': None,
    }
    
    # Try DL specific anchors
    for field in result.keys():
        if field == 'document_type': continue
        val = extract_with_anchor(text, field, DRIVER_PATTERNS)
        if val: result[field] = val
        
    # Additional cleanup for DL number (often has spaces)
    if result.get('license_number'):
        result['license_number'] = result['license_number'].replace(' ', '').upper()
        
    return result

def parse_aadhaar(text):
    """Parse Aadhaar Card"""
    text = clean_ocr_text(text)
    result = {
        'document_type': 'aadhaar',
        'aadhaar_number': None,
        'name': None,
        'father_name': None,
        'dob': None,
        'gender': None,
    }
    
    for field in result.keys():
        if field == 'document_type': continue
        val = extract_with_anchor(text, field, DRIVER_PATTERNS)
        if val: result[field] = val
        
    # Additional cleanup for Aadhaar number (often has spaces)
    if result.get('aadhaar_number'):
        result['aadhaar_number'] = result['aadhaar_number'].replace(' ', '')
        
    return result

def parse_driver_document(text, doc_type):
    """Route to appropriate driver parser"""
    if doc_type == 'driving_license':
        return parse_driving_license(text)
    elif doc_type == 'aadhaar':
        return parse_aadhaar(text)
    else:
        # Auto-detect if type unclear but looks like driver doc
        if any(k in text.upper() for k in ['DL', 'DLNO', 'LICENSE', 'DRIVING']):
            return parse_driving_license(text)
        elif any(k in text.upper() for k in ['AADHAAR', 'AADHAR', 'GOVERNMENT OF INDIA']):
            return parse_aadhaar(text)
        return {'error': 'Unknown driver document type'}
