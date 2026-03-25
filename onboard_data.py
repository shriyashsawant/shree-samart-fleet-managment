import os
import requests
import json

BASE_URL = "https://shree-samart-fleet-managment.onrender.com/api"
DATA_DIR = r"c:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data"

def upload_vehicle_doc(vehicle_id, doc_type, file_path):
    print(f"Uploading {doc_type} for Vehicle {vehicle_id}...")
    url = f"{BASE_URL}/vehicles/{vehicle_id}/documents/extract-ocr"
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'documentType': doc_type}
        try:
            res = requests.post(url, files=files, data=data, timeout=60)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                print(f"Success: {res.json().get('ocrData', 'No OCR data')}")
            else:
                print(f"Error: {res.text}")
        except Exception as e:
            print(f"Request failed: {e}")

def upload_driver_doc(driver_id, doc_type, file_path):
    print(f"Uploading {doc_type} for Driver {driver_id}...")
    url = f"{BASE_URL}/driver-documents/extract-ocr"
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'driverId': driver_id, 'documentType': doc_type}
        try:
            res = requests.post(url, files=files, data=data, timeout=60)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                print(f"Success: {res.json().get('ocrData', 'No OCR data')}")
            else:
                print(f"Error: {res.text}")
        except Exception as e:
            print(f"Request failed: {e}")

def onboard():
    # 1. MH09CU1605 (ID 7)
    v1605_dir = os.path.join(DATA_DIR, "MH09CU1605")
    upload_vehicle_doc(7, "PERMIT", os.path.join(v1605_dir, "1605 - Permit.jpeg"))
    upload_vehicle_doc(7, "FITNESS", os.path.join(v1605_dir, "Fitness Certificate -1605.jpeg"))
    
    # Janak (ID 1)
    upload_driver_doc(1, "AADHAAR_FRONT", os.path.join(v1605_dir, "Adhhar Card Front Janak.jpg"))
    upload_driver_doc(1, "AADHAAR_BACK", os.path.join(v1605_dir, "Adhaar Card Back Janak.jpg"))
    upload_driver_doc(1, "DL_FRONT", os.path.join(v1605_dir, "Driving License Front.jpg"))
    upload_driver_doc(1, "DL_BACK", os.path.join(v1605_dir, "Driving License Back.jpg"))

    # 2. MH43Y2651 (ID 8)
    v2651_dir = os.path.join(DATA_DIR, "MH43Y2651")
    upload_vehicle_doc(8, "FITNESS", os.path.join(v2651_dir, "Fitness Certificate 2651.jpeg"))
    upload_vehicle_doc(8, "PERMIT", os.path.join(v2651_dir, "Permit 2651.jpeg"))
    upload_vehicle_doc(8, "TAX", os.path.join(v2651_dir, "Tax Recipt 2651.jpeg"))

    # Rabin (ID 3)
    upload_driver_doc(3, "DL_FRONT", os.path.join(v2651_dir, "Driving License Rabin.jpg"))
    upload_driver_doc(3, "AADHAAR_FRONT", os.path.join(v2651_dir, "Rabin Adhaar Front.jpg"))
    upload_driver_doc(3, "AADHAAR_BACK", os.path.join(v2651_dir, "Rabin Adhaar Back.jpg"))

if __name__ == "__main__":
    onboard()
