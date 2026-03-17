@echo off
echo ============================================
echo Starting Shree Samarth Services
echo ============================================

echo.
echo Starting OCR Service (Port 5001)...
start "OCR Service" cmd /k "cd /d %~dp0ocr_service && pip install -q flask requests && python app.py"

echo Waiting 3 seconds for OCR service to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Backend (Port 8080)...
start "Backend" cmd /k "cd /d %~dp0backend && mvn spring-boot:run -DskipTests"

echo.
echo Waiting for backend to start...
timeout /t 10 /nobreak >nul

echo.
echo Starting Frontend (Port 5173)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo All services started!
echo ============================================
echo.
echo OCR Service:    http://localhost:5001
echo Backend API:    http://localhost:8080
echo Frontend:       http://localhost:5173
echo.
echo Press any key to open frontend in browser...
pause >nul

start http://localhost:5173
