import requests
import os
import json

url = "http://localhost:5001/extract"
image_path = r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.30 PM (1).jpeg"

if not os.path.exists(image_path):
    print(f"Error: File not found at {image_path}")
    exit(1)

try:
    with open(image_path, 'rb') as f:
        files = {'file': f}
        print(f"Sending request to {url}...")
        response = requests.post(url, files=files)
        
        print(f"Status Code: {response.status_code}")
        try:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=2))
        except:
            print("Response Text:")
            print(response.text)
            
except Exception as e:
    print(f"An error occurred: {e}")
