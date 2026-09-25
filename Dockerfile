# ==========================================
# Multi-stage Dockerfile for Railway Deployment
# ==========================================

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python & Django Server
FROM python:3.12-slim
WORKDIR /app

# Install system runtime & build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Copy compiled frontend assets from Stage 1 into frontend/build
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Collect static files into backend/staticfiles for WhiteNoise
RUN python backend/manage.py collectstatic --noinput

# Set environment defaults
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
ENV DJANGO_DEBUG=False

EXPOSE 8000

# Run migrations and launch production Gunicorn server
CMD ["sh", "-c", "python backend/manage.py migrate && gunicorn --chdir backend backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2"]
