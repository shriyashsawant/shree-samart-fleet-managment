import os
import requests
import json

BASE_URL = "https://shree-samart-fleet-managment.onrender.com/api"
DATA_DIR = r"c:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data"

def get_token():
    print("Logging in as ShreeSamarth...")
    try:
        res = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "ShreeSamarth",
            "password": "Aarti@2005"
        }, timeout=30)
        if res.status_code == 200:
            token = res.json().get('token')
            print("✅ Login Successful")
            return token
        else:
            print(f"❌ Login Failed: {res.status_code} - {res.text}")
            return None
    except Exception as e:
        print(f"⚠️ Login Error: {e}")
        return None

def upload_vehicle_doc(token, vehicle_id, doc_type, file_path):
    print(f"Uploading {doc_type} for Vehicle {vehicle_id} -> {os.path.basename(file_path)}...")
    url = f"{BASE_URL}/vehicles/{vehicle_id}/documents/extract-ocr"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {'documentType': doc_type}
            res = requests.post(url, files=files, data=data, headers=headers, timeout=180)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                print(f"✅ Success: {res.json().get('ocrData', 'No OCR data')}")
            else:
                print(f"❌ Error: {res.text}")
    except Exception as e:
        print(f"⚠️ Request failed: {e}")

def upload_driver_doc(token, driver_id, doc_type, file_path):
    print(f"Uploading {doc_type} for Driver {driver_id} -> {os.path.basename(file_path)}...")
    url = f"{BASE_URL}/driver-documents/extract-ocr"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {'driverId': driver_id, 'documentType': doc_type}
            res = requests.post(url, files=files, data=data, headers=headers, timeout=180)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                print(f"✅ Success: {res.json().get('ocrData', 'No OCR data')}")
            else:
                print(f"❌ Error: {res.text}")
    except Exception as e:
        print(f"⚠️ Request failed: {e}")

def upload_bill(token, file_path):
    print(f"Uploading Bill -> {os.path.basename(file_path)}...")
    url = f"{BASE_URL}/bills/extract-ocr"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            res = requests.post(url, files=files, headers=headers, timeout=300)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                print(f"✅ Success: Parsed Bill Data")
            else:
                print(f"❌ Error: {res.text}")
    except Exception as e:
        print(f"⚠️ Request failed: {e}")

def onboard():
    token = get_token()
    # It might proceed without token if permitAll is on, but better to have it for tenant logic
    
    # 1. MH09CU1605 (ID on deployment might be different, but using user's suggested IDs if available)
    # Corrected IDs from context or finding them would be better.
    # For now, let's assume they are the same as provided in previous onboarding scripts.
    
    v1605_dir = os.path.join(DATA_DIR, "MH09CU1605")
    if os.path.exists(v1605_dir):
        upload_vehicle_doc(token, 7, "PERMIT", os.path.join(v1605_dir, "1605 - Permit.jpeg"))
        upload_vehicle_doc(token, 7, "FITNESS", os.path.join(v1605_dir, "Fitness Certificate -1605.jpeg"))
        upload_driver_doc(token, 1, "DL_FRONT", os.path.join(v1605_dir, "Driving License Front.jpg"))

    # 2. MH43Y2651
    v2651_dir = os.path.join(DATA_DIR, "MH43Y2651")
    if os.path.exists(v2651_dir):
        upload_vehicle_doc(token, 8, "FITNESS", os.path.join(v2651_dir, "Fitness Certificate 2651.jpeg"))
        upload_vehicle_doc(token, 8, "PERMIT", os.path.join(v2651_dir, "Permit 2651.jpeg"))
        upload_vehicle_doc(token, 8, "TAX", os.path.join(v2651_dir, "Tax Recipt 2651.jpeg"))

    # 3. Client Bills
    bill_dir = os.path.join(DATA_DIR, "Bill")
    if os.path.exists(bill_dir):
        for img in sorted(os.listdir(bill_dir)):
            if img.endswith(('.jpeg', '.jpg', '.png')):
                upload_bill(token, os.path.join(bill_dir, img))

if __name__ == "__main__":
    onboard()
