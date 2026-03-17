# Shree Samarth Enterprises - Fleet Management & Billing System

## 1. Project Overview

**Project Name:** Shree Samarth Fleet Management System
**Project Type:** Full-stack Web Application (ERP for Construction Fleet)
**Core Functionality:** Comprehensive fleet management for 3 cement mixers with billing, expense tracking, driver management, maintenance scheduling, and compliance reminders
**Target Users:** Business owner (Mrs. Owner of Shree Samarth Enterprises)

---

## 2. Tech Stack

### Backend
- **Framework:** Spring Boot 3.x
- **Database:** MySQL (via JPA/Hibernate)
- **Authentication:** JWT-based
- **File Storage:** Local storage with MultipartFile
- **API Style:** RESTful

### Frontend
- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS
- **Charts:** Chart.js with react-chartjs-2
- **HTTP Client:** Axios
- **Routing:** React Router DOM
- **Icons:** Lucide React

---

## 3. Database Schema

### Tables

#### users
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment |
| username | VARCHAR(50) | Unique |
| password | VARCHAR(255) | BCrypt hashed |
| role | VARCHAR(20) | ADMIN/OWNER |
| created_at | TIMESTAMP | Creation date |

#### vehicles
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment |
| vehicle_number | VARCHAR(20) | Unique (e.g., MH12AB1234) |
| model | VARCHAR(100) | Vehicle model name |
| purchase_date | DATE | Date of purchase |
| chassis_number | VARCHAR(50) | Chassis number |
| engine_number | VARCHAR(50) | Engine number |
| insurance_company | VARCHAR(100) | Insurance provider |
| insurance_expiry | DATE | Insurance expiry |
| emi_amount | DECIMAL(10,2) | Monthly EMI |
| emi_bank | VARCHAR(100) | Bank name |
| emi_start_date | DATE | EMI start |
| emi_end_date | DATE | EMI end |
| status | VARCHAR(20) | ACTIVE/UNDER_MAINTENANCE |
| created_at | TIMESTAMP | Creation date |

#### vehicle_documents
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment |
| vehicle_id | BIGINT (FK) | Reference to vehicle |
| document_type | VARCHAR(50) | RC/INSURANCE/PUC/PASSING |
| document_name | VARCHAR(100) | File name |
| file_path | VARCHAR(255) | Storage path |
| expiry_date | DATE | Document expiry |
| created_at | TIMESTAMP | Upload date |

#### drivers
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment |
| name | VARCHAR(100) | Driver name |
| phone | VARCHAR(15) | Phone number |
| address | TEXT | Full address |
| aadhaar_number | VARCHAR(12) | Aadhaar ID |
| driving_license | VARCHAR(20) | License number |
| license_expiry | DATE | License expiry |
| salary | DECIMAL(10,2) | Monthly salary |
| joining_date | DATE | Start date |
| end_date | DATE | End date (nullable) |
| assigned_vehicle_id | BIGINT (FK) | Current vehicle |
| status | VARCHAR(20) | ACTIVE/LEFT |
| license_file_path | VARCHAR(255) | License PDF |
| aadhaar_file_path | VARCHAR(255) | Aadhaar PDF |
| created_at | TIMESTAMP | Creation date |

#### expenses
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment |
| vehicle_id | BIGINT (FK) | Reference to vehicle |
| expense_type | VARCHAR(50) | DIESEL/AIR/PUNCTURE/WASHING/FOOD |
| amount | DECIMAL(10,2) | Expense amount |
| date | DATE | Expense date |
| diesel_provided_by_client | BOOLEAN | Diesel flag |
| notes | TEXT | Additional notes |
| bill_file_path | VARCHAR(255) | Bill receipt |
| created_at | TIMESTAMP | Creation date |

#### maintenance
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment |
| vehicle_id | BIGINT (FK) | Reference to vehicle |
| maintenance_type | VARCHAR(50) | OIL/grease/FILTER/TYRE/BATTERY |
| date | DATE | Maintenance date |
| cost | DECIMAL(10,2) | Cost incurred |
| next_due_date | DATE | Next due |
| bill_file_path | VARCHAR(255) | Bill receipt |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP | Creation date |

