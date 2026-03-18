"""
Centralized Regex Patterns with Keyword Anchors
Using specific keyword associations for better extraction accuracy
"""

# Invoice Patterns - organized by field with keyword associations
INVOICE_PATTERNS = {
    'date': [
        r'(?:Date|Dt|Dated|Month)[:\s]*([A-Za-z]+\-\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[- ]\d{4})',
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        r'(\d{1,2}[./]\d{1,2}[./]\d{2,4})',
    ],
    'bill_no': [
        r'(?:Invoice|Bill|Receipt|Chalan|BillNo|BiNo)[\s#:\-]*No\.?[:\s]*([\w/\-]+)',
        r'(?:Inv|Bill|Rec|Bi)[\s#:]*No\.?[:\s]*([\w/\-]+)',
        r'(?:No|BillNo|BiNo)[:\s]*([\w/\-]+)',
    ],
    'gstin': [
        r'(?:GST(?:IN|NO)?|Gst\s*Reg\s*No)[\s:\-]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z0O]{1}[0-9A-Z]{1})',
        r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z0O]{1}[0-9A-Z]{1})',
        r'GST\s*Reg\s*No\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})',
    ],
    'basic_amount': [
        r'(?:SubTotal|Sub\s*Total|Subtotal)[\s:.=\-\n]*([\d,]+\.?\d*)',
        r'(?:Basic|Taxable|Net)[\s*Amount]*[\s:.=\-\n]*([\d,]+\.?\d*)',
        r'Amount[\s:.=\-\n]*([\d,]+\.?\d*)',
        r'(?:Rs\.?|₹)\s*([\d,]+\.?\d*)',
    ],
    'cgst_amount': [
        r'(?:CGST|CGS3)[@\s]*\d+[%]*[:.\-\s]*([\d,]+\.?\d*)',
        r'(?:Central|CGST)[\s]*Tax[@\s]*\d+[%]*[:.\s₹]*\s*([\d,]+\.?\d*)',
    ],
    'sgst_amount': [
        r'(?:SGST|SGS1)[@\s]*\d+[%]*[:.\-\s]*([\d,]+\.?\d*)',
        r'(?:State|SGST)[\s]*Tax[@\s]*\d+[%]*[:.\s₹]*\s*([\d,]+\.?\d*)',
    ],
    'igst_amount': [
        r'(?:IGST)[\s@]*[\d\s%]*[:\s₹]*\s*([\d,]+\.?\d*)',
        r'(?:Integrated|IGST)[\s]*Tax[:\s₹]*\s*([\d,]+\.?\d*)',
    ],
    'total_amount': [
        r'(?:Grand\s*Total|Net\s*Total|Total\s*Amount|Payable|Amount\s*Payable)[:.\-\s₹]*([\d,]+\.?\d*)',
        r'(?:Total)[:.\-\s₹]*\s*([\d,]+\.?\d*)',
    ],
    'hsn_code': [
        r'(?:HSN|SAC)[\sCode:]*(\d{4,8})',
    ],
    'bank_account': [
        r'(?:A/C|Account|Account\s*No)[:\s]*(\d{9,18})',
    ],
    'ifsc_code': [
        r'(?:IFSC|IFS\s*Code)[:\s]*([A-Z]{4}\d{7})',
    ],
}

# Vehicle Document Patterns
VEHICLE_PATTERNS = {
    'registration_number': [
        r'([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})',
        r'(?:MH|AP|TN|KA|GJ|HR|RJ)\d{2}[A-Z]{1,2}\d{4}',
    ],
    'chassis_number': [
        r'(?:Chassis|Chassis\s*No|VIN)[:\s]*([A-HJ-NPR-Z0-9]{17})',
    ],
    'engine_number': [
        r'(?:Engine|Engine\s*No)[:\s]*([A-HJ-NPR-Z0-9]{6,20})',
    ],
    'owner_name': [
        r'(?:Owner|Name\s*of\s*Owner)[:\s]*([A-Za-z\s]+)',
    ],
    'make_model': [
        r'(?:Make|Model|Vehicle\s*Type)[:\s]*([A-Za-z0-9\s]+)',
    ],
    'fuel_type': [
        r'(?:Fuel|Fuel\s*Type)[:\s]*([A-Za-z]+)',
    ],
    'insurance_company': [
        r'(?:Insurance|Insurance\s*Co)[:\s]*([A-Za-z\s]+)',
    ],
    'policy_number': [
        r'(?:Policy|Policy\s*No)[:\s]*([A-Z0-9]+)',
    ],
}

# Driver Document Patterns
DRIVER_PATTERNS = {
    'license_number': [
        r'(?:Driving\s*License|License|License\s*No)[:\s]*([A-Z]{2}\d{13})',
        r'([A-Z]{2}\d{13})',
    ],
    'license_expiry': [
        r'(?:Valid\s*Upto|Expiry|Expires|Valid\s*Till)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
    ],
    'driver_name': [
        r'(?:Name|Name\s*of\s*Driver)[:\s]*([A-Za-z\s]+)',
    ],
    'father_name': [
        r'(?:Father|S/o|D/O)[:\s]*([A-Za-z\s]+)',
    ],
    'address': [
        r'(?:Address|Permanent\s*Address)[:\s]*([A-Za-z0-9\s,/-]+)',
    ],
    'aadhaar_number': [
        r'(\d{12})',
        r'(?:Aadhaar|Aadhaar\s*No)[:\s]*(\d{12})',
    ],
}

# Common Patterns
COMMON_PATTERNS = {
    'mobile': [
        r'([6-9]\d{9})',
    ],
    'gst': [
        r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1})',
    ],
    'pan': [
        r'([A-Z]{5}[0-9]{4}[A-Z]{1})',
    ],
    'email': [
        r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
    ],
}

# Document Type Keywords
DOCUMENT_KEYWORDS = {
    'invoice': ['invoice', 'bill', 'tax invoice', 'bill no', 'party name', 'hsn code', 'gstin'],
    'rc': ['registration', 'rc book', 'chassis', 'engine', 'vehicle', 'fitness', 'permit'],
    'insurance': ['insurance', 'policy', 'motor', 'vehicle', 'coverage', 'claim'],
    'puc': ['pollution', 'puc', 'emission', 'certificate'],
    'driving_license': ['driving license', 'license', 'dl no', 'transport', 'non-transport'],
    'aadhaar': ['aadhaar', 'uidai', 'unique identification', 'resident'],
}

# Field validation rules
VALIDATION_RULES = {
    'gst': {
        'length': 15,
        'pattern': r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1}$',
    },
    'mobile': {
        'length': 10,
        'pattern': r'^[6-9]\d{9}$',
    },
    'aadhaar': {
        'length': 12,
        'pattern': r'^\d{12}$',
    },
}
