"""
OCR Engine - Supports both PaddleOCR (local) and OCR.space (cloud)
Use PaddleOCR for unlimited calls, OCR.space as fallback
"""

import requests
import os

# Try to import PaddleOCR (for production)
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    PADDLE_AVAILABLE = False

# OCR.space configuration
OCR_SPACE_API_KEY = os.environ.get('OCR_SPACE_API_KEY', 'helloworld')
OCR_SPACE_URL = 'https://api.ocr.space/parse/image'


def extract_with_paddle(image_path):
    """Extract text using PaddleOCR (local, unlimited)"""
    if not PADDLE_AVAILABLE:
        return None
    
    try:
        # Initialize PaddleOCR (use_angle_cls=True for better accuracy)
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        
        # Run OCR
        result = ocr.ocr(image_path, cls=True)
        
        if result and result[0]:
            # Combine all text lines
            text_lines = []
            for line in result[0]:
                text = line[1][0]  # Text content
                text_lines.append(text)
            
            return '\n'.join(text_lines)
        
        return None
    except Exception as e:
        print(f"PaddleOCR error: {e}")
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
    Priority: PaddleOCR (local) > OCR.space (cloud)
    """
    # Try PaddleOCR first (unlimited, faster)
    if PADDLE_AVAILABLE:
        text = extract_with_paddle(image_path)
        if text:
            return text
    
    # Fallback to OCR.space
    return extract_with_ocr_space(image_path)


# Test function
if __name__ == '__main__':
    print(f"PaddleOCR available: {PADDLE_AVAILABLE}")
    print("To install PaddleOCR: pip install paddlepaddle paddleocr")
