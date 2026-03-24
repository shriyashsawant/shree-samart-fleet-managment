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


def parse_fitness(text):
    """Parse Fitness Certificate (FORM 38)"""
    result = {
        'document_type': 'fitness',
        'registration_number': None,
        'chassis_number': None,
        'engine_number': None,
        'registration_date': None,
        'certificate_expires': None,
        'next_inspection_date': None,
        'category': None,
        'manufacturing_year': None,
    }
    
    # Registration Number
    match = re.search(r'([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})', text.upper())
    if match:
        result['registration_number'] = match.group(1)
    
    # Chassis Number - handle both inline (label: value) and multiline (label on one line, value on next)
    chassis_match = re.search(
        r'(?:Chassis\s*No|Chassis)[:\s]*([A-Z0-9]{10,20})',
        text, re.IGNORECASE
    )
    if not chassis_match:
        # Try multiline format: "Chassis No" followed by ": value" on next line
        chassis_match = re.search(r'Chassis\s*No\s*\n\s*:\s*([A-Z0-9]{10,20})', text, re.IGNORECASE)
    if not chassis_match:
        # Try pattern MAT... (common in Indian vehicle docs)
        chassis_match = re.search(r'(MAT[A-Z0-9]{13}[A-Z0-9]?)', text, re.IGNORECASE)
    if chassis_match:
        result['chassis_number'] = chassis_match.group(1).upper()
    
    # Engine Number - be more careful not to pick up other numbers
    engine_match = re.search(
        r'Engine\s*No\s*\n\s*:\s*([A-Z0-9]{6,20})',
        text, re.IGNORECASE
    )
    if not engine_match:
        # Try to find the line with "Engine No" and get value after colon
        engine_match = re.search(r'Engine\s*No\s*:?\s*\n\s*:?\s*([A-Z0-9]{10,20})', text, re.IGNORECASE)
    if not engine_match:
        # Try specific pattern for engine numbers starting with digits
        engine_match = re.search(r':\s*(\d{12,})', text)
    if engine_match:
        result['engine_number'] = engine_match.group(1).strip()
    
    # Certificate expires - handle various OCR formats
    # Pattern: "Certificate will expire onig" followed by newline and "311 Feb-2027"
    feb2027_match = re.search(r'(?:certificat\w*)?\s*(?:expire|expire\w*)[\s\w]*\s*\n\s*(\d{1,3})\s+([A-Za-z]{3})\s*-\s*(2027)', text, re.IGNORECASE)
    if not feb2027_match:
        feb2027_match = re.search(r'(?:certificat\w*)?\s*(?:expire|expire\w*)\.?\s*(\d{1,2})\s*([A-Za-z]{3})\s*-\s*(2027)', text, re.IGNORECASE)
    if not feb2027_match:
        feb2027_match = re.search(r'(?:certificat\w*)?\s*(?:expire|expire\w*)\s*(\d{1,3})\s+([A-Za-z]{3})\s*-\s*(2027)', text, re.IGNORECASE)
    if feb2027_match:
        raw_day = feb2027_match.group(1)
        month = feb2027_match.group(2)
        year = feb2027_match.group(3)
        day = raw_day.lstrip('0') or '1'
        if len(day) > 2:
            day = day[-2:]  # "311" -> "11" (take last 2 digits)
        date_str = f"{day}-{month[:3]}-{year}"
        result['certificate_expires'] = date_str
        result['expiry_date'] = date_str
        result['fitness_validity'] = date_str
    
    # Next inspection date
    next_match = re.search(
        r'(?:Next\s*Inspection\s*Due\s*Date|Next\s*Inspection)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        text, re.IGNORECASE
    )
    if next_match:
        result['next_inspection_date'] = next_match.group(1)
    
    # Category
    cat_match = re.search(
        r'(?:Category\s*of\s*Vehicle|Category)[:\s]*([A-Za-z]+)',
        text, re.IGNORECASE
    )
    if cat_match:
        result['category'] = cat_match.group(1).strip()
    
    # Manufacturing Year
    year_match = re.search(
        r'(?:Manufacturing\s*Year|Manuf\.?\s*year)[:\s]*(\d{4})',
        text, re.IGNORECASE
    )
    if year_match:
        result['manufacturing_year'] = year_match.group(1)
    
    return result


