import requests
import os

API_KEY = 'helloworld'
API_URL = 'https://api.ocr.space/parse/image'

documents = {
    'MH09CU1605': [
        '1605 - Permit.jpeg',
        'Fitness Certificate -1605.jpeg',
        'Driving License Front.jpg',
        'Driving License Back.jpg',
        'Adhhar Card Front Janak.jpg',
        'Adhaar Card Back Janak.jpg',
    ],
    'MH43Y2651': [
        'Fitness Certificate 2651.jpeg',
        'Permit 2651.jpeg',
        'Tax Recipt 2651.jpeg',
        'Driving License Rabin.jpg',
        'Rabin Adhaar Front.jpg',
        'Rabin Adhaar Back.jpg',
    ]
}

base_path = r'C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data'

for vehicle, files in documents.items():
    print(f"\n{'='*60}")
    print(f"VEHICLE: {vehicle}")
    print(f"{'='*60}")
    
    for filename in files:
        filepath = os.path.join(base_path, vehicle, filename)
        if not os.path.exists(filepath):
            print(f"\n--- {filename}: FILE NOT FOUND ---")
            continue
            
        print(f"\n--- {filename} ---")
        try:
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
            
            if result.get('IsErroredOnProcessing'):
                print(f"Error: {result.get('ErrorMessage')}")
            elif result.get('ParsedResults'):
                text = result['ParsedResults'][0].get('ParsedText', '')
                print(text)
            else:
                print("No text detected")
                
        except Exception as e:
            print(f"Error: {e}")

print("\n\nDone!")