import sys
sys.path.insert(0, 'ocr_service')
from ocr_engine import extract_text
from ocr_service.preprocessing.image_cleaner import preprocess_image
import re

img = r'C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.30 PM (1).jpeg'

processed = preprocess_image(img)
text = extract_text(processed)
lines = text.split('\n')

print("Finding keywords:")
for i, line in enumerate(lines):
    line_lower = line.lower()
    if 'subtotal' in line_lower or 'sub total' in line_lower or 'sub total:' in line_lower:
        print(f"  Line {i} (basic): {line[:50]}")
    if 'cgst' in line_lower and '@' in line_lower:
        print(f"  Line {i} (cgst): {line[:50]}")
    if 'sgst' in line_lower and '@' in line_lower:
        print(f"  Line {i} (sgst): {line[:50]}")
    if 'grand total' in line_lower or 'grandtotal' in line_lower:
        print(f"  Line {i} (total): {line[:50]}")

print("\nAll amounts found:")
for i, line in enumerate(lines):
    amounts = re.findall(r'[\'\"\-\+]?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)', line)
    if amounts:
        for amt_str in amounts:
            clean = amt_str.replace(',', '').replace("'", '').replace('-', '').replace('+', '').replace('/', '').strip()
            try:
                val = float(clean)
                if val > 100:
                    print(f"  Line {i}: {val} (from: {line[:40]})")
            except:
                pass
