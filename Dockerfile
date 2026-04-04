FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY data ./data
COPY models ./models

ENV PYTHONUNBUFFERED=1
ENV SQLITE_DB_FILE=/app/data/kitchen_ops.sqlite
ENV API_PORT=8000
ENV API_HOST=0.0.0.0

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
