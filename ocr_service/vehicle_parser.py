"""
Vehicle Parser Module
Parses RC, Insurance, PUC documents
"""

import re


def parse_vehicle_rc(text):
    """Parse Vehicle Registration Certificate"""
    lines = text.split('\n')
    lines = [L.strip() for L in lines if L.strip()]
    
    result = {
        'vehicle_number': None,
        'chassis_number': None,
        'engine_number': None,
        'owner_name': None,
        'owner_address': None,
        'vehicle_class': None,
        'make_model': None,
        'fuel_type': None,
        'registration_date': None,
        'registration_validity': None,
        'fitness_validity': None,
        'insurance_company': None,
        'insurance_validity': None,
        'puc_validity': None,
    }
    
    # Vehicle Number
    vehicle_match = re.search(r'([A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4})', text.upper())
    if vehicle_match:
        result['vehicle_number'] = vehicle_match.group(1)
    
    # Chassis Number
    chassis_match = re.search(r'(?:Chassis|Chassis No|CN)[:\-\s]*([A-Z0-9]{17})', text, re.IGNORECASE)
    if chassis_match:
        result['chassis_number'] = chassis_match.group(1).upper()
    
    # Engine Number
    engine_match = re.search(r'(?:Engine|Engine No|EN)[:\-\s]*([A-Z0-9]{17})', text, re.IGNORECASE)
    if engine_match:
        result['engine_number'] = engine_match.group(1).upper()
    
    # Owner Name
    owner_match = re.search(r'(?:Owner|Name)[:\-\s]*([A-Za-z\s]+?)(?:\n|$)', text, re.IGNORECASE)
    if owner_match:
        result['owner_name'] = owner_match.group(1).strip()
    
    # Vehicle Class
    class_match = re.search(r'(?:Class|Vehicle Class)[:\-\s]*([A-Za-z0-9\s]+?)(?:\n|$)', text, re.IGNORECASE)
    if class_match:
        result['vehicle_class'] = class_match.group(1).strip()
    
    # Make/Model
    make_match = re.search(r'(?:Make|Model)[:\-\s]*([A-Za-z0-9\s]+?)(?:\n|$)', text, re.IGNORECASE)
    if make_match:
        result['make_model'] = make_match.group(1).strip()
    
    # Fuel Type
    fuel_match = re.search(r'(?:Fuel|Fuel Type)[:\-\s]*([A-Za-z]+)', text, re.IGNORECASE)
    if fuel_match:
        result['fuel_type'] = fuel_match.group(1).strip()
    
    # Registration Date
    reg_date_match = re.search(r'(?:Reg|Date of Reg|Registration)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', text, re.IGNORECASE)
    if reg_date_match:
        result['registration_date'] = reg_date_match.group(1)
    
    return result


def parse_insurance(text):
    """Parse Insurance Document"""
    lines = text.split('\n')
    lines = [L.strip() for L in lines if L.strip()]
    
    result = {
        'insurance_company': None,
        'policy_number': None,
        'vehicle_number': None,
        'owner_name': None,
        'cover_type': None,
        'premium_amount': None,
        'from_date': None,
        'to_date': None,
        'idv': None,
    }
    
    # Insurance Company
    company_match = re.search(r'(?:Insurance Company|ICICI|LIC|HDFC|Bajaj|Reliance)', text, re.IGNORECASE)
    if company_match:
        result['insurance_company'] = company_match.group(0).strip()
    
    # Policy Number
    policy_match = re.search(r'(?:Policy|Policy No|P/NO)[:\-\s]*([A-Z0-9]+)', text, re.IGNORECASE)
    if policy_match:
        result['policy_number'] = policy_match.group(1)
    
    # Vehicle Number
    vehicle_match = re.search(r'([A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4})', text.upper())
    if vehicle_match:
        result['vehicle_number'] = vehicle_match.group(1)
    
    # Premium
    premium_match = re.search(r'(?:Premium|Amount)[:\-\s]*([0-9,]+)', text, re.IGNORECASE)
    if premium_match:
        result['premium_amount'] = float(premium_match.group(1).replace(',', ''))
    
    # IDV
    idv_match = re.search(r'(?:IDV|Insured Declared)[:\-\s]*([0-9,]+)', text, re.IGNORECASE)
    if idv_match:
        result['idv'] = float(idv_match.group(1).replace(',', ''))
    
    return result


def parse_puc(text):
    """Parse PUC Certificate"""
    lines = text.split('\n')
    lines = [L.strip() for L in lines if L.strip()]
    
    result = {
        'vehicle_number': None,
        'puc_number': None,
        'issue_date': None,
        'valid_upto': None,
        'co_level': None,
        'hc_level': None,
        'center_name': None,
    }
    
    # Vehicle Number
    vehicle_match = re.search(r'([A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4})', text.upper())
    if vehicle_match:
        result['vehicle_number'] = vehicle_match.group(1)
    
    # Valid Upto
    valid_match = re.search(r'(?:Valid|Upto|Validity)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', text, re.IGNORECASE)
    if valid_match:
        result['valid_upto'] = valid_match.group(1)
    
    # CO Level
    co_match = re.search(r'CO[:\-\s]*([0-9.]+)', text, re.IGNORECASE)
    if co_match:
        result['co_level'] = co_match.group(1)
    
    # HC Level
    hc_match = re.search(r'HC[:\-\s]*([0-9.]+)', text, re.IGNORECASE)
    if hc_match:
        result['hc_level'] = hc_match.group(1)
    
    return result
