"""
Vehicle Document Parser - RC, Insurance, PUC
Extracts vehicle-specific information from documents
"""

import re
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.regex_patterns import VEHICLE_PATTERNS, COMMON_PATTERNS, VALIDATION_RULES


def parse_rc(text):
    """Parse Registration Certificate (RC)"""
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
        'insurance_validity': None,
        'puc_validity': None,
        'permit_validity': None,
    }
    
    # Registration Number
    match = re.search(r'([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})', text.upper())
    if match:
        result['registration_number'] = match.group(1)
    
    # Chassis Number
    chassis_match = re.search(
        r'(?:Chassis|Chassis\s*No|VIN)[:\s]*([A-HJ-NPR-Z0-9]{10,17})',
        text, re.IGNORECASE
    )
    if chassis_match:
        result['chassis_number'] = chassis_match.group(1).upper()
    else:
        # Try alternate pattern
        match = re.search(r'([A-HJ-NPR-Z0-9]{17})', text.upper())
        if match:
            result['chassis_number'] = match.group(1)
    
    # Engine Number
    engine_match = re.search(
        r'(?:Engine|Engine\s*No)[:\s]*([A-HJ-NPR-Z0-9]{6,20})',
        text, re.IGNORECASE
    )
    if engine_match:
        result['engine_number'] = engine_match.group(1).upper()
    
    # Owner Name
    owner_match = re.search(
        r'(?:Owner|Name\s*of\s*Owner|Owner\s*Name)[:\s]*([A-Za-z\s&\.]+)',
        text, re.IGNORECASE
    )
    if owner_match:
        result['owner_name'] = owner_match.group(1).strip()
    
    # Make/Model
    make_match = re.search(
        r'(?:Make|Model|Vehicle\s*Type)[:\s]*([A-Za-z0-9\s]+)',
        text, re.IGNORECASE
    )
    if make_match:
        result['make_model'] = make_match.group(1).strip()
    
    # Fuel Type
    fuel_match = re.search(
        r'(?:Fuel|Fuel\s*Type)[:\s]*([A-Za-z]+)',
        text, re.IGNORECASE
    )
    if fuel_match:
        result['fuel_type'] = fuel_match.group(1).strip()
    
    # Registration Date
    reg_match = re.search(
        r'(?:Registration\s*Date|Reg\.?\s*Date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if reg_match:
        result['registration_date'] = reg_match.group(1)
    
    # Fitness Validity
    fitness_match = re.search(
        r'(?:Fitness\s*Valid|Fitness\s*Upto)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if fitness_match:
        result['fitness_validity'] = fitness_match.group(1)
    
    # Insurance Validity
    ins_match = re.search(
        r'(?:Insurance\s*Valid|Insurance\s*Upto)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if ins_match:
        result['insurance_validity'] = ins_match.group(1)
    
    # PUC Validity
    puc_match = re.search(
        r'(?:PUC\s*Valid|PUC\s*Upto)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if puc_match:
        result['puc_validity'] = puc_match.group(1)
    
    # Permit Validity
    permit_match = re.search(
        r'(?:Permit\s*Valid|Permit\s*Upto)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if permit_match:
        result['permit_validity'] = permit_match.group(1)
    
    return result


def parse_insurance(text):
    """Parse Vehicle Insurance Policy"""
    result = {
        'document_type': 'insurance',
        'registration_number': None,
        'chassis_number': None,
        'engine_number': None,
        'owner_name': None,
        'insurance_company': None,
        'policy_number': None,
        'policy_type': None,
        'valid_from': None,
        'valid_to': None,
        'sum_insured': None,
    }
    
    # Registration Number
    match = re.search(r'([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})', text.upper())
    if match:
        result['registration_number'] = match.group(1)
    
    # Chassis Number
    chassis_match = re.search(
        r'(?:Chassis|Chassis\s*No)[:\s]*([A-HJ-NPR-Z0-9]{10,17})',
        text, re.IGNORECASE
    )
    if chassis_match:
        result['chassis_number'] = chassis_match.group(1).upper()
    
    # Engine Number
    engine_match = re.search(
        r'(?:Engine|Engine\s*No)[:\s]*([A-HJ-NPR-Z0-9]{6,20})',
        text, re.IGNORECASE
    )
    if engine_match:
        result['engine_number'] = engine_match.group(1).upper()
    
    # Owner Name
    owner_match = re.search(
        r'(?:Owner|Insured\s*Name)[:\s]*([A-Za-z\s&\.]+)',
        text, re.IGNORECASE
    )
    if owner_match:
        result['owner_name'] = owner_match.group(1).strip()
    
    # Insurance Company
    company_match = re.search(
        r'(?:Insurance\s*Company|Company)[:\s]*([A-Za-z\s]+)',
        text, re.IGNORECASE
    )
    if company_match:
        result['insurance_company'] = company_match.group(1).strip()
    
    # Policy Number
    policy_match = re.search(
        r'(?:Policy\s*No|Policy\s*Number)[:\s]*([A-Z0-9]+)',
        text, re.IGNORECASE
    )
    if policy_match:
        result['policy_number'] = policy_match.group(1)
    
    # Policy Type
    if 'comprehensive' in text.lower():
        result['policy_type'] = 'Comprehensive'
    elif 'third party' in text.lower():
        result['policy_type'] = 'Third Party'
    
    # Valid From
    from_match = re.search(
        r'(?:Valid\s*From|From)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if from_match:
        result['valid_from'] = from_match.group(1)
    
    # Valid To
    to_match = re.search(
        r'(?:Valid\s*To|Expiry|Valid\s*Upto|Expires)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if to_match:
        result['valid_to'] = to_match.group(1)
    
    # Sum Insured
    amount_match = re.search(
        r'(?:Sum\s*Insured|Insured\s*Amount)[:\s₹]*\s*([\d,]+\.?\d*)',
        text, re.IGNORECASE
    )
    if amount_match:
        result['sum_insured'] = float(amount_match.group(1).replace(',', ''))
    
    return result


def parse_puc(text):
    """Parse Pollution Under Control (PUC) Certificate"""
    result = {
        'document_type': 'puc',
        'registration_number': None,
        'chassis_number': None,
        'engine_number': None,
        'owner_name': None,
        'puc_number': None,
        'valid_from': None,
        'valid_to': None,
        'emission_level': None,
        'testing_center': None,
    }
    
    # Registration Number
    match = re.search(r'([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})', text.upper())
    if match:
        result['registration_number'] = match.group(1)
    
    # Chassis Number
    chassis_match = re.search(
        r'(?:Chassis|Chassis\s*No)[:\s]*([A-HJ-NPR-Z0-9]{10,17})',
        text, re.IGNORECASE
    )
    if chassis_match:
        result['chassis_number'] = chassis_match.group(1).upper()
    
    # Engine Number
    engine_match = re.search(
        r'(?:Engine|Engine\s*No)[:\s]*([A-HJ-NPR-Z0-9]{6,20})',
        text, re.IGNORECASE
    )
    if engine_match:
        result['engine_number'] = engine_match.group(1).upper()
    
    # Owner Name
    owner_match = re.search(
        r'(?:Owner|Owner\s*Name)[:\s]*([A-Za-z\s&\.]+)',
        text, re.IGNORECASE
    )
    if owner_match:
        result['owner_name'] = owner_match.group(1).strip()
    
    # PUC Number
    puc_match = re.search(
        r'(?:PUC\s*No|Certificate\s*No)[:\s]*([A-Z0-9]+)',
        text, re.IGNORECASE
    )
    if puc_match:
        result['puc_number'] = puc_match.group(1)
    
    # Valid From
    from_match = re.search(
        r'(?:Valid\s*From|From)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if from_match:
        result['valid_from'] = from_match.group(1)
    
    # Valid To
    to_match = re.search(
        r'(?:Valid\s*To|Valid\s*Upto)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if to_match:
        result['valid_to'] = to_match.group(1)
    
    # Emission Level
    emission_match = re.search(
        r'(?:Emission|CO|HC)[:\s]*([\d.]+)',
        text, re.IGNORECASE
    )
    if emission_match:
        result['emission_level'] = emission_match.group(1)
    
    # Testing Center
    center_match = re.search(
        r'(?:Testing\s*Center|Center)[:\s]*([A-Za-z\s]+)',
        text, re.IGNORECASE
    )
    if center_match:
        result['testing_center'] = center_match.group(1).strip()
    
    return result


def parse_vehicle_document(text, doc_type):
    """Route to appropriate vehicle parser"""
    if doc_type == 'rc':
        return parse_rc(text)
    elif doc_type == 'insurance':
        return parse_insurance(text)
    elif doc_type == 'puc':
        return parse_puc(text)
    else:
        return {'error': f'Unknown vehicle document type: {doc_type}'}
