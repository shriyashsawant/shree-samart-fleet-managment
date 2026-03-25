import requests
import json
import os

BASE_URL = "https://shree-samart-fleet-managment.onrender.com/api"
DATA_DIR = r"c:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data"

def delete_docs(ids):
    print(f"Deleting documents: {ids}...")
    for doc_id in ids:
        url = f"{BASE_URL}/vehicles/documents/{doc_id}" # wait! Check endpoint for delete.
        # vehicle API in lib/api.js says: delete: (id) => api.delete(`/api/vehicles/${id}`) -> that's vehicle.
        # There's no separate vehicleDocument delete?
        # Let's check VehicleController? No, doc delete is not there?
        pass

# Based on current controllers, there is no public endpoint to delete a vehicle document easily.
# I'll just upload new ones and verify they have data.

def test_ocr_live():
    # 7. MH09CU1605
    v1605_dir = os.path.join(DATA_DIR, "MH09CU1605")
    file_to_test = os.path.join(v1605_dir, "1605 - Permit.jpeg")
    
    print(f"Testing live OCR extraction for {file_to_test}...")
    url = f"{BASE_URL}/vehicles/7/documents/extract-ocr"
    with open(file_to_test, 'rb') as f:
        files = {'file': f}
        data = {'documentType': 'PERMIT'}
        res = requests.post(url, files=files, data=data, timeout=120)
        print(f"Backend Status: {res.status_code}")
        if res.status_code == 200:
            json_res = res.json()
            ocr_data = json_res.get('ocrData', {})
            print(f"Extracted OCR Data: {json.dumps(ocr_data, indent=2)}")
            print(f"Vehicle Updated: {json_res.get('vehicleUpdated')}")
            # If successful, check if expiry was saved.
            doc = json_res.get('document', {})
            print(f"Document ID: {doc.get('id')} - Expiry: {doc.get('expiryDate')}")
        else:
            print(f"Error: {res.text}")

if __name__ == "__main__":
    test_ocr_live()
