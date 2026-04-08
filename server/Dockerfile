FROM python:3.13-slim

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
