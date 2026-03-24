"""
OCR Engine - Primary: Tesseract (Local), Fallback: OCR.space (Cloud)
Optimized for production reliability on Render.
"""

import requests
import os
import pytesseract
import gc
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


import cv2
import numpy as np

def preprocess(image):
    """Advanced preprocessing function using Adaptive Thresholding, Deskew, and Border Removal"""
    img = np.array(image)
    
    # 1. Remove Borders first to clean edges (Safe Slicing)
    h, w = img.shape[:2]
    if h > 100 and w > 100:
        img = img[10:-10, 10:-10]
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Deskew Image (Huge accuracy boost)
    # Background is typically white (text is dark), so we bitwise-not it to find text blobs
    coords = np.column_stack(np.where(cv2.bitwise_not(gray) > 0))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
            
        (h, w) = gray.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        gray = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    # 3. Use Grayscale + Adaptive Threshold
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )
    
    return thresh

def extract_with_local(image_path):
    """Extract text from image using local Tesseract OCR"""
    try:
        full_text = []

        if str(image_path).lower().endswith('.pdf'):
            # Ultra-Memory-Safe Segmented PDF processing: Convert to disk-paths only
            print(f"Starting memory-safe PDF extraction for: {image_path}")
            full_text = []
            from pdf2image import convert_from_path
            import tempfile
            
            try:
                # Store images on disk briefly instead of RAM
                with tempfile.TemporaryDirectory() as output_path:
                    print(f"Rasterizing PDF to disk at 100 DPI... (Output: {output_path})")
                    page_paths = convert_from_path(
                        image_path, 
                        dpi=100, 
                        first_page=1, 
                        last_page=2,
                        fmt="jpeg",
                        output_folder=output_path,
                        paths_only=True
                    )
                    
                    print(f"Rasterization complete. Found {len(page_paths)} pages.")
                    
                    for i, p_path in enumerate(page_paths):
                        try:
                            print(f"Processing page {i+1} from disk...")
                            with Image.open(p_path) as img_curr:
                                print(f"Preprocessing page {i+1} (OpenCV filters)...")
                                thresh = preprocess(img_curr)
                                
                                print(f"Running Tesseract on page {i+1}...")
                                page_text = pytesseract.image_to_string(
                                    thresh,
                                    config="--oem 3 --psm 6"
                                )
                                if page_text:
                                    print(f"Successfully extracted {len(page_text)} chars from page {i+1}")
                                    full_text.append(page_text)
                                
                                del thresh
                            
                            # Clean up and flush after each page
                            gc.collect()
                            print(f"Memory flushed after page {i+1}")
                            
                        except Exception as e:
                            print(f"Failed extracting on page {i+1}: {e}")
                            continue
            except Exception as e:
                print(f"Critical PDF Conversion Error: {e}")
            
            print(f"PDF extraction total pages: {len(full_text)}")
            # Final heap cleanup
            gc.collect()
        else:
            # Normal Image Pipeline
            img = Image.open(image_path)
            thresh = preprocess(img)
            text = pytesseract.image_to_string(thresh, config="--oem 3 --psm 6")
            if text:
                full_text.append(text)
                
        # Return list of texts, one per page
        return full_text if full_text else None
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
            return None
            
        if result.get('IsErroredOnProcessing'):
            error_msg = result.get('ErrorMessage')
            print(f"OCR.space processing error: {error_msg}")
            raise Exception(f"OCR.space API Error: {error_msg}")
        
        if result.get('ParsedResults'):
            return [page.get('ParsedText', '') for page in result['ParsedResults']]
        
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
