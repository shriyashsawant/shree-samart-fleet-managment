"""
OCR Engine - Supports both PaddleOCR (local) and OCR.space (cloud)
Use PaddleOCR for unlimited calls, OCR.space as fallback
"""

import requests
import os

# Set Paddle flags for memory efficiency on restricted cloud environments (Render)
"""
OCR Engine - Supports both Tesseract (local) and OCR.space (cloud)
Use Tesseract for unlimited calls, OCR.space as fallback
"""

import requests
import os

# Set Paddle flags for memory efficiency on restricted cloud environments (Render)
os.environ['FLAGS_cpu_num_threads'] = '1'
os.environ['FLAGS_eager_delete_tensor_gb'] = '0.0'
os.environ['FLAGS_fraction_of_gpu_memory_to_use'] = '0.0'
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

# OCR.space configuration
OCR_SPACE_API_KEY = os.environ.get('OCR_SPACE_API_KEY', 'helloworld')
OCR_SPACE_URL = 'https://api.ocr.space/parse/image'


def extract_with_local(image_path):
    """Extract text from image using local Tesseract OCR"""
    if not TESSERACT_AVAILABLE:
        print("Tesseract is not available.")
        return None
        
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        if text and text.strip():
            return text.strip()
        return None
    except Exception as e:
        print(f"Tesseract OCR error: {e}")
        return None


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
                    'OCREngine': 2,
                },
                timeout=30
            )
        
        result = response.json()
        
        if result.get('IsErroredOnProcessing'):
            return None
        
        if result.get('ParsedResults'):
            return result['ParsedResults'][0].get('ParsedText', '')
        
        return None
    except Exception as e:
        print(f"OCR.space error: {e}")
        return None


def extract_text(image_path):
    """
    Extract text from image using available OCR engine
    Priority on Cloud: OCR.space (to save RAM) -> Tesseract
    Priority Local: Tesseract (unlimited) -> OCR.space
    """
    # Detect if we are on Render (Cloud)
    on_render = os.environ.get('RENDER') == 'true'
    
    if on_render:
        print("Running on Render: Prioritizing Cloud OCR...")
        text = extract_with_ocr_space(image_path)
        if text: return text
        return extract_with_local(image_path)
    else:
        # Running locally: Use Tesseract (much faster/unlimited)
        text = extract_with_local(image_path)
        if text: return text
        return extract_with_ocr_space(image_path)

# Test function
if __name__ == '__main__':
    print(f"Tesseract available: {TESSERACT_AVAILABLE}")
