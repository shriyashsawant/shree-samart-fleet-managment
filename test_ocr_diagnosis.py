"""
OCR Diagnosis Script v2
Tests PaddleOCR v3.4 with PP-OCRv4 (more stable) on the GST bill image.
"""

import os
import sys
import json
import re
import traceback

os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'
# Disable onednn to avoid potential issues
os.environ['FLAGS_use_mkldnn'] = '0'

IMAGE_PATH = r"C:\Users\SHRIYASH SAWANT\OneDrive\Desktop\Shree-Samarth\Shree-Samarth Data\Bill\WhatsApp Image 2026-03-17 at 6.09.30 PM (1).jpeg"

EXPECTED = {
    'company_name': 'SHRI SAMARTH ENTERPRISES',
    'company_gst': '27ASXPPP6488LIZD',
    'company_mobile': '8624077666',
    'party_name': 'PRISM JOHNSON LIMITED',
    'party_gst': '27ASXPP6488L1ZD',
    'party_pan': 'AAACP6224A',
    'bill_no': '02',
    'date': '21/06/2024',
    'hsn_code': '9973',
    'basic_amount': 95000.0,
    'cgst_amount': 8550.0,
    'sgst_amount': 8550.0,
    'total_amount': 112100.0,
    'bank_name': 'Kotak Bank',
    'bank_account_no': '7945113154',
    'bank_ifsc': 'KKBK0000692',
}

print("=" * 70)
print("PADDLEOCR v3.4 DIAGNOSIS")
print("=" * 70)
print(f"Image: {IMAGE_PATH}")
print(f"File exists: {os.path.exists(IMAGE_PATH)}")

from paddleocr import PaddleOCR

# =============================================
# Try PP-OCRv4 (stable, well-known)
# =============================================
print("\n--- Attempting PaddleOCR with PP-OCRv4 ---")
try:
    ocr = PaddleOCR(
        use_textline_orientation=True,
        lang='en',
        ocr_version='PP-OCRv4',
    )
    
    results = ocr.predict(IMAGE_PATH)
    
    print(f"Results count: {len(results)}")
    
    for i, result in enumerate(results):
        print(f"\nResult {i} type: {type(result).__name__}")
        
        # Examine the result structure
        attrs = [a for a in dir(result) if not a.startswith('_')]
        print(f"Public attrs: {attrs}")
        
        # Try to get text data
        text_lines = []
        
        if hasattr(result, 'rec_texts'):
            texts = result.rec_texts
            scores = result.rec_scores if hasattr(result, 'rec_scores') else []
            polys = result.dt_polys if hasattr(result, 'dt_polys') else []
            
            print(f"\nExtracted {len(texts)} text regions:")
            for j in range(len(texts)):
                text = texts[j]
                score = scores[j] if j < len(scores) else 0
                # Get bounding box info if available
                if j < len(polys):
                    poly = polys[j]
                    try:
                        y_center = sum(p[1] for p in poly) / len(poly)
                        x_center = sum(p[0] for p in poly) / len(poly)
                        loc = f"y={y_center:.0f} x={x_center:.0f}"
                    except:
                        loc = "?"
                else:
                    loc = "?"
                
                conf = "OK" if score > 0.8 else "??" if score > 0.5 else "XX"
                print(f"  [{conf} {score:.3f}] ({loc}) {text}")
                text_lines.append({'text': text, 'score': score})
            
            combined = '\n'.join([t['text'] for t in text_lines])
            print(f"\n--- Combined text ---")
            print(combined)
            
            # Save raw text for debugging
            with open('ocr_raw_text_v34.txt', 'w', encoding='utf-8') as f:
                f.write(combined)
            print(f"\nSaved raw text to ocr_raw_text_v34.txt")
            
        else:
            # Try other access patterns
            print(f"No rec_texts attribute. Trying other patterns...")
            for attr in attrs:
                try:
                    val = getattr(result, attr)
                    if callable(val):
                        continue
                    val_str = str(val)[:200]
                    print(f"  {attr}: {val_str}")
                except:
                    pass
    
except Exception as e:
    print(f"PP-OCRv4 failed: {e}")
    traceback.print_exc()
    
    # Try even simpler approach
    print("\n--- Trying PP-OCRv3 ---")
    try:
        ocr = PaddleOCR(
            lang='en',
            ocr_version='PP-OCRv3',
        )
        results = ocr.predict(IMAGE_PATH)
        print(f"PP-OCRv3 results: {len(results)}")
        for i, result in enumerate(results):
            print(f"Result {i} type: {type(result).__name__}")
            if hasattr(result, 'rec_texts'):
                for j, text in enumerate(result.rec_texts):
                    score = result.rec_scores[j] if hasattr(result, 'rec_scores') and j < len(result.rec_scores) else 0
                    print(f"  [{score:.3f}] {text}")
    except Exception as e2:
        print(f"PP-OCRv3 also failed: {e2}")
        traceback.print_exc()

# =============================================
# Test old engine  
# =============================================
print("\n" + "=" * 70)
print("Testing OLD ocr_engine.py")
print("=" * 70)

sys.path.insert(0, 'ocr_service')
try:
    from ocr_engine import extract_with_paddle, PADDLE_AVAILABLE
    print(f"PADDLE_AVAILABLE: {PADDLE_AVAILABLE}")
    
    if PADDLE_AVAILABLE:
        try:
            old_result = extract_with_paddle(IMAGE_PATH)
            if old_result:
                print(f"Old engine returned text ({len(old_result)} chars):")
                print(old_result)
            else:
                print("Old engine returned None!")
        except Exception as e:
            print(f"OLD ENGINE ERROR: {type(e).__name__}: {e}")
            traceback.print_exc()
except Exception as e:
    print(f"Import error: {e}")
    traceback.print_exc()

# =============================================
# Parse with invoice parser
# =============================================
print("\n" + "=" * 70)
print("Testing Invoice Parser")
print("=" * 70)

if 'combined' in dir():
    try:
        from parsers.invoice_parser import parse_invoice
        parsed = parse_invoice(combined)
        
        print(f"\n{'Field':<20} {'Extracted':<35} {'Expected':<35} {'Status'}")
        print("-" * 110)
        
        for field, expected in EXPECTED.items():
            extracted = parsed.get(field)
            if extracted is not None and expected is not None:
                if isinstance(expected, float):
                    match = abs(float(extracted) - expected) < 1.0
                else:
                    match = str(extracted).strip().upper() == str(expected).strip().upper()
            else:
                match = False
            
            status = "PASS" if match else "FAIL"
            print(f"  {field:<20} {str(extracted):<35} {str(expected):<35} {status}")
    except Exception as e:
        print(f"Parser error: {e}")
        traceback.print_exc()
else:
    print("No text to parse (OCR extraction failed)")

print("\nDone!")
