# Development Guide

This guide will help you set up and run the PocketS3 application locally for development.

## Prerequisites

- Python 3.13+
- Node.js 22+
- Docker (optional, for containerized deployment)
- Access to an S3-compatible storage service

## Local Development Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export S3_ENDPOINT=""  # Leave empty for AWS S3
export S3_REGION=""    # Optional, AWS region
export S3_ACCESS_KEY="your-access-key"
export S3_SECRET_KEY="your-secret-key"

# Run the backend server
uvicorn main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

### 2. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

The frontend is configured to proxy API requests to `http://localhost:8000`, so you can develop both frontend and backend simultaneously.

## Testing with MinIO (Local S3)

If you don't have access to AWS S3, you can use MinIO for local testing:

```bash
# Run MinIO with Docker
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"
```

Then set your environment variables:
```bash
export S3_ENDPOINT="http://localhost:9000"
export S3_REGION=""
export S3_ACCESS_KEY="minioadmin"
export S3_SECRET_KEY="minioadmin"
```

Access MinIO console at `http://localhost:9001` to create buckets and manage files.

## API Endpoints

### Buckets
- `GET /api/buckets` - List all buckets

### Objects
- `GET /api/buckets/{bucket}/objects?prefix={prefix}` - List objects in bucket
- `GET /api/buckets/{bucket}/tree` - Get folder structure
- `POST /api/buckets/{bucket}/upload` - Upload file (multipart/form-data)
- `POST /api/buckets/{bucket}/folder` - Create folder
- `GET /api/buckets/{bucket}/download/{key}` - Download file
- `DELETE /api/buckets/{bucket}/objects/{key}` - Delete object or folder

## Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI application
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── BucketSelector.jsx
│   │   │   ├── Breadcrumbs.jsx
│   │   │   ├── FileList.jsx
│   │   │   ├── FolderTree.jsx
│   │   │   └── UploadZone.jsx
│   │   ├── App.jsx          # Main application component
│   │   ├── App.css          # Application styles
│   │   ├── index.css        # Global styles
│   │   └── main.jsx         # Entry point
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
├── Dockerfile               # Multi-stage Docker build
├── docker-compose.yml       # Docker Compose configuration
└── README.md               # User documentation
```

## Building for Production

### Build with Docker

```bash
docker build -t pockets3 .
```

### Build manually

```bash
# Build frontend
cd frontend
npm run build

# The built files will be in frontend/dist/
# These are served by the FastAPI backend in production
```

## Common Issues

### CORS Errors
If you see CORS errors, make sure:
- Backend is running on port 8000
- Frontend proxy is configured correctly in `vite.config.js`
- Backend CORS middleware allows all origins (for development)

### S3 Connection Issues
- Verify your credentials are correct
- Check if S3_ENDPOINT is set correctly (empty for AWS S3)
- Ensure your S3 service is accessible from your development machine
- Check IAM permissions for your credentials

### Upload Failures
- Verify bucket has proper write permissions
- Check file size limits (default is usually 5GB per file)
- Ensure `python-multipart` is installed in backend

## Code Style

### Backend
- Follow PEP 8 style guide
- Use type hints where appropriate
- Add docstrings to all endpoints

### Frontend
- Use functional components with hooks
- Keep components small and focused
- Use DaisyUI components where possible
- Follow React best practices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Useful Commands

```bash
# Format Python code
black backend/

# Lint JavaScript/React
cd frontend && npm run lint

# View backend API docs
# Navigate to http://localhost:8000/docs

# Clear node_modules and reinstall
cd frontend && rm -rf node_modules && npm install

# Rebuild Docker image without cache
docker build --no-cache -t pockets3 .
```

