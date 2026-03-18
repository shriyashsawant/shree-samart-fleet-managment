"""
OCR Diagnosis - attempt with PIR disabled
"""

import os
import sys
import traceback

os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'
os.environ['FLAGS_enable_pir_api'] = '0'
os.environ['FLAGS_enable_pir_in_executor'] = '0' 
os.environ['FLAGS_use_mkldnn'] = '0'

IMAGE_PATH = r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.30 PM (1).jpeg"

print("Testing PaddleOCR with PIR disabled...")

from paddleocr import PaddleOCR

try:
    ocr = PaddleOCR(lang='en', ocr_version='PP-OCRv4')
    results = ocr.predict(IMAGE_PATH)
    print(f"SUCCESS! Results: {len(results)}")
    for result in results:
        if hasattr(result, 'rec_texts'):
            for j, text in enumerate(result.rec_texts):
                score = result.rec_scores[j] if hasattr(result, 'rec_scores') else 0
                print(f"  [{score:.3f}] {text}")
except Exception as e:
    print(f"Still failed: {e}")
    traceback.print_exc()
