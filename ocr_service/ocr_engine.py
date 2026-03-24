"""
OCR Engine - Primary: Tesseract (Local), Fallback: OCR.space (Cloud)
Optimized for production reliability on Render.
"""

import requests
import os
import pytesseract
from PIL import Image

# Tesseract Configuration
if os.name == 'nt':
    TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if os.path.exists(TESSERACT_CMD):
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
else:
    # On Render/Linux, it's typically in /usr/bin/tesseract
    tess_bin = '/usr/bin/tesseract'
    if os.path.exists(tess_bin):
        pytesseract.pytesseract.tesseract_cmd = tess_bin

# OCR.space configuration
OCR_SPACE_API_KEY = os.environ.get('OCR_SPACE_API_KEY', 'helloworld')
OCR_SPACE_URL = 'https://api.ocr.space/parse/image'


def extract_with_local(image_path):
    """Extract text from image using local Tesseract OCR"""
    try:
        img = None
        if str(image_path).lower().endswith('.pdf'):
            try:
                from pdf2image import convert_from_path
                # Convert at 150 DPI (Balanced for accuracy vs 512MB RAM)
                images = convert_from_path(image_path, dpi=150, first_page=1, last_page=1)
                if images:
                    img = images[0]
            except Exception as pe:
                print(f"PDF Conversion Error: {pe}")
                raise pe
        else:
            img = Image.open(image_path)
            
        if not img: return None
            
        text = pytesseract.image_to_string(img)
        if text and text.strip():
            return text.strip()
        return None
    except Exception as e:
        print(f"Tesseract OCR error: {e}")
        raise e


def extract_with_ocr_space(image_path):
    """Extract text using OCR.space API (cloud, rate limited)"""
    try:
        with open(image_path, 'rb') as f:
            response = requests.post(
                OCR_SPACE_URL,
                files={'file': f},
                data={
                    'apikey': OCR_SPACE_API_KEY,
                    'language': 'eng',
                    'isOverlayRequired': False,
                    'detectOrientation': True,
                    'scale': True,
                    'OCREngine': 2, # Engine 2 is usually better for invoices/tabular data
                },
                timeout=120
            )
        
        result = response.json()
        
        if not isinstance(result, dict):
            print(f"OCR.space unexpected response type: {type(result)}")
            print(f"Response Snippet: {str(result)[:200]}...")
            return str(result) if isinstance(result, str) else None
            
        if result.get('IsErroredOnProcessing'):
            print(f"OCR.space processing error: {result.get('ErrorMessage')}")
            return None
        
        if result.get('ParsedResults'):
            return result['ParsedResults'][0].get('ParsedText', '')
        
        return None
    except Exception as e:
        print(f"OCR.space error: {e}")
        raise e


def extract_text(image_path):
    """
    Main extraction flow.
    Priority: Tesseract (Cheap/Unlimited) -> OCR.space (Reliable/Fallback)
    """
    # 1. Try Tesseract first (assuming it's installed in production as per user)
    print("Attempting local Tesseract extraction...")
    text = extract_with_local(image_path)
    if text and len(text.strip()) > 50: # Ensure we got more than just junk
        return text.strip()
    
    # 2. Try OCR.space if Tesseract failed or returned insufficient text
    print("Tesseract yielded insufficient results. Falling back to OCR.space...")
    text = extract_with_ocr_space(image_path)
    if text:
        return text.strip()
    
    return None

# Test function
if __name__ == '__main__':
    # Add testing logic here if needed
    pass
