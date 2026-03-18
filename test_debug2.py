import sys
sys.path.insert(0, 'ocr_service')
from ocr_engine import extract_text
from ocr_service.preprocessing.image_cleaner import preprocess_image

test_image = r'C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.32 PM.jpeg'

processed = preprocess_image(test_image)
text = extract_text(processed)
lines = text.split('\n')

print("Full lines around keywords:")
for i in range(28, 38):
    if i < len(lines):
        print(f"Line {i}: '{lines[i]}'")
        # Test the regex
        line_lower = lines[i].lower()
        if 'cgst' in line_lower:
            print(f"  -> Contains 'cgst', checking if 'cgstin': {'cgstin' in line_lower}")
        if 'sgst' in line_lower:
            print(f"  -> Contains 'sgst', checking if 'sgstin': {'sgstin' in line_lower}")
