FROM python:3.11-slim

# Install system dependencies including Tesseract OCR binary
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

EXPOSE 5000

ENV FLASK_APP=run.py

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
