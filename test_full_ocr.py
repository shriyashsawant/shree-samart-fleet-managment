import os
import sys
sys.path.insert(0, 'ocr_service')

from ocr_engine import extract_text
from ocr_service.parsers.invoice_parser import parse_invoice
from ocr_service.preprocessing.image_cleaner import preprocess_image

# Find a test image
bill_dir = 'Shree-Samarth Data/Bill'
test_image = None

# Look for jpeg files
for f in os.listdir(bill_dir):
    if f.lower().endswith(('.jpg', '.jpeg')) and not os.path.isdir(os.path.join(bill_dir, f)):
        test_image = os.path.join(bill_dir, f)
        break

if test_image:
    print(f'Testing with: {os.path.basename(test_image)}')
    print('=' * 50)
    
    # Preprocess
    print('1. Preprocessing image...')
    processed = preprocess_image(test_image)
    print(f'   Processed: {processed}')
    
    # Extract text
    print('2. Extracting text (OCR.space fallback)...')
    text = extract_text(processed)
    print(f'   Extracted {len(text) if text else 0} characters')
    
    if text:
        print('3. Parsing invoice...')
        result = parse_invoice(text)
        
        print('=' * 50)
        print('EXTRACTED DATA:')
        for key, value in result.items():
            if value:
                print(f'  {key}: {value}')
    else:
        print('No text extracted - check OCR API')
else:
    print('No test images found')