#### payments
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment |
| payment_type | VARCHAR(50) | SALARY/EMI/MAINTENANCE |
| vehicle_id | BIGINT (FK) | Reference to vehicle |
| driver_id | BIGINT (FK) | Reference to driver |
| amount | DECIMAL(10,2) | Payment amount |
| payment_date | DATE | Date of payment |
| month | VARCHAR(10) | Salary month |
| payment_method | VARCHAR(50) | CASH/ONLINE/CHEQUE |
| status | VARCHAR(20) | PAID/PENDING |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP | Creation date |

#### clients
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment |
| party_name | VARCHAR(100) | Company/Party name |
| gst_number | VARCHAR(20) | GSTIN |
| address | TEXT | Full address |
| phone | VARCHAR(15) | Contact number |
| email | VARCHAR(100) | Email address |
| created_at | TIMESTAMP | Creation date |

#### bills
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment |
| bill_no | VARCHAR(20) | Bill number |
| bill_date | DATE | Bill date |
| client_id | BIGINT (FK) | Reference to client |
| vehicle_id | BIGINT (FK) | Reference to vehicle |
| hsn_code | VARCHAR(10) | HSN code |
| basic_amount | DECIMAL(12,2) | Base amount |
| gst_percentage | DECIMAL(5,2) | GST % |
| cgst_amount | DECIMAL(12,2) | CGST |
| sgst_amount | DECIMAL(12,2) | SGST |
| pf_amount | DECIMAL(10,2) | P/F charges |
| total_amount | DECIMAL(12,2) | Final total |
| bill_type | VARCHAR(50) | RENT/SERVICE |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP | Creation date |

#### reminders
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment |
| reminder_type | VARCHAR(50) | LICENSE/INSURANCE/PUC/RC/MAINTENANCE |
| reference_id | BIGINT | Related entity ID |
| reference_type | VARCHAR(50) | DRIVER/VEHICLE |
| title | VARCHAR(100) | Reminder title |
| description | TEXT | Details |
| expiry_date | DATE | Due date |
| status | VARCHAR(20) | PENDING/COMPLETED |
| created_at | TIMESTAMP | Creation date |

---

## 4. UI/UX Specification

### Color Palette
- **Primary:** #1E3A5F (Deep Navy Blue)
- **Secondary:** #F59E0B (Amber/Gold - Construction theme)
- **Accent:** #10B981 (Emerald Green - Success)
- **Danger:** #EF4444 (Red - Alerts)
- **Background:** #F8FAFC (Light Gray)
- **Card Background:** #FFFFFF (White)
- **Text Primary:** #1F2937 (Dark Gray)
- **Text Secondary:** #6B7280 (Medium Gray)

### Typography
- **Font Family:** 'Inter', sans-serif
- **Headings:** Bold, sizes: h1=32px, h2=24px, h3=20px, h4=16px
- **Body:** Regular, 14px
- **Small:** 12px

### Layout
- **Sidebar:** Fixed left, 260px width, collapsible
- **Header:** Fixed top, 64px height
- **Content:** Responsive grid with cards
- **Breakpoints:** Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)

### Components
- Cards with shadows and rounded corners (8px)
- Buttons: Primary (filled), Secondary (outline), Danger (red)
- Form inputs with labels and validation
- Tables with pagination
- Charts for analytics
- Status badges (Active=green, Under Maintenance=amber, Left=red)
- Alert banners for reminders

---

## 5. Pages & Features

### 5.1 Login Page
- Username/Password form
- JWT token storage
- Redirect to dashboard

### 5.2 Dashboard
- Stats cards: Total Vehicles, Active Drivers, Monthly Revenue, Monthly Expenses
- Upcoming renewals/reminders list
- Profit chart (last 6 months)
- Vehicle performance comparison
- Quick action buttons

### 5.3 Vehicle Management
- Vehicle list with filters
- Add/Edit vehicle form
- Vehicle detail view with tabs:
  - Overview (basic info)
  - Documents (RC, Insurance, PUC, Passing)
  - Drivers (history)
  - Expenses (daily + maintenance)
  - Billing (associated bills)
- Document upload with expiry tracking

