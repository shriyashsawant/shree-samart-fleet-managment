import requests
import os

url = "http://localhost:5001/extract"
with open("test_file.txt", "w") as f:
    f.write("dummy content")

try:
    with open("test_file.txt", "rb") as f:
        files = {"file": f}
        response = requests.post(url, files=files)
        print(response.status_code)
        print(response.json())
except Exception as e:
    print(f"Error: {e}")
finally:
    if os.path.exists("test_file.txt"):
        os.remove("test_file.txt")
