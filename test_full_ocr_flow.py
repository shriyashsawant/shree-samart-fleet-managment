import requests
import json
import sys
import os

# Add paths
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'ocr_service'))

# Test all document types with OCR.space
API_KEY = 'helloworld'
API_URL = 'https://api.ocr.space/parse/image'

test_documents = [
    (r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH09CU1605\Fitness Certificate -1605.jpeg", "FITNESS"),
    (r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH09CU1605\1605 - Permit.jpeg", "PERMIT"),
    (r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH09CU1605\Driving License Front.jpg", "LICENSE"),
    (r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH43Y2651\Tax Recipt 2651.jpeg", "TAX"),
]

for filepath, doc_type in test_documents:
    print(f"\n{'='*60}")
    print(f"Document: {filepath.split('\\')[-1]} ({doc_type})")
    print(f"{'='*60}")
    
    try:
        with open(filepath, 'rb') as f:
            response = requests.post(
                API_URL,
                files={'file': f},
                data={
                    'apikey': API_KEY,
                    'language': 'eng',
                    'isOverlayRequired': False,
                    'detectOrientation': True,
                    'scale': True,
                    'OCREngine': 2,
                },
                timeout=60
            )
        
        # Check response type
        try:
            result = response.json()
        except:
            print(f"Response is not JSON: {response.text[:200]}")
            continue
            
        if not isinstance(result, dict):
            print(f"Result is not a dict: {type(result)}")
            continue
            
        if result.get('IsErroredOnProcessing'):
            print(f"OCR Error: {result.get('ErrorMessage')}")
            continue
            
        if result.get('ParsedResults') and isinstance(result.get('ParsedResults'), list):
            parsed_result = result['ParsedResults'][0]
            if isinstance(parsed_result, dict):
                raw_text = parsed_result.get('ParsedText', '')
            else:
                print(f"ParsedResult is not dict: {type(parsed_result)}")
                continue
        else:
            print("No ParsedResults found")
            continue
            
        print(f"Raw text length: {len(raw_text)} chars")
        
        # Now test the parser
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
                
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()

print("\n\n=== ALL TESTS COMPLETE ===")