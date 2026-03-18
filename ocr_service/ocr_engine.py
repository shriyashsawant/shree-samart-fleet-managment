"""
OCR Engine Module
Handles image preprocessing and OCR API calls
"""

import cv2
import numpy as np
import requests
import os
import tempfile

OCR_API_URL = 'https://api.ocr.space/parse/image'
OCR_API_KEY = os.environ.get('OCR_API_KEY', 'helloworld')


def preprocess_image(image_path):
    """Preprocess image to improve OCR accuracy"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return image_path
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding
        thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
        
        # Save processed
        temp_path = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False).name
        cv2.imwrite(temp_path, denoised)
        
        return temp_path
    except Exception as e:
        print(f"Preprocessing error: {e}")
        return image_path


def extract_text(image_path):
    """Extract text from image using OCR.space API"""
    try:
        processed_path = preprocess_image(image_path)
        
        with open(processed_path, 'rb') as f:
            response = requests.post(
                OCR_API_URL,
                files={'file': f},
                data={
                    'apikey': OCR_API_KEY,
                    'language': 'eng',
                    'isOverlayRequired': 'false',
                }
            )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ParsedResults'):
                return result['ParsedResults'][0].get('ParsedText', '')
        return ''
    except Exception as e:
        print(f"OCR API Error: {e}")
        return ''
