import sys
sys.path.insert(0, 'ocr_service')
from ocr_engine import extract_text
from ocr_service.parsers.invoice_parser import scan_all_amounts_by_position
from ocr_service.preprocessing.image_cleaner import preprocess_image

test_image = r'C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.32 PM.jpeg'

print(f'Testing with: {test_image}')
print('=' * 50)

# Preprocess
processed = preprocess_image(test_image)

# Extract text
text = extract_text(processed)
print(f'Extracted {len(text) if text else 0} characters')

# Debug: show lines
print('=' * 50)
print('LINES WITH AMOUNTS:')
lines = text.split('\n')
for i, line in enumerate(lines):
    amounts = [x for x in line.split() if x.replace(',', '').replace('.', '').isdigit()]
    if amounts or any(k in line.lower() for k in ['subtotal', 'cgst', 'sgst', 'total']):
        print(f'Line {i}: {line[:60]}')

print('=' * 50)
print('SCAN RESULTS:')
results = scan_all_amounts_by_position(text)
for k, v in results.items():
    print(f'  {k}: {v}')
