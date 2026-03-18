import requests
import json
import sys

image_path = r'c:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.30 PM (1).jpeg'

API_KEY = 'K89651872288957'
API_URL = 'https://api.ocr.space/parse/image'

print(f"Testing OCR on: {image_path}", flush=True)

try:
    with open(image_path, 'rb') as f:
        response = requests.post(
            API_URL,
            files={'file': f},
            data={'apikey': API_KEY, 'language': 'eng'},
            timeout=60
        )
    
    print(f"Status: {response.status_code}", flush=True)
    
    result = response.json()
    print(json.dumps(result, indent=2), flush=True)
    
    if result.get('ParsedResults'):
        text = result['ParsedResults'][0].get('ParsedText', '')
        print("\n=== EXTRACTED TEXT ===")
        print(text)
        print("=== END TEXT ===")
        
        # Save to file
        with open('ocr_raw_text.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        print("\nSaved to ocr_raw_text.txt")
    else:
        print("No ParsedResults in response")
        
except Exception as e:
    print(f"Error: {e}", flush=True)
    import traceback
    traceback.print_exc()
