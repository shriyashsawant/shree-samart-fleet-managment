import requests
import json

BASE_URL = "http://localhost:8080/api"

clients = [
    {
        "partyName": "ACC LIMITED",
        "gstNumber": "27AAACA0833F1Z1",
        "address": "Gadchandur, Maharashtra",
        "phone": "9822334455",
        "email": "contact@acclimited.com",
        "dieselProvidedByClient": True
    },
    {
        "partyName": "JSW CEMENT",
        "gstNumber": "27AAACJ4141A1Z9",
        "address": "Dolvi, Maharashtra",
        "phone": "9822334456",
        "email": "support@jswcement.in",
        "dieselProvidedByClient": False
    },
    {
        "partyName": "DALMIA BHARAT",
        "gstNumber": "33AACCD0044A1ZZ",
        "address": "Ariyalur, Tamil Nadu",
        "phone": "9822334457",
        "email": "info@dalmiabharat.com",
        "dieselProvidedByClient": True
    }
]

def onboard_clients():
    print("Onboarding additional clients...")
    for client in clients:
        try:
            res = requests.post(f"{BASE_URL}/clients", json=client)
            if res.status_code == 200:
                print(f"✅ Success: {client['partyName']}")
            else:
                print(f"❌ Error: {client['partyName']} -> {res.text}")
        except Exception as e:
            print(f"⚠️ Request failed for {client['partyName']}: {e}")

if __name__ == "__main__":
    onboard_clients()
