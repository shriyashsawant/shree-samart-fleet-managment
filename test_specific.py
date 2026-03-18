import sys
sys.path.insert(0, 'ocr_service')
from ocr_engine import extract_text
from ocr_service.parsers.invoice_parser import parse_invoice
from ocr_service.preprocessing.image_cleaner import preprocess_image

test_image = r'C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.32 PM.jpeg'

print(f'Testing with: {test_image}')
print('=' * 50)

# Preprocess
print('1. Preprocessing image...')
processed = preprocess_image(test_image)

# Extract text
print('2. Extracting text...')
text = extract_text(processed)
print(f'Extracted {len(text) if text else 0} characters')
print('=' * 50)
print('RAW OCR TEXT:')
print(text[:2000] if text else 'No text')
print('=' * 50)

# Parse
if text:
    result = parse_invoice(text)
    print('EXTRACTED DATA:')
    for key, value in result.items():
        if value:
            print(f'  {key}: {value}')
