# Shree Samarth Enterprises - Fleet Management & Billing System

A comprehensive Fleet Management + Billing System for Shree Samarth Enterprises (construction company with cement mixer vehicles). This is a portfolio-worthy full-stack application built with Spring Boot and React.

## 🚀 Project Overview

This system provides complete fleet management capabilities including:
- Vehicle management with document tracking
- Driver management with license expiry reminders
- Automated billing with GST calculation
- Maintenance and expense tracking
- Payment management
- Analytics dashboard

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Spring Boot 3.2, Java 17 |
| Database | PostgreSQL / H2 (dev) |
| Frontend | React 18, Vite, Tailwind CSS |
| Authentication | JWT |
| OCR | Python Flask + OCR.space API |
| File Storage | Local / AWS S3 |

## 📁 Project Structure

```
Shree-Samarth/
├── backend/                    # Spring Boot Backend
│   ├── src/main/java/com/shreesamarth/enterprise/
│   │   ├── ShreeSamarthApplication.java  # Main entry point
│   │   ├── config/               # Configuration classes
│   │   │   ├── DataInitializer.java      # Sample data on startup
│   │   │   ├── RestTemplateConfig.java    # HTTP client config
│   │   │   ├── SecurityConfig.java        # JWT & security setup
│   │   │   └── SendGridConfig.java        # Email service config
│   │   ├── controller/           # REST API endpoints
│   │   │   ├── AnalyticsController.java   # Reports & analytics
│   │   │   ├── AuthController.java        # Login/register
│   │   │   ├── BillController.java        # Billing & GST
│   │   │   ├── ClientController.java      # Party management
│   │   │   ├── DashboardController.java   # Dashboard data
│   │   │   ├── DriverController.java      # Driver management
│   │   │   ├── ExpenseController.java     # Daily expenses
│   │   │   ├── MaintenanceController.java # Vehicle maintenance
│   │   │   ├── OcrController.java         # Invoice scanning
│   │   │   ├── PaymentController.java     # Payment tracking
│   │   │   ├── ReminderController.java   # Expiry alerts
│   │   │   ├── TripController.java        # Trip logging
│   │   │   ├── VehicleController.java     # Vehicle CRUD
│   │   │   └── VehicleLogController.java  # Vehicle history
│   │   ├── dto/                   # Data transfer objects
│   │   │   ├── AuthDTO.java              # Login request
│   │   │   ├── AuthResponse.java         # JWT response
│   │   │   ├── DashboardDTO.java         # Dashboard stats
│   │   │   ├── DocumentHealthDTO.java    # Document status
│   │   │   ├── ExpenseBreakdownDTO.java  # Expense analysis
│   │   │   ├── GstSummaryDTO.java        # GST reports
│   │   │   ├── IdleVehicleAlertDTO.java  # Unused vehicles
│   │   │   ├── InvoiceExtractDTO.java    # OCR results
│   │   │   ├── MonthlyProfitDTO.java     # Profit reports
│   │   │   ├── PartyRevenueDTO.java       # Client billing
│   │   │   ├── VehicleMonthlyProfitDTO.java # Per-vehicle profit
│   │   │   └── VehicleProfitDTO.java      # Vehicle performance
│   │   ├── entity/                 # Database entities
│   │   │   ├── Bill.java                 # Billing records
│   │   │   ├── Client.java               # Party/client
│   │   │   ├── Driver.java               # Driver info
│   │   │   ├── DriverDocument.java       # License, Aadhaar
│   │   │   ├── Expense.java              # Daily expenses
│   │   │   ├── Maintenance.java          # Vehicle maintenance
│   │   │   ├── Payment.java             # Payment records
│   │   │   ├── Reminder.java            # Expiry reminders
│   │   │   ├── Tenant.java              # Multi-tenant support
│   │   │   ├── Trip.java                # Trip records
│   │   │   ├── User.java                # System users
│   │   │   ├── Vehicle.java             # Vehicle master data
│   │   │   ├── VehicleDocument.java     # RC, insurance, etc
│   │   │   ├── VehicleLog.java          # Vehicle history
│   │   │   └── VehicleTelematics.java   # GPS/telemetry
│   │   ├── repository/             # Database access
│   │   │   ├── BillRepository.java
│   │   │   ├── ClientRepository.java
│   │   │   ├── DriverRepository.java
│   │   │   ├── ExpenseRepository.java
│   │   │   ├── MaintenanceRepository.java
│   │   │   ├── PaymentRepository.java
│   │   │   ├── ReminderRepository.java
│   │   │   ├── TenantRepository.java
│   │   │   ├── TripRepository.java
│   │   │   ├── UserRepository.java
│   │   │   ├── VehicleDocumentRepository.java
│   │   │   ├── VehicleLogRepository.java
│   │   │   ├── VehicleRepository.java
│   │   │   └── VehicleTelematicsRepository.java
│   │   ├── security/               # Authentication
│   │   │   ├── CustomUserDetailsService.java  # User loading
│   │   │   ├── JwtAuthenticationFilter.java   # Token validation
│   │   │   └── JwtService.java               # Token generation
│   │   └── service/                # Business logic
│   │       ├── AnalyticsService.java    # Reports & charts
│   │       ├── AuthService.java         # Auth operations
│   │       ├── EmailService.java         # SendGrid emails
│   │       ├── NotificationService.java # Reminder emails
│   │       ├── OcrService.java          # Invoice parsing
│   │       └── TripService.java         # Trip management
│   └── src/main/resources/
│       └── application.properties        # App configuration
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx           # Entry point
│   │   ├── index.css          # Tailwind imports
│   │   ├── api/
│   │   │   └── analytics.js   # Analytics API calls
│   │   ├── components/
│   │   │   └── Layout.jsx     # App layout & nav
│   │   ├── lib/
│   │   │   ├── api.js         # Axios setup & API calls
│   │   │   └── utils.js       # Helper functions
│   │   └── pages/
│   │       ├── Analytics.jsx  # Reports & charts
│   │       ├── Billing.jsx    # Bill generation
│   │       ├── Clients.jsx    # Party management
│   │       ├── Dashboard.jsx  # Overview stats
│   │       ├── Drivers.jsx    # Driver management
│   │       ├── Expenses.jsx   # Daily expenses
│   │       ├── Login.jsx      # Authentication
│   │       ├── Maintenance.jsx # Maintenance records
│   │       ├── Payments.jsx   # Payment tracking
│   │       ├── Reminders.jsx  # Expiry alerts
│   │       └── Vehicles.jsx   # Vehicle management
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── index.html
│
├── ocr_service/               # Python OCR Service
│   ├── app.py                 # Flask API
│   └── requirements.txt       # Python dependencies
│
├── Shree-Samarth Data/        # Sample documents
│   ├── Bill/                  # Sample bills
│   └── [Vehicle Number]/      # Vehicle documents
│
├── HOSTING_GUIDE.md          # Deployment instructions
├── SPEC.md                   # Detailed specifications
└── start_services.bat        # Local startup script
```

