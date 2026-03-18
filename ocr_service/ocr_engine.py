"""
OCR Engine - Supports both PaddleOCR (local) and OCR.space (cloud)
Use PaddleOCR for unlimited calls, OCR.space as fallback
"""

import requests
import os

# Set Paddle flags for memory efficiency on restricted cloud environments (Render)
os.environ['FLAGS_use_mkldnn'] = '0'
os.environ['FLAGS_cpu_num_threads'] = '1'
os.environ['FLAGS_eager_delete_tensor_gb'] = '0.0'
os.environ['FLAGS_fraction_of_gpu_memory_to_use'] = '0.0'
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'

# Try to import PaddleOCR (for production)
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    PADDLE_AVAILABLE = False

# OCR.space configuration
OCR_SPACE_API_KEY = os.environ.get('OCR_SPACE_API_KEY', 'helloworld')
OCR_SPACE_URL = 'https://api.ocr.space/parse/image'


# Initialize OCR models GLOBALLY at startup to avoid downloads during requests
_ocr_instance = None

def get_ocr_instance():
    global _ocr_instance
    if _ocr_instance is None:
        try:
            print("Initializing PaddleOCR models...")
            # Use stable settings for cloud environment
            _ocr_instance = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            print("PaddleOCR models loaded successfully.")
        except Exception as e:
            print(f"CRITICAL: Failed to load PaddleOCR models: {e}")
            return None
    return _ocr_instance

def extract_with_paddle(image_path):
    """Extract text from image using local PaddleOCR"""
    if not PADDLE_AVAILABLE:
        print("PaddleOCR is not available.")
        return None
        
    try:
        ocr = get_ocr_instance()
        if not ocr:
            return None
            
        # Run OCR (v2 returns a list of results)
        result = ocr.ocr(image_path, cls=True)
        
        if result and result[0]:
            # Combine all text lines in the v2 format: [bbox, (text, score)]
            text_lines = []
            for line in result[0]:
                if isinstance(line, list) and len(line) > 1 and isinstance(line[1], (list, tuple)):
                    text_lines.append(line[1][0])
            
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
