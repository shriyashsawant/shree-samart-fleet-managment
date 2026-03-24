import requests
import json
import time
import sys
import os

# Add paths
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'ocr_service'))

# Test one document with OCR.space
API_KEY = 'helloworld'
API_URL = 'https://api.ocr.space/parse/image'

filepath = r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH09CU1605\Fitness Certificate -1605.jpeg"
doc_type = "FITNESS"

print(f"Testing: {filepath.split('\\')[-1]} ({doc_type})")

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

print(f"Status: {response.status_code}")
print(f"Content type: {response.headers.get('content-type')}")

text = response.text[:500]
print(f"Response preview: {text}")

result = response.json()
print(json.dumps(result, indent=2))