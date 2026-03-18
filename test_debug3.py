import sys
sys.path.insert(0, 'ocr_service')
from ocr_engine import extract_text
from ocr_service.preprocessing.image_cleaner import preprocess_image

test_image = r'C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.32 PM.jpeg'

processed = preprocess_image(test_image)
text = extract_text(processed)
lines = text.split('\n')

print("Keyword positions:")
for i, line in enumerate(lines):
    line_lower = line.lower()
    if 'subtotal' in line_lower:
        print(f"  Line {i}: 'subtotal' in: {line[:50]}")
    if 'cgst' in line_lower:
        print(f"  Line {i}: 'cgst' in: {line[:50]}")
    if 'sgst' in line_lower:
        print(f"  Line {i}: 'sgst' in: {line[:50]}")
    if 'grandtotal' in line_lower or 'grand total' in line_lower:
        print(f"  Line {i}: 'grand total' in: {line[:50]}")

print("\nAll lines with amounts:")
import re
for i, line in enumerate(lines):
    amounts = re.findall(r'[\'\"\-\+]?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)', line)
    if amounts:
        print(f"  Line {i}: {line[:60]} -> amounts: {amounts}")
