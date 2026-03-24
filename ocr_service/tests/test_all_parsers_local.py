import unittest
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from parsers.invoice_parser import parse_invoice
from parsers.vehicle_parser import parse_rc, parse_fitness, parse_vehicle_document
from parsers.driver_parser import parse_driving_license, parse_aadhaar
from utils.learning_memory import clear_memory
from utils.ocr_utils import detect_document_type

class TestOcrSuite(unittest.TestCase):
    
    def setUp(self):
        clear_memory()

    def test_invoice_parsing(self):
        print("\nTesting Invoice Parser...")
        raw_text = """
        TAX INVOICE 
        Invoice No: 12345
        BILL TO: SHREE SAMARTH ENTERPRISES
        Subtotal: 1000.00
        CGST 9%: 90.00
        SGST 9%: 90.00
        Total: 1180.00
        """
        result = parse_invoice(raw_text)
        self.assertEqual(result['bill_no'], '12345', f"Expected '12345' got {repr(result['bill_no'])}")
        self.assertEqual(result['party_name'], 'SHREE SAMARTH ENTERPRISES', f"Expected 'SHREE SAMARTH ENTERPRISES' got {repr(result['party_name'])}")
        self.assertEqual(result['total_amount'], 1180.0)
        self.assertTrue(result.get('math_valid'))
        print("✓ Invoice parsing OK")

    def test_vehicle_rc_parsing(self):
        print("\nTesting Vehicle RC Parser...")
        raw_text = "REGN NO: MH O9 CU 16O5\nCHASSIS NO: MAT12345678901234\nENGINE NO: ENG987654321\nOWNER: SHRIYASH SAWANT\nMODEL: TATA MOTORS LTD"
        result = parse_rc(raw_text)
        self.assertEqual(result['registration_number'], 'MH09CU1605', f"Expected 'MH09CU1605' got {repr(result['registration_number'])}")
        self.assertEqual(result['owner_name'], 'SHRIYASH SAWANT', f"Expected 'SHRIYASH SAWANT' got {repr(result['owner_name'])}")
        print("✓ Vehicle RC parsing OK")

    def test_fitness_certificate(self):
        print("\nTesting Fitness Certificate...")
        raw_text = "Vehicle No: MH09CU1605\nFitness Valid Upto: 31-Dec-2025"
        result = parse_fitness(raw_text)
        self.assertEqual(result['fitness_validity'], '31-Dec-2025', f"Expected '31-Dec-2025' got {repr(result['fitness_validity'])}")
        print("✓ Fitness certificate parsing OK")

    def test_driving_license(self):
        print("\nTesting Driving License...")
        raw_text = "DL NO: MH 12 2015 0001234\nNAME: SHRIYASH SAWANT\nVALID UNTIL: 20-10-2040"
        result = parse_driving_license(raw_text)
        self.assertEqual(result['license_number'], 'MH1220150001234', f"Expected 'MH1220150001234' got {repr(result['license_number'])}")
        self.assertEqual(result['license_expiry'], '20-10-2040', f"Expected '20-10-2040' got {repr(result['license_expiry'])}")
        print("✓ Driving license parsing OK")

    def test_aadhaar_parsing(self):
        print("\nTesting Aadhaar Parser...")
        raw_text = "Aadhaar No: 1234 5678 9012\nName: SHRIYASH SAWANT\nDOB: 01-01-1995"
        result = parse_aadhaar(raw_text)
        self.assertEqual(result['aadhaar_number'], '123456789012', f"Expected '123456789012' got {repr(result['aadhaar_number'])}")
        self.assertEqual(result['name'], 'SHRIYASH SAWANT', f"Expected 'SHRIYASH SAWANT' got {repr(result['name'])}")
        print("✓ Aadhaar parsing OK")

    def test_auto_detect(self):
        print("\nTesting Auto-detection...")
        invoice_text = "TAX INVOICE BILL TO"
        self.assertEqual(detect_document_type(invoice_text), 'invoice')
        
        rc_text = "REGISTRATION CERTIFICATE CHASSIS NO"
        self.assertEqual(detect_document_type(rc_text), 'vehicle_rc')
        
        dl_text = "DRIVING LICENSE DL NO"
        self.assertEqual(detect_document_type(dl_text), 'driving_license')
        print("✓ Auto-detection OK")

if __name__ == '__main__':
    unittest.main()
