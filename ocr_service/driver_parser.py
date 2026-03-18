"""
Driver Parser Module
Parses Driving License and Aadhaar documents
"""

import re


def parse_driving_license(text):
    """Parse Driving License"""
    lines = text.split('\n')
    lines = [L.strip() for L in lines if L.strip()]
    
    result = {
        'license_number': None,
        'name': None,
        'father_name': None,
        'dob': None,
        'address': None,
        'blood_group': None,
        'license_type': None,
        'issue_date': None,
        'expiry_date': None,
        'state': None,
    }
    
    # License Number
    dl_match = re.search(r'(?:DL|DL No|License No)[:\-\s]*([A-Z]{2}[\d]{13,15})', text, re.IGNORECASE)
    if dl_match:
        result['license_number'] = dl_match.group(1).upper()
    
    # Name
    name_match = re.search(r'(?:Name|S Name)[:\-\s]*([A-Za-z\s]+?)(?:\n|$)', text, re.IGNORECASE)
    if name_match:
        result['name'] = name_match.group(1).strip()
    
    # Father's Name
    father_match = re.search(r'(?:Father|S/o|W/o)[:\-\s]*([A-Za-z\s]+?)(?:\n|$)', text, re.IGNORECASE)
    if father_match:
        result['father_name'] = father_match.group(1).strip()
    
    # DOB
    dob_match = re.search(r'(?:DOB|Date of Birth)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', text, re.IGNORECASE)
    if dob_match:
        result['dob'] = dob_match.group(1)
    
    # Blood Group
    blood_match = re.search(r'(?:Blood|BG)[:\-\s]*([A-Z\+]+)', text, re.IGNORECASE)
    if blood_match:
        result['blood_group'] = blood_match.group(1).upper()
    
    # License Type
    type_match = re.search(r'(?:Class|Type)[:\-\s]*([A-Z0-9,\s]+?)(?:\n|$)', text, re.IGNORECASE)
    if type_match:
        result['license_type'] = type_match.group(1).strip()
    
    # Issue Date
    issue_match = re.search(r'(?:Issue|Issued)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', text, re.IGNORECASE)
    if issue_match:
        result['issue_date'] = issue_match.group(1)
    
    # Expiry Date
    expiry_match = re.search(r'(?:Valid|Upto|Expiry|Expir)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', text, re.IGNORECASE)
    if expiry_match:
        result['expiry_date'] = expiry_match.group(1)
    
    return result


def parse_aadhaar(text):
    """Parse Aadhaar Card"""
    lines = text.split('\n')
    lines = [L.strip() for L in lines if L.strip()]
    
    result = {
        'aadhaar_number': None,
        'name': None,
        'father_name': None,
        'dob': None,
        'gender': None,
        'address': None,
        'state': None,
        'district': None,
    }
    
    # Aadhaar Number
    aadhaar_match = re.search(r'(\d{4}\s?\d{4}\s?\d{4})', text)
    if aadhaar_match:
        result['aadhaar_number'] = aadhaar_match.group(1).replace(' ', '')
    
    # Name
    name_match = re.search(r'(?:Name)[:\-\s]*([A-Za-z\s]+?)(?:\n|$)', text, re.IGNORECASE)
    if name_match:
        result['name'] = name_match.group(1).strip()
    
    # Father's Name
    father_match = re.search(r'(?:Father|Husband)[:\-\s]*([A-Za-z\s]+?)(?:\n|$)', text, re.IGNORECASE)
    if father_match:
        result['father_name'] = father_match.group(1).strip()
    
    # DOB
    dob_match = re.search(r'(?:DOB|Date of Birth)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})', text, re.IGNORECASE)
    if dob_match:
        result['dob'] = dob_match.group(1)
    
    # Gender
    gender_match = re.search(r'(?:Gender|Male|Female)', text, re.IGNORECASE)
    if gender_match:
        gender_text = gender_match.group(0).upper()
        result['gender'] = 'Male' if 'MALE' in gender_text else 'Female' if 'FEMALE' in gender_text else None
    
    return result