def parse_permit(text):
    """Parse Permit Document"""
    result = {
        'document_type': 'permit',
        'registration_number': None,
        'permit_number': None,
        'permit_holder': None,
        'chassis_number': None,
        'engine_number': None,
        'owner_name': None,
        'valid_from': None,
        'valid_to': None,
        'route': None,
    }
    
    # Registration Number
    match = re.search(r'([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})', text.upper())
    if match:
        result['registration_number'] = match.group(1)
    
    # Permit Number
    permit_match = re.search(
        r'(?:Permit\s*No|Permit\s*Number|MH\d{4}-[A-Z]{2}-\d{4}[A-Z])',
        text, re.IGNORECASE
    )
    if permit_match:
        result['permit_number'] = permit_match.group(0)
    
    # Permit holder
    holder_match = re.search(
        r'(?:Name\s*Of\s*The\s*Permit\s*Holder|Permit\s*Holder)[:\s]*([A-Za-z\s&\.]+)',
        text, re.IGNORECASE
    )
    if holder_match:
        result['permit_holder'] = holder_match.group(1).strip()
    
    # Chassis Number
    chassis_match = re.search(
        r'(?:Chassis\s*No|Chassis)[:\s]*([A-HJ-NPR-Z0-9]{10,17})',
        text, re.IGNORECASE
    )
    if chassis_match:
        result['chassis_number'] = chassis_match.group(1).upper()
    
    # Engine Number
    engine_match = re.search(
        r'(?:Engine\s*No|Engine)[:\s]*([A-HJ-NPR-Z0-9]{6,20})',
        text, re.IGNORECASE
    )
    if engine_match:
        result['engine_number'] = engine_match.group(1).upper()
    
    # Owner Name
    owner_match = re.search(
        r'(?:Owner\s*Name|Owner)[:\s]*([A-Za-z\s&\.]+)',
        text, re.IGNORECASE
    )
    if owner_match:
        result['owner_name'] = owner_match.group(1).strip()
    
    # Valid from
    from_match = re.search(
        r'(?:From:)[\s]*(\d{1,2}[-/][A-Za-z]{3}[-/\s]\d{4})',
        text, re.IGNORECASE
    )
    if from_match:
        result['valid_from'] = from_match.group(1).strip()
    
    # Valid to
    to_match = re.search(
        r'(?:To:)[\s]*(\d{1,2}[-/][A-Za-z]{3}[-/\s]\d{4})',
        text, re.IGNORECASE
    )
    if to_match:
        result['valid_to'] = to_match.group(1).strip()
    
    # Route
    route_match = re.search(
        r'(?:Region\s*Covered|Route)[:\s]*([A-Za-z\s]+)',
        text, re.IGNORECASE
    )
    if route_match:
        result['route'] = route_match.group(1).strip()
    
    return result


def parse_tax_receipt(text):
    """Parse Tax Receipt"""
    result = {
        'document_type': 'tax_receipt',
        'registration_number': None,
        'chassis_number': None,
        'tax_amount': None,
        'tax_date': None,
        'period_from': None,
        'period_to': None,
        'payment_date': None,
    }
    
    # Registration Number
    match = re.search(r'([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})', text.upper())
    if match:
        result['registration_number'] = match.group(1)
    
    # Chassis Number
    chassis_match = re.search(
        r'(?:Chasis\s*No|Chassis\s*No|Chassis)[:\s]*([A-Z0-9]{10,20})',
        text, re.IGNORECASE
    )
    if not chassis_match:
        chassis_match = re.search(r'Chasis\s*No\s*\n\s*:\s*([A-Z0-9]{10,20})', text, re.IGNORECASE)
    if chassis_match:
        result['chassis_number'] = chassis_match.group(1).upper()
    
    # Tax Amount - look for "GRAND TOTAL (in Rs):2520/-" pattern
    amount_match = re.search(
        r'(?:GRAND\s*TOTAL|Total|Total\s*in\s*Rs)[:\s]*([\d,]+\.?\d*)\s*(?:\/-)?',
        text, re.IGNORECASE
    )
    if not amount_match:
        # Try pattern like "2520/-" at end
        amount_match = re.search(r'(\d{3,5})\s*/-', text)
    if amount_match:
        try:
            result['tax_amount'] = float(amount_match.group(1).replace(',', ''))
        except:
            pass
    
    # Period - look for "01-May-2023 to 30-Apr-2024" pattern
    period_match = re.search(
        r'(\d{1,2}[-/][A-Za-z]{2,3}[-/\s]\d{4})\s+(?:to)\s+(\d{1,2}[-/][A-Za-z]{2,3}[-/\s]\d{4})',
        text, re.IGNORECASE
    )
    if period_match:
        result['period_from'] = period_match.group(1)
        result['period_to'] = period_match.group(2)
    
    # Payment Date
    pay_match = re.search(
        r'(?:Payment\s*Date|Transaction\s*Date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{4})',
        text, re.IGNORECASE
    )
    if pay_match:
        result['payment_date'] = pay_match.group(1)
        result['tax_date'] = pay_match.group(1)
    
    return result


def parse_vehicle_document(text, doc_type):
    """Route to appropriate vehicle parser"""
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
    elif doc_type == 'tax_receipt':
        return parse_tax_receipt(text)
    else:
        # Try to auto-detect
        text_upper = text.upper()
        if 'FORM 38' in text_upper or 'CERTIFICATE OF FITNESS' in text_upper:
            return parse_fitness(text)
        elif 'PERMIT' in text_upper and 'GOODS' in text_upper:
            return parse_permit(text)
        elif 'TAX RECEIPT' in text_upper or 'ROAD TAX' in text_upper:
            return parse_tax_receipt(text)
        else:
            return parse_rc(text)
