import requests
import json
import sys

# Test the OCR service with a vehicle document
image_path = r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\MH09CU1605\Fitness Certificate -1605.jpeg"

url = "http://localhost:5000/extract"

print(f"Testing OCR extraction on {image_path}")

with open(image_path, 'rb') as f:
    files = {'file': f}
    response = requests.post(url, files=files)

print(f"Status: {response.status_code}")

result = response.json()
print(json.dumps(result, indent=2))