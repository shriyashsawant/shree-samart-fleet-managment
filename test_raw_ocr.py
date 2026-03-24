import requests
import json

# Test Fitness Certificate to see raw text
API_KEY = 'helloworld'
API_URL = 'https://api.ocr.space/parse/image'

filepath = r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH09CU1605\Fitness Certificate -1605.jpeg"

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

result = response.json()
raw_text = result['ParsedResults'][0].get('ParsedText', '')

print("=== RAW OCR TEXT ===")
print(raw_text)
print("\n=== CHECKING FOR KEY FIELDS ===")

# Check what patterns we can find
import re

# Chassis Number
chassis = re.search(r'(?:Chassis\s*No|Chassis)[:\s]*([A-Z0-9]{10,20})', raw_text, re.IGNORECASE)
print(f"Chassis pattern match: {chassis.group(1) if chassis else 'NOT FOUND'}")

# Engine Number  
engine = re.search(r'(?:Engine\s*No|Engine\s*No)[:\s]*([A-Z0-9]{6,20})', raw_text, re.IGNORECASE)
print(f"Engine pattern match: {engine.group(1) if engine else 'NOT FOUND'}")

# Certificate expires
exp = re.search(r'(?:Certificate\s*will\s*expire\s*on|Expires?\s*on)[:\s]*(\d{1,2}[-/]\w+[-/\s]\d{4})', raw_text, re.IGNORECASE)
print(f"Expires pattern match: {exp.group(1) if exp else 'NOT FOUND'}")

# Try more flexible pattern for chassis
chassis2 = re.search(r'(MAT[A-Z0-9]{13})', raw_text)
print(f"Alternative chassis: {chassis2.group(1) if chassis2 else 'NOT FOUND'}")

# Try more flexible pattern for engine
engine2 = re.search(r'(\d{12,})', raw_text)
print(f"Alternative engine: {engine2.group(1) if engine2 else 'NOT FOUND'}")

# Try more flexible pattern for expiry
exp2 = re.search(r'(11-Feb-2027)', raw_text)
print(f"Alternative expiry: {exp2.group(1) if exp2 else 'NOT FOUND'}")