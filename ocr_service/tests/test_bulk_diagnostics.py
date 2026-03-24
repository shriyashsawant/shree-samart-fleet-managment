import sys
import os
import time
import json

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ocr_engine import extract_with_ocr_space
from utils.ocr_utils import detect_document_type
from parsers.vehicle_parser import parse_vehicle_document
from parsers.driver_parser import parse_driver_document
from parsers.invoice_parser import parse_invoice

# Root data folder
DATA_DIR = r"c:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data"
SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf'}

def bulk_diagnostic():
    print("=" * 60)
    print("BULK OCR DIAGNOSTIC: Shree-Samarth Data")
    print("=" * 60)
    
    files_to_test = []
    for root, dirs, files in os.walk(DATA_DIR):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in SUPPORTED_EXTENSIONS:
                files_to_test.append(os.path.join(root, f))
    
    print(f"Found {len(files_to_test)} files to process.")
    
    summary = []
    
    for i, file_path in enumerate(files_to_test):
        rel_path = os.path.relpath(file_path, DATA_DIR)
        print(f"\n[{i+1}/{len(files_to_test)}] Processing: {rel_path}")
        
        try:
            # 1. OCR (Using OCR.space to ensure we get results locally)
            text = extract_with_ocr_space(file_path)
            if not text:
                print("  Failed: No text extracted from image.")
                summary.append({"file": rel_path, "status": "FAILED", "type": "N/A"})
                continue
            
            # 2. Detect Type
            doc_type = detect_document_type(text)
            
            # 3. Parse based on type
            if doc_type == 'invoice':
                result = parse_invoice(text)
            elif doc_type in ['vehicle_rc', 'rc', 'fitness', 'insurance', 'puc', 'permit']:
                result = parse_vehicle_document(text, doc_type)
            elif doc_type in ['driving_license', 'aadhaar']:
                result = parse_driver_document(text, doc_type)
            else:
                # Catch-all
                result = {"raw_text": text[:100]}
                
            print(f"  Detected: {doc_type}")
            
            # Print key fields found
            fields_found = [k for k, v in result.items() if v and str(v).strip() != 'None']
            print(f"  Fields Extracted: {len(fields_found)}")
            
            summary.append({
                "file": rel_path,
                "status": "SUCCESS",
                "type": doc_type,
                "fields": len(fields_found)
            })
            
        except Exception as e:
            print(f"  Error: {e}")
            summary.append({"file": rel_path, "status": "ERROR", "message": str(e)})
            
        # Respect rate limits
        time.sleep(2)
    
    print("\n" + "=" * 60)
    print("FINAL SUMMARY:")
    print("-" * 60)
    print(f"{'FILE (REL)':<40} | {'TYPE':<15} | {'FIELDS'}")
    print("-" * 60)
    for entry in summary:
        print(f"{entry['file'][:40]:<40} | {entry.get('type', 'ERROR'):<15} | {entry.get('fields', 0)}")
    print("=" * 60)

if __name__ == '__main__':
    bulk_diagnostic()
