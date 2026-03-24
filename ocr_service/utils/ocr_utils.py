"""
Shared OCR utility functions
"""
import re

def extract_with_anchor(text, field, patterns_dict, context_chars=80):
    """
    Extract field value by finding keyword anchor first, then looking near it.
    Works across different document types by passing the relevant patterns dictionary.
    """
    patterns = patterns_dict.get(field, [])
    
    for pattern in patterns:
        # Avoid greedy dotall if we already have a specific group
        # Just try the pattern as is first
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # If the pattern has capturing groups, take the first one
            val = match.group(1).strip() if match.groups() else match.group(0)
            
            # Numeric extraction only for amount-like fields
            # Structured numbers like GST, RC, Aadhaar should remain as per regex
            is_structured_identifier = any(k in field.lower() for k in ['gst', 'aadhaar', 'rc', 'registration', 'license', 'chassis', 'engine', 'pan', 'ifsc'])
            
            if not is_structured_identifier and any(k in field.lower() for k in ['amount', 'total', 'subtotal']):
                 # Try to find the last decimal-like number in the matched block
                 numbers = re.findall(r'[\d,]+\.?\d*', val)
                 if numbers:
                     val = numbers[-1].strip()
            
            # Clean up leading/trailing symbols
            val = re.sub(r'^[:\-#\*\/,\s=]+|[:\-#\*\/,\s=]+$', '', val).strip()
            return val
            
    return None

def clean_ocr_text(text):
    """Basic text cleanup to improve regex matches"""
    if not text: return ""
    # Standardize spaces and common OCR artifacts
    cleaned = text.replace('|', 'I').replace('(', '').replace(')', '')
    # Strip multiple spaces
    cleaned = re.sub(r' +', ' ', cleaned)
    return cleaned

def detect_document_type(text):
    """Detect document type from OCR text"""
    if not text: return 'unknown'
    text_upper = text.upper()
    
    # Priority 1: Invoice / Sales Bill / Tax Invoice
    if any(k in text_upper for k in ['TAX INVOICE', 'SALES INVOICE', 'CASH MEMO', 'BILL NO', 'GSTIN']):
        return 'invoice'
    
    # Priority 2: Fitness Certificate (check BEFORE RC since fitness docs also have chassis)
    if any(k in text_upper for k in ['FITNESS CERTIFICATE', 'FORM 38', 'FORM.38', 'CERTIFICATE OF FITNESS', 'CERTIFICATEOFFITNESS']):
        return 'fitness'
    if any(k in text_upper for k in ['REGISTRATION CERTIFICATE', 'FORM 23', 'RC BOOK']):
        return 'vehicle_rc'
    if any(k in text_upper for k in ['DRIVING LICENCE', 'DRIVING LICENSE', 'DL NO']):
        return 'driving_license'
    if any(k in text_upper for k in ['AADHAAR', 'UIDAI', 'GOVERNMENT OF INDIA']):
        return 'aadhaar'
    
    # Priority 3: Commercial Documents
    if any(k in text_upper for k in ['PUC', 'POLLUTION', 'EMISSION']):
        return 'puc'
    if any(k in text_upper for k in ['INSURANCE', 'POLICY', 'PREMIUM', 'LIABILITY']):
        return 'insurance'
    if any(k in text_upper for k in ['TAX RECEIPT', 'ROAD TAX', 'VIVA']):
        return 'tax_receipt'
    # Permit detection
    if any(k in text_upper for k in ['PERMIT', 'GOODS PERMIT', 'TRANSPORT PERMIT', 'PERMIT NO', 'VALIDITY OF PERMIT', 'PERMIT IN RESPECT']):
        return 'permit'
    
    # FALLBACK: Keyword density search for invoice
    if len(re.findall(r'GST|CGST|SGST|IGST|AMOUNT|TOTAL', text_upper)) >= 2:
        return 'invoice'
    
    return 'unknown'
