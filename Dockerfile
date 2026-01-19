#this dockerfile is for model deployment ie for the /backend_finbert server. 


FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# (Optional but helps some deps)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
 && rm -rf /var/lib/apt/lists/*

# Install deps first for better layer caching
COPY backend_finbert/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code
COPY backend_finbert /app/backend_finbert

# Cloud Run listens on $PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "backend_finbert.server:app", "--host", "0.0.0.0", "--port", "8080"]
