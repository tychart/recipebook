FROM python:3.13-slim

ARG ML_PADDLE_PACKAGE=paddlepaddle==3.2.0
ARG ML_PADDLE_INDEX_URL=https://www.paddlepaddle.org.cn/packages/stable/cpu/

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir "${ML_PADDLE_PACKAGE}" -i "${ML_PADDLE_INDEX_URL}" \
    && pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV ML_PORT=8001
EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
