import sys
import os
import cv2

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from preprocessing.image_cleaner import preprocess_image
from parsers.invoice_parser import parse_invoice

def test_final_stack():
    # Use the generated dummy image if it exists, else use a placeholder logic
    dummy_img = r"C:\Users\SHRIYASH SAWANT\.gemini\antigravity\brain\c9e869aa-1403-4a28-b260-21055e2e6c74\dummy_ocr_test_invoice_png_1774372218448.png"
    
    if not os.path.exists(dummy_img):
        print(f"Error: Dummy image not found at {dummy_img}")
        return

    print("--- 1. Testing Preprocessing (Scaling Optimization) ---")
    orig = cv2.imread(dummy_img)
    print(f"Original Dimensions: {orig.shape[:2]}")
    
    processed_path = preprocess_image(dummy_img)
    proc = cv2.imread(processed_path)
    print(f"Processed Dimensions: {proc.shape[:2]}")
    
    if proc.shape[1] > orig.shape[1]:
        print("✓ Scaling works (Upsampled for better OCR)")
    else:
        print("! No scaling needed or failed.")
        
    print("\n--- 2. Testing Logic (Dry Run) ---")
    mock_text = "TAX INVOICE\nInvoice No: 123\nTotal: 1000.00"
    result = parse_invoice(mock_text)
    print(f"Parsed Mock Bill No: {result.get('bill_no')}")
    print(f"Parsed Mock Total: {result.get('total_amount')}")
    
    if result.get('bill_no') == '123' and result.get('total_amount') == 1000.0:
        print("✓ Parsing logic verified.")
    else:
        print("! Parsing logic failed.")

    # Cleanup processed temp file
    if os.path.exists(processed_path) and processed_path != dummy_img:
        os.remove(processed_path)

if __name__ == '__main__':
    test_final_stack()
