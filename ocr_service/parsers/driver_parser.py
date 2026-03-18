"""
Driver Document Parser - Driving License, Aadhaar
Extracts driver-specific information from documents
"""

import re
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.regex_patterns import DRIVER_PATTERNS, COMMON_PATTERNS, VALIDATION_RULES


def parse_driving_license(text):
    """Parse Driving License"""
    result = {
        'document_type': 'driving_license',
        'license_number': None,
        'license_expiry': None,
        'driver_name': None,
        'father_name': None,
        'dob': None,
        'address': None,
        'blood_group': None,
        'license_type': None,
        'state': None,
    }
    
    # License Number - try different patterns
    license_match = re.search(
        r'(?:Driving\s*License|License|License\s*No|DL\s*No)[:\s]*([A-Z]{2}\d{13})',
        text, re.IGNORECASE
    )
    if license_match:
        result['license_number'] = license_match.group(1).upper()
    else:
        # Try alternate pattern
        alt_match = re.search(r'([A-Z]{2}\d{13})', text.upper())
        if alt_match:
            result['license_number'] = alt_match.group(1)
    
    # License Expiry Date
    expiry_match = re.search(
        r'(?:Valid\s*Upto|Expiry|Expires|Valid\s*Till|Valid\s*Until)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if expiry_match:
        result['license_expiry'] = expiry_match.group(1)
    
    # Driver Name
    name_match = re.search(
        r'(?:Name|Name\s*of\s*Driver|Driver\s*Name)[:\s]*([A-Za-z\s]+)',
        text, re.IGNORECASE
    )
    if name_match:
        result['driver_name'] = name_match.group(1).strip()
    
    # Father's Name
    father_match = re.search(
        r'(?:Father|S/?O|D/?O)[:\s]*([A-Za-z\s]+)',
        text, re.IGNORECASE
    )
    if father_match:
        result['father_name'] = father_match.group(1).strip()
    
    # Date of Birth
    dob_match = re.search(
        r'(?:DOB|Date\s*of\s*Birth|DOB:)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if dob_match:
        result['dob'] = dob_match.group(1)
    
    # Address
    address_match = re.search(
        r'(?:Address|Permanent\s*Address)[:\s]*([A-Za-z0-9\s,/-]+)',
        text, re.IGNORECASE
    )
    if address_match:
        result['address'] = address_match.group(1).strip()
    
    # Blood Group
    blood_match = re.search(
        r'(?:Blood\s*Group|Blood)[:\s]*([A-Z][+-]?|A|B|AB|O)',
        text, re.IGNORECASE
    )
    if blood_match:
        result['blood_group'] = blood_match.group(1).upper()
    
    # License Type (Transport/Non-Transport)
    if 'transport' in text.lower():
        result['license_type'] = 'Transport'
    elif 'non-transport' in text.lower():
        result['license_type'] = 'Non-Transport'
    
    # State
    state_match = re.search(
        r'(?:State|RTO)[:\s]*([A-Za-z\s]+)',
        text, re.IGNORECASE
    )
    if state_match:
        result['state'] = state_match.group(1).strip()
    
    return result


def parse_aadhaar(text):
    """Parse Aadhaar Card"""
    result = {
        'document_type': 'aadhaar',
        'aadhaar_number': None,
        'name': None,
        'father_name': None,
        'dob': None,
        'gender': None,
        'address': None,
        'state': None,
        'district': None,
    }
    
    # Aadhaar Number - 12 digits
    aadhaar_match = re.search(r'(\d{4}\s?\d{4}\s?\d{4})', text)
    if aadhaar_match:
        result['aadhaar_number'] = aadhaar_match.group(1).replace(' ', '')
    
    # Name
    name_match = re.search(
        r'(?:Name)[:\s]*([A-Za-z\s]+)',
        text, re.IGNORECASE
    )
    if name_match:
        result['name'] = name_match.group(1).strip()
    
    # Father's Name
    father_match = re.search(
        r'(?:Father|S/?O)[:\s]*([A-Za-z\s]+)',
        text, re.IGNORECASE
    )
    if father_match:
        result['father_name'] = father_match.group(1).strip()
    
    # Date of Birth
    dob_match = re.search(
        r'(?:DOB|Date\s*of\s*Birth)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if dob_match:
        result['dob'] = dob_match.group(1)
    
    # Gender
    gender_match = re.search(
        r'(?:Gender|Sex)[:\s]*([A-Za-z]+)',
        text, re.IGNORECASE
    )
    if gender_match:
        gender = gender_match.group(1).strip().upper()
        if gender in ['M', 'MALE']:
            result['gender'] = 'Male'
        elif gender in ['F', 'FEMALE']:
            result['gender'] = 'Female'
        else:
            result['gender'] = gender
    
    # Address
    address_match = re.search(
        r'(?:Address)[:\s]*([A-Za-z0-9\s,/-]+)',
        text, re.IGNORECASE
    )
    if address_match:
        result['address'] = address_match.group(1).strip()
    
    # State
    state_match = re.search(
        r'(?:State)[:\s]*([A-Za-z\s]+)',
        text, re.IGNORECASE
    )
    if state_match:
        result['state'] = state_match.group(1).strip()
    
    # District
    district_match = re.search(
        r'(?:District)[:\s]*([A-Za-z\s]+)',
        text, re.IGNORECASE
    )
    if district_match:
        result['district'] = district_match.group(1).strip()
    
    return result


def parse_driver_document(text, doc_type):
    """Route to appropriate driver parser"""
    if doc_type == 'driving_license':
        return parse_driving_license(text)
    elif doc_type == 'aadhaar':
        return parse_aadhaar(text)
    else:
        return {'error': f'Unknown driver document type: {doc_type}'}
