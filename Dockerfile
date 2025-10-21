# --- Build frontend ---
FROM node:22 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# --- Build backend ---
FROM python:3.13-slim
WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt

RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend ./backend

# Copy built frontend
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Environment variables (set these when running the container):
# S3_ENDPOINT - S3 endpoint URL (optional, leave empty for AWS S3)
# S3_ACCESS_KEY - S3 access key ID
# S3_SECRET_KEY - S3 secret access key

EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]