import os
import sys

# Set these environment variables to skip slow checks
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'

# Add the project path AND ocr_service path to sys.path
# This ensures that 'ocr_service.parsers' and 'utils.regex_patterns' are found
current_dir = os.getcwd()
sys.path.append(current_dir)
sys.path.append(os.path.join(current_dir, 'ocr_service'))

from ocr_service.ocr_engine import extract_with_paddle
# Import through the full path to be safe
from ocr_service.parsers.invoice_parser import parse_invoice

# The image path you provided
IMAGE_PATH = r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.30 PM (1).jpeg"

print("="*50)
print(f"Testing OCR extraction on {os.path.basename(IMAGE_PATH)}")
print("="*50)

# 1. Run OCR extraction
print("1. Running PaddleOCR 3.4 extraction...")
raw_text = extract_with_paddle(IMAGE_PATH)

if raw_text:
    print(f"SUCCESS: Extracted {len(raw_text)} characters.")
    print("\n--- Extracted Text Preview ---")
    print(raw_text[:500] + "...")
    print("------------------------------\n")
    
    # 2. Run Invoice Parsing
    print("2. Parsing extracted text...")
    parsed_data = parse_invoice(raw_text)
    
    print("\n--- PARSED BILL DATA ---")
    for key, value in parsed_data.items():
        if value:
            print(f"{key:20}: {value}")
    print("-------------------------\n")
    
    # Manual Validation against your requirements:
    print("Manual Checklist:")
    print(f"- Bill No matches 02: {'YES' if parsed_data.get('bill_no') == '02' else 'NO'}")
    print(f"- Total matches 1,12,100: {'YES' if parsed_data.get('total_amount') == 112100.0 else 'NO'}")
else:
    print("FAILED: No text extracted. Check if PaddleOCR is properly installed in the venv.")