### 5.4 Driver Management
- Driver list with status filter
- Add/Edit driver form
- Driver detail view:
  - Personal info
  - License details with expiry
  - Salary history
  - Assigned vehicle history
- License PDF upload

### 5.5 Expense Tracking
- Expense list with filters (date, vehicle, type)
- Add expense form:
  - Vehicle selection
  - Expense type dropdown
  - Amount, date, notes
  - Diesel provided by client checkbox
  - Bill upload
- Maintenance expense with next due date
- Monthly expense summary

### 5.6 Payment Management
- Payment list with filters
- Add payment form:
  - Payment type (Salary/EMI/Maintenance)
  - Vehicle, Driver selection
  - Amount, date, method
  - Month for salary
- Payment history per vehicle/driver

### 5.7 Client Management
- Client list
- Add/Edit client form
- Client detail with billing history

### 5.8 Billing
- Bill list with filters
- Create bill form:
  - Bill number (auto-generated)
  - Date, Client selection
  - Vehicle selection
  - HSN Code
  - Basic Amount
  - GST % (auto-fill)
  - Auto-calculate CGST, SGST, Total
  - P/F charges
  - Bill type
- Bill preview/print
- Bill PDF generation

### 5.9 Reminders
- All pending reminders
- Filter by type
- Mark as completed
- Dashboard alerts integration

### 5.10 Reports
- Monthly profit report
- Vehicle-wise revenue/expense
- Driver salary report
- Expense breakdown pie chart

---

## 6. API Endpoints

### Auth
- POST /api/auth/login
- GET /api/auth/me

### Vehicles
- GET /api/vehicles
- GET /api/vehicles/{id}
- POST /api/vehicles
- PUT /api/vehicles/{id}
- DELETE /api/vehicles/{id}
- GET /api/vehicles/{id}/documents
- POST /api/vehicles/{id}/documents

### Drivers
- GET /api/drivers
- GET /api/drivers/{id}
- POST /api/drivers
- PUT /api/drivers/{id}
- DELETE /api/drivers/{id}
- GET /api/drivers/vehicle/{vehicleId}

### Expenses
- GET /api/expenses
- GET /api/expenses/{id}
- POST /api/expenses
- PUT /api/expenses/{id}
- DELETE /api/expenses/{id}
- GET /api/expenses/vehicle/{vehicleId}

### Maintenance
- GET /api/maintenance
- GET /api/maintenance/{id}
- POST /api/maintenance
- PUT /api/maintenance/{id}
- DELETE /api/maintenance/{id}
- GET /api/maintenance/vehicle/{vehicleId}

### Payments
- GET /api/payments
- GET /api/payments/{id}
- POST /api/payments
- PUT /api/payments/{id}
- DELETE /api/payments/{id}

### Clients
- GET /api/clients
- GET /api/clients/{id}
- POST /api/clients
- PUT /api/clients/{id}
- DELETE /api/clients/{id}

### Bills
- GET /api/bills
- GET /api/bills/{id}
- POST /api/bills
- PUT /api/bills/{id}
- DELETE /api/bills/{id}
- GET /api/bills/vehicle/{vehicleId}

### Reminders
- GET /api/reminders
- GET /api/reminders/pending
- PUT /api/reminders/{id}/complete

### Dashboard
- GET /api/dashboard/stats
- GET /api/dashboard/charts

---

## 7. Acceptance Criteria

1. ✅ User can login with credentials
2. ✅ Dashboard shows all key metrics
3. ✅ Can add/manage 3 cement mixer vehicles
4. ✅ Can add/manage drivers with license tracking
5. ✅ Can track daily expenses (diesel optional)
6. ✅ Can track maintenance with due dates
7. ✅ Can manage EMI payments
8. ✅ Can create clients database
9. ✅ Can generate bills with auto GST calculation
10. ✅ System shows reminders for expiring documents
11. ✅ Reports show profit/loss per vehicle
12. ✅ Responsive UI works on desktop/tablet

---

## 8. Default Data

### Default User
- Username: admin
- Password: admin123

### Sample Vehicles (3 cement mixers)
1. MH12AB1234 - Tata 712 (2020)
2. MH12XY4567 - Ashok Leyland 312 (2021)
3. MH14PQ7890 - BharatBenz 714 (2022)
