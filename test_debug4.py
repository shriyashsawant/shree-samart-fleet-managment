import sys
sys.path.insert(0, 'ocr_service')
from ocr_engine import extract_text
from ocr_service.preprocessing.image_cleaner import preprocess_image
import re

test_image = r'C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.32 PM.jpeg'

processed = preprocess_image(test_image)
text = extract_text(processed)
lines = text.split('\n')

# Manual test of the scanning logic
scan_order = [
    ('basic_amount', ['subtotal', 'sub total']),
    ('cgst_amount', ['cgst', 'cgs3']),
    ('sgst_amount', ['sgst', 'sgs1']),
    ('total_amount', ['grand total', 'grandtotal']),
]

for field, keywords in scan_order:
    print(f"\n=== Looking for {field} (keywords: {keywords}) ===")
    
    # Find keyword line
    keyword_line = None
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(kw in line_lower for kw in keywords):
            keyword_line = i
            print(f"Found keyword at line {i}: {line[:50]}")
            break
    
    if keyword_line is not None:
        # Look for amounts in the lines after the keyword
        for j in range(keyword_line + 1, min(keyword_line + 6, len(lines))):
            check_line = lines[j]
            amounts = re.findall(r'[\'\"\-\+]?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)', check_line)
            
            print(f"  Line {j}: {check_line[:40]} -> amounts: {amounts}")
            
            for amt_str in amounts:
                try:
                    clean_amt = amt_str.replace(',', '').replace("'", '').replace('-', '').replace('+', '').strip()
                    if not clean_amt:
                        continue
                    val = float(clean_amt)
                    if val > 100:
                        print(f"    -> Selected: {val}")
                        break
                except:
                    pass
