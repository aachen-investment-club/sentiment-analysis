#this dockerfile is for model deployment ie for the /backend_finbert server.


FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
 && rm -rf /var/lib/apt/lists/*

# Install deps first for better layer caching
COPY backend_finbert/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code only — secrets are injected at runtime via docker-compose env_file
COPY backend_finbert /app/backend_finbert

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "backend_finbert.server:app", "--host", "0.0.0.0", "--port", "8080"]
