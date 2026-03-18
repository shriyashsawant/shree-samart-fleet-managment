"""
Image Preprocessing Module
Clean and enhance images for better OCR accuracy
"""

import cv2
import numpy as np
import tempfile


def preprocess_image(image_path):
    """Preprocess image to improve OCR accuracy"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return image_path
        
        # Step 1: Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Step 2: Apply adaptive thresholding (better than simple threshold)
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Step 3: Denoise
        denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
        
        # Step 4: Sharpen (optional, can help with blurry images)
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(denoised, -1, kernel)
        
        # Save processed image
        temp_path = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False).name
        cv2.imwrite(temp_path, sharpened)
        
        return temp_path
    except Exception as e:
        print(f"Preprocessing error: {e}")
        return image_path


def deskew_image(image_path):
    """Deskew an image if it's rotated"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return image_path
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        coords = np.column_stack(np.where(gray < 200))
        
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            
            if abs(angle) > 0.5:
                (h, w) = img.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                rotated = cv2.warpAffine(img, M, (w, h), 
                                        flags=cv2.INTER_CUBIC, 
                                        borderMode=cv2.BORDER_REPLICATE)
                
                temp_path = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False).name
                cv2.imwrite(temp_path, rotated)
                return temp_path
        
        return image_path
    except Exception as e:
        print(f"Deskew error: {e}")
        return image_path


def remove_noise(image_path):
    """Remove noise from image"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return image_path
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Morphological operations to remove small noise
        kernel = np.ones((2,2), np.uint8)
        opening = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel)
        
        temp_path = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False).name
        cv2.imwrite(temp_path, opening)
        
        return temp_path
    except Exception as e:
        print(f"Noise removal error: {e}")
        return image_path
