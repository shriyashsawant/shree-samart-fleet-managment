import os
import sys

# Set Paddle flags to avoid PIR error
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'
os.environ['FLAGS_enable_pir_api'] = '0'
os.environ['FLAGS_enable_pir_in_executor'] = '0' 
os.environ['FLAGS_use_mkldnn'] = '0'

# Add paths
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'ocr_service'))

from ocr_service.ocr_engine import extract_with_paddle

# Test documents
test_documents = [
    (r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH09CU1605\Fitness Certificate -1605.jpeg", "FITNESS"),
    (r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH09CU1605\1605 - Permit.jpeg", "PERMIT"),
    (r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH09CU1605\Driving License Front.jpg", "LICENSE"),
    (r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH43Y2651\Tax Recipt 2651.jpeg", "TAX"),
]

for filepath, doc_type in test_documents:
    print(f"\n{'='*60}")
    print(f"Document: {os.path.basename(filepath)} ({doc_type})")
    print(f"{'='*60}")
    
    try:
        raw_text = extract_with_paddle(filepath)
        
        if raw_text:
            print(f"Extracted {len(raw_text)} characters")
            
            # Parse based on document type
            if doc_type == "FITNESS":
                from ocr_service.parsers.vehicle_parser import parse_vehicle_document
                parsed = parse_vehicle_document(raw_text, 'fitness')
            elif doc_type == "PERMIT":
                from ocr_service.parsers.vehicle_parser import parse_vehicle_document
                parsed = parse_vehicle_document(raw_text, 'permit')
            elif doc_type == "LICENSE":
                from ocr_service.parsers.driver_parser import parse_driver_document
                parsed = parse_driver_document(raw_text, 'driving_license')
            elif doc_type == "TAX":
                from ocr_service.parsers.vehicle_parser import parse_vehicle_document
                parsed = parse_vehicle_document(raw_text, 'tax_receipt')
            
            print("PARSED FIELDS:")
            for key, value in parsed.items():
                if value:
                    print(f"  {key:30}: {value}")
        else:
            print("No text extracted")
            
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()

print("\n\n=== ALL TESTS COMPLETE ===")