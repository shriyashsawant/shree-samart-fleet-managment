import sys
sys.path.insert(0, 'ocr_service')
from ocr_engine import extract_text
from ocr_service.parsers.invoice_parser import parse_invoice
from ocr_service.preprocessing.image_cleaner import preprocess_image

# Test with different images
test_images = [
    r'C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.30 PM (1).jpeg',
    r'C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.29 PM.jpeg',
]

for img in test_images:
    print(f'\n{"="*50}')
    print(f'Testing: {img.split("/")[-1]}')
    print('='*50)
    
    try:
        processed = preprocess_image(img)
        text = extract_text(processed)
        print(f'Extracted {len(text) if text else 0} characters')
        
        if text:
            result = parse_invoice(text)
            print('EXTRACTED DATA:')
            for key, value in result.items():
                if value:
                    print(f'  {key}: {value}')
    except Exception as e:
        print(f'Error: {e}')
