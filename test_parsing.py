import sys
import os

# Add paths
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'ocr_service'))

# Test parsing with sample OCR text from the Fitness Certificate
fitness_text = """
GOVERNMENT OF MAHARASHTRA
Motor Vehicle Department
KOLHAPUR
FORM 38
[See Rule 62(1)]
CERTIFICATE OF FITNESS
(Applicable in the case of transport vehicles only)
Vehicle No: MH09CU1605(Goods Carrier) is certified as complying with the provisions of the Motor vehicles Act, 1988 and
the rules made there under.
Registration No : MH09CU1605
Application No : MH260122V3224498
Inspection Fee Receipt No : MH260122C0480108
Receipt Date : 22-Jan-2026
Chassis No : MAT448062D3E10979
Engine No : 59180323163327001
Seating Capacity : 3 (Including Driver)
Type of Body : TRUCK (CLOSED BODY)
Manufacturing Year : 2013
Category of Vehicle : HGV
Inspected on : 12-Feb-2026
Printed on : 12-Feb-2026 15:59:55
Certificate will expire on : 11-Feb-2027
Next Inspection Due Date : 14-Dec-2026
"""

permit_text = """
FRESH PERMIT
Date of Approval: 10-Nov-2023
TRANSPORT DEPARTMENT, MAHARASHTRA
PERMIT IN RESPECT OF GOODS PERMIT (HGV-GOODS PERMIT)
PART-A
MH2023-GP-0852K
NEW SUPERTECH READY MIX CONCRETE
NA
538 SHIYE PHATA OPP LOKMAT PRESS TOP TAL-
HATKANANGALE, Maharashtra Kolhapur-416122
MH09CU1605
16-Dec-2013
TATA MOTORS LTD/LPK 2518TC BSIII/38/G750
MAT448062D3E10979
B591803231E63327001
Goods Carrier
3
Permit No: MH2023-GP-0852K
Validity of the Permit:
From: 10-Nov-2023
To: 09-Nov-2028
"""

tax_text = """
TAX RECEIPT
Transport Department, Government of Maharashtra
Registration Authority KOLHAPUR, Maharashtra
Application No. / Receipt No. :
Received From:
MH231020V2707364 / MH231020C005950
0
dlld
AARTI PATIL
ater
Transaction Date:
20-0ct-2023 10:11 AM
Chasis No:
MC236GRC0EA0XXXXX
GRN No:
transaction identification numb
MHY2310200305572
Period: 01-May-2023 to 30-Apr-2024
Amount (in Rs): 2250.0
Total: 2520
Vehicle No: MH43Y2651
Payment Date: 2023-10-20
"""

license_text = """
Indian Union Driving Licence
Issued by MAHARASTRA STATE
MH12 20210046267
Issue Date Validity (NT) Validity(TR)
11-01-2023 13-02-2041
10-01-2028
2000
Holders Signal
Organ Donor: N
Name: JANAK BISWAKARMA
Date of Birth: 04-07-1999
Blood Group:
Son/Daughter/Wife of: AMAR BISWAKARMA
Address:
Near D Mart s.n 27 hiss no 18/1
Kondhva bK PUNE
DL NO: MH12 20210046267
"""

from ocr_service.parsers.vehicle_parser import parse_vehicle_document
from ocr_service.parsers.driver_parser import parse_driver_document

print("="*60)
print("TESTING FITNESS CERTIFICATE PARSING")
print("="*60)
result = parse_vehicle_document(fitness_text, 'fitness')
for key, value in result.items():
    if value:
        print(f"{key:30}: {value}")

print("\n" + "="*60)
print("TESTING PERMIT PARSING")
print("="*60)
result = parse_vehicle_document(permit_text, 'permit')
for key, value in result.items():
    if value:
        print(f"{key:30}: {value}")

print("\n" + "="*60)
print("TESTING TAX RECEIPT PARSING")
print("="*60)
result = parse_vehicle_document(tax_text, 'tax_receipt')
for key, value in result.items():
    if value:
        print(f"{key:30}: {value}")

print("\n" + "="*60)
print("TESTING DRIVING LICENSE PARSING")
print("="*60)
result = parse_driver_document(license_text, 'driving_license')
for key, value in result.items():
    if value:
        print(f"{key:30}: {value}")

print("\n" + "="*60)
print("AUTO-DETECT TEST (Permit text without specifying type)")
print("="*60)
result = parse_vehicle_document(permit_text, 'unknown')
for key, value in result.items():
    if value:
        print(f"{key:30}: {value}")

print("\n\nDone!")