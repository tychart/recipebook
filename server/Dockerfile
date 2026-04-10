FROM python:3.13-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# Tesseract binary for pytesseract; libjpeg/zlib help if Pillow builds from source
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        libjpeg-dev \
        zlib1g-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
    
WORKDIR /app

# Install dependencies first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose API port
EXPOSE 8000

# Production-ish default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
