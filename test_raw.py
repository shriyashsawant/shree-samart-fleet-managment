import sys
sys.path.insert(0, 'ocr_service')
from ocr_engine import extract_text
from ocr_service.preprocessing.image_cleaner import preprocess_image

img = r'C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.30 PM (1).jpeg'

processed = preprocess_image(img)
text = extract_text(processed)
print(text)
