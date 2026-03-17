# Hosting Guide: Shree Samarth Fleet Management System

This guide explains how to deploy the Shree Samarth Fleet Management & Billing System to:
- **Frontend (React)**: Vercel
- **Backend (Spring Boot)**: Render
- **OCR Service (Python/Flask)**: Render

## Overview

The application consists of three services:
1. **Frontend**: React/Vite app (port 5173)
2. **Backend**: Spring Boot/Java app (port 8080) 
3. **OCR Service**: Python/Flask app (port 5001)

## Prerequisites

- GitHub account
- Vercel account (for frontend)
- Render account (for backend and OCR)
- Git installed locally

## Step 1: Prepare Repository Structure

Ensure your repository has this structure:
```
shree-samarth-enterprise/
├── frontend/           # React app
├── backend/            # Spring Boot app
├── ocr_service/        # Python Flask OCR service
├── start_services.bat  # Local startup script
└── HOSTING_GUIDE.md    # This file
```

## Step 2: Deploy Backend to Render (Spring Boot)

### 2.1 Create Render Service
1. Go to [Render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `shreesamarth-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend` (IMPORTANT - this is where mvnw is located)
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/shreesamarth-enterprise-1.0.0.jar`
   - **Environment**: Docker (or use "Native" environment with Java 17)

### 2.2 Add Environment Variables
In Render dashboard → your service → Environment:
```
JAVA_OPTS=-Xmx512m
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=10000  # Render provides PORT env var
```

### 2.3 Update application.properties for Production
Add to `backend/src/main/resources/application.properties`:
```
# Render will provide DATABASE_URL for PostgreSQL
spring.datasource.url=${DATABASE_URL:jdbc:h2:mem:shreesamarth}
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# File upload configuration for Render
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
spring.web.resources.static-locations=file:./uploads/

# Update OCR service URL to point to your Render OCR service
ocr.service.url=https://shreesamarth-ocr.onrender.com
```

### 2.4 Enable PostgreSQL on Render
1. In Render dashboard → "New +" → "PostgreSQL"
2. Name: `shreesamarth-db`
3. Connect to your backend service
4. Render will automatically set `DATABASE_URL` environment variable

## Step 3: Deploy OCR Service to Render (Python/Flask)

### 3.1 Create Render Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `shreesamarth-ocr`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `ocr_service` (important!)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT app:app`
   - **Environment**: Python 3

### 3.2 Update requirements.txt for Render
Ensure `ocr_service/requirements.txt` contains:
```
flask>=2.0.0
requests>=2.28.0
gunicorn>=20.0.0
werkzeug>=2.0.0
```

### 3.3 Add Environment Variables
In Render dashboard → OCR service → Environment:
```
PORT=10000  # Render provides this automatically
```

## Step 4: Deploy Frontend to Vercel (React/Vite)

### 4.1 Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### 4.2 Create Vercel Project
1. Go to [Vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Project Name**: `shreesamarth-frontend`
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 4.3 Add Environment Variables
In Vercel dashboard → Project Settings → Environment Variables:
```
VITE_API_URL=https://shreesamarth-backend.onrender.com/api
VITE_OCR_URL=https://shreesamarth-ocr.onrender.com/api/ocr
```

### 4.4 Update vite.config.js for Production
Ensure `frontend/vite.config.js` has:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
})
```

### 4.5 Update API Calls for Production
In `frontend/src/lib/api.js`, ensure the API_URL uses environment variable:
```javascript
const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

And update ocrAPI:
```javascript
// OCR APIs
export const ocrAPI = {
  extractInvoice: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`${import.meta.env.VITE_OCR_URL}/extract`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  healthCheck: () => axios.get(`${import.meta.env.VITE_OCR_URL}/health`),
}
```

## Step 5: Configure CORS for Production

### 5.1 Update Backend CORS Configuration
In `backend/src/main/java/com/shreesamarth/enterprise/config/SecurityConfig.java`, add:
```java
http.cors().configurationSource(request -> {
    var cors = new CorsConfiguration();
    cors.setAllowedOrigins(List.of(
        "https://shreesamarth-frontend.vercel.app",
        "http://localhost:5173" // for local development
    ));
    cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cors.setAllowedHeaders(List.of("*"));
    cors.setAllowCredentials(true);
    return cors;
});
```

