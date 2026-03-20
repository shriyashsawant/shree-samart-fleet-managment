import unittest
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from parsers.invoice_parser import parse_invoice
from utils.learning_memory import apply_corrections, learn_correction, clear_memory

class TestOcrParsing(unittest.TestCase):

    def setUp(self):
        clear_memory()

    def test_invoice_parsing_math_validation(self):
        # Case 1: Exact matches (User's Example)
        raw_text = """
        TAX INVOICE 
        In No: 03
        BILL TO: PRISM JOHNSON LTD
        Subtotal: 95000.00
        CGST 9%: 8550.00
        SGST 9%: 8550.00
        Grand Total: 112100.00
        """
        result = parse_invoice(raw_text)
        print(f"DEBUG Result: {result}")
        self.assertEqual(result['bill_no'], '03')
        self.assertEqual(result['party_name'], 'PRISM JOHNSON LTD')
        self.assertEqual(result['basic_amount'], 95000.0)
        self.assertEqual(result['total_amount'], 112100.0)
        self.assertTrue(result.get('math_valid'))

    def test_back_calculation(self):
        # Case 2: Only total is present, back-calculate basic
        raw_text = """
        TAX INVOICE
        Amount Payable: 112,100
        """
        result = parse_invoice(raw_text)
        self.assertEqual(result['total_amount'], 112100.0)
        self.assertAlmostEqual(result['basic_amount'], 95000.0, delta=1)
        self.assertTrue(result.get('math_valid'))

    def test_learning_memory(self):
        # Initial extraction with OCR error
        raw_text = "BILL TO: PRSM JHNSON"
        memory = {'corrections': {}, 'party_names': [], 'company_names': []}
        
        # Apply corrections (should do nothing yet)
        corrected_text = apply_corrections(raw_text, memory)
        self.assertEqual(corrected_text, raw_text)
        
        # Learn correction
        learn_correction("PRSM JHNSON", "PRISM JOHNSON")
        
        # Re-apply corrections with new memory
        from utils.learning_memory import load_memory
        memory = load_memory()
        corrected_text = apply_corrections(raw_text, memory)
        
        self.assertEqual(corrected_text, "BILL TO: PRISM JOHNSON")
        
        # Check parsing with learned text
        result = parse_invoice(corrected_text)
        self.assertEqual(result['party_name'], 'PRISM JOHNSON')

    def test_party_name_cleaning(self):
        raw_text = "BILL TO : PRISM JOHNSON LTD, MAHARASHTRA, 411001"
        result = parse_invoice(raw_text)
        self.assertEqual(result['party_name'], 'PRISM JOHNSON LTD')

if __name__ == '__main__':
    unittest.main()
