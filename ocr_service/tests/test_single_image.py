import sys
import os
import argparse

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ocr_engine import extract_with_ocr_space
from utils.ocr_utils import detect_document_type
from parsers.vehicle_parser import parse_vehicle_document
from parsers.driver_parser import parse_driver_document
from parsers.invoice_parser import parse_invoice

def test_file(img_path):
    if not os.path.exists(img_path):
        print(f"Error: File not found {img_path}")
        return

    print("=" * 60)
    print(f"DIAGNOSTIC: {os.path.basename(img_path)}")
    print("=" * 60)
    
    # 1. OCR (Using OCR.space to ensure we get results locally)
    text = extract_with_ocr_space(img_path)
    if not text:
        print("  Failed: No text extracted.")
        return
    
    print("Raw Text Snippet:")
    print("-" * 30)
    print(text[:200] + "...")
    print("-" * 30)
    
    # 2. Detect Type
    doc_type = detect_document_type(text)
    print(f"Detected Document Type: {doc_type}")
    
    # 3. Parse based on type
    if doc_type == 'invoice':
        result = parse_invoice(text)
    elif doc_type in ['vehicle_rc', 'rc', 'fitness', 'insurance', 'puc', 'permit', 'tax_receipt']:
        result = parse_vehicle_document(text, doc_type)
    elif doc_type in ['driving_license', 'aadhaar']:
        result = parse_driver_document(text, doc_type)
    else:
        result = {"message": "Unknown type, using generic parser"}
        
    print("-" * 60)
    print("PARSED DATA:")
    for key, value in result.items():
        if value and str(value).strip() != 'None' and key != 'raw_text':
             print(f"  {key}: {value}")
    print("-" * 60)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        test_file(sys.argv[1])
    else:
        print("Usage: python test_single_image.py <image_path>")
