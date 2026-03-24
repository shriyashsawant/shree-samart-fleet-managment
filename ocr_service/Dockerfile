FROM python:3.10-slim

# Cache Buster (Timestamp: 2026-03-25 04:16)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Gunicorn config: Single worker + 120s timeout to survive 512MB RAM limits
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--timeout", "120", "--log-level", "info", "app:app"]
