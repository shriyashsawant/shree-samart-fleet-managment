import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ocr_engine import extract_text, extract_with_local, extract_with_ocr_space
from utils.ocr_utils import detect_document_type
from parsers.vehicle_parser import parse_vehicle_document

def test_permit():
    img_path = r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH09CU1605\1605 - Permit.jpeg"
    
    print(f"Testing Permit Extraction for: {img_path}")
    print("-" * 50)
    
    # 1. Try OCR
    # First check Tesseract explicitly to see if it's there
    print("Checking Tesseract Local...")
    text = extract_with_local(img_path)
    if text:
        engine = "Tesseract"
    else:
        print("Tesseract not found, falling back to OCR.space...")
        text = extract_with_ocr_space(img_path)
        engine = "OCR.space"
    
    if not text:
        print("Error: Could not extract text from image.")
        return
        
    print(f"Engine Used: {engine}")
    print("Raw Text Extracted:")
    print("-" * 50)
    print(text)
    print("-" * 50)
    
    # 2. Detect Doc Type
    doc_type = detect_document_type(text)
    print(f"Detected Type: {doc_type}")
    
    # 3. Parse
    result = parse_vehicle_document(text, doc_type)
    
    print("-" * 50)
    print("Extracted Data:")
    for k, v in result.items():
        print(f"  {k}: {v}")

if __name__ == '__main__':
    test_permit()