## 🎯 Features Implemented

### 1. Vehicle Management
- Vehicle master data (number, model, chassis, engine)
- Document uploads (RC, insurance, PUC, passing)
- Vehicle status tracking (Active/Under Maintenance)
- EMI details tracking

### 2. Driver Management
- Driver profiles with contact details
- License tracking with expiry alerts
- Salary management
- Driver history per vehicle

### 3. Maintenance & Expenses
- **Daily Expenses**: Diesel, air, puncture, washing, food allowance
- **Periodic Maintenance**: Oil change, grease, filter, tyre, battery
- Bill uploads for all expenses
- Diesel optional (client-provided)

### 4. Billing System
- Auto GST calculation (CGST/SGST)
- Client database (party management)
- Bill format matching Excel template
- Duplicate bill detection
- OCR invoice scanning

### 5. Payment Tracking
- Driver salary payments
- Vehicle EMI payments
- Maintenance payments

### 6. Reminder System
- License expiry alerts
- Insurance renewal reminders
- Maintenance due alerts
- Dashboard notifications

### 7. Analytics Dashboard
- Total revenue/expenses/profit
- Vehicle-wise performance
- Monthly profit trends
- Expense breakdown charts

## 🔧 Setup Instructions

### Prerequisites
- Java 17+
- Node.js 18+
- Python 3.8+
- PostgreSQL (for production)

### Local Development

1. **Backend**:
```bash
cd backend
./mvnw spring-boot:run
# Or on Windows:
mvnw spring-boot:run
```

2. **Frontend**:
```bash
cd frontend
npm install
npm run dev
```

3. **OCR Service**:
```bash
cd ocr_service
pip install -r requirements.txt
python app.py
```

### Environment Variables

Create `.env` files:

**Backend** (`backend/src/main/resources/application.properties`):
```properties
# Database (PostgreSQL for production)
spring.datasource.url=jdbc:postgresql://localhost:5432/shreesamarth
spring.datasource.username=postgres
spring.datasource.password=your_password

# JWT
jwt.secret=your_secret_key

# SendGrid (for emails)
sendgrid.api.key=SG.xxxxxx

# OCR Service
ocr.service.url=http://localhost:5001
```

## 📊 API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | POST /api/auth/login, POST /api/auth/register |
| Vehicles | GET/POST/PUT/DELETE /api/vehicles |
| Drivers | GET/POST/PUT/DELETE /api/drivers |
| Expenses | GET/POST /api/expenses |
| Maintenance | GET/POST /api/maintenance |
| Bills | GET/POST /api/bills |
| Clients | GET/POST /api/clients |
| Payments | GET/POST /api/payments |
| Dashboard | GET /api/dashboard/stats |
| Analytics | GET /api/analytics/* |
| OCR | POST /api/ocr/extract |

## 🔐 Default Credentials

After startup, login with:
- **Email**: admin@shreesamarth.com
- **Password**: admin123

## 📝 Bill Format

The system auto-calculates GST:
```
Basic Amount: ₹95,000
CGST (9%):    ₹8,550
SGST (9%):    ₹8,550
Total:        ₹1,12,100
```

## 🚀 Deployment

### Render (Backend + OCR)
1. Create PostgreSQL database on Render
2. Deploy backend with: `mvn clean package -DskipTests && java -jar target/*.jar`
3. Deploy OCR service with: `pip install -r requirements.txt && python app.py`

### Vercel (Frontend)
1. Connect GitHub repository
2. Set environment variable: `VITE_API_URL=your_backend_url`
3. Deploy automatically

## 📄 License

This project is for demonstration and educational purposes.

## 👤 Author

Shree Samarth Enterprises - Fleet Management System