### 5.2 Update OCR Service CORS
In `ocr_service/app.py`, add after `app = Flask(__name__)`:
```python
from flask_cors import CORS
CORS(app, origins=[
    "https://shreesamarth-frontend.vercel.app",
    "http://localhost:5173"
])
```

And add to requirements.txt:
```
flask-cors>=4.0.0
```

## Step 6: Update Service URLs

After deployment, update the service URLs in your environment variables:

### Backend Environment Variables (Render):
```
ocr.service.url=https://shreesamarth-ocr.onrender.com
```

### Frontend Environment Variables (Vercel):
```
VITE_API_URL=https://shreesamarth-backend.onrender.com/api
VITE_OCR_URL=https://shreesamarth-ocr.onrender.com/api/ocr
```

## Step 7: Test Deployment

1. **Backend Health Check**: 
   - Visit: `https://shreesamarth-backend.onrender.com/api/actuator/health`
   - Should return: `{"status":"UP"}`

2. **OCR Health Check**:
   - Visit: `https://shreesamarth-ocr.onrender.com/api/ocr/health`
   - Should return: `{"status":"healthy","service":"OCR Invoice Scanner"}`

3. **Frontend**:
   - Visit: `https://shreesamarth-frontend.vercel.app`
   - Should load the login page

## Step 8: Database Initialization

The application uses Hibernate auto-update (`spring.jpa.hibernate.ddl-auto=update`) which will create tables on first startup.

For production, consider:
1. Creating backup strategy
2. Using migrations (Flyway/Liquibase) for schema changes
3. Setting up monitoring and logging

## Step 9: Maintenance Tips

### 9.1 View Logs
- Render: View logs in service dashboard
- Vercel: View logs in project dashboard

### 9.2 Update Deployments
- Push to GitHub → Auto-deploy on all platforms
- Or manually trigger deploy in dashboards

### 9.3 Scaling
- Render: Upgrade service plan for more resources
- Vercel: Automatically scales
- Consider adding Redis for caching if needed

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Double-check CORS configuration in both backend and OCR service
   - Verify allowed origins include your Vercel domain

2. **Database Connection**:
   - Ensure PostgreSQL is linked to backend service
   - Check DATABASE_URL environment variable

3. **OCR Service Not Responding**:
   - Check OCR service logs
   - Verify requirements.txt includes all dependencies
   - Check port binding (should use `$PORT` env var)

4. **File Upload Issues**:
   - Verify multipart config in backend
   - Check file size limits
   - Ensure upload directory exists/writable

## Environment Variables Summary

### Backend (Render):
```
JAVA_OPTS=-Xmx512m
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=<provided by Render Postgres>
ocr.service.url=https://shreesamarth-ocr.onrender.com
```

### OCR Service (Render):
```
PORT=<provided by Render>
```

### Frontend (Vercel):
```
VITE_API_URL=https://shreesamarth-backend.onrender.com/api
VITE_OCR_URL=https://shreesamarth-ocr.onrender.com/api/ocr
```

## Local Development vs Production

The system uses environment variables to switch between local and production:
- Local: `http://localhost:8080/api` and `http://localhost:5001/api/ocr`
- Production: Uses the Render/Vercel URLs set in environment variables

## Security Considerations

1. **Secrets**: Never commit API keys or secrets to git
2. **HTTPS**: All services enforce HTTPS in production
3. **CORS**: Restrict origins to your domains
4. **File Uploads**: Validate file types and scan for malware in production
5. **Database**: Use strong passwords and enable encryption at rest

## Cost Estimates (as of 2026)

- **Render Web Service** (Backend): $7/month (Starter)
- **Render Web Service** (OCR): $7/month (Starter) 
- **Render PostgreSQL**: $7/month (Starter)
- **Vercel**: Free (Hobby tier) or $20/month (Pro for team features)
- **Total**: ~$21-41/month depending on traffic and features

## Next Steps

1. Set up custom domain (e.g., fleet.shreesamarth.com)
2. Configure email notifications (SendGrid already configured)
3. Set up automated backups
4. Add monitoring and alerting
5. Consider adding CDN for static assets

---

**Deployment Complete!** Your Shree Samarth Fleet Management System is now hosted and accessible to your users.