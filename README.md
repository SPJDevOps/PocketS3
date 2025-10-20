# PocketS3

A simple, modern web-based S3 browser that allows you to browse, upload, download, and manage files in any S3-compatible storage service.

![PocketS3](https://img.shields.io/badge/docker-ready-blue.svg)

## Features

- **Browse S3 Buckets** - View all your buckets and navigate through folders
- **Hierarchical Folder Tree** - Intuitive sidebar navigation showing your folder structure
- **Upload Files** - Drag-and-drop or click to upload files to any folder
- **Download Files** - Download files directly from the browser
- **Create Folders** - Organize your files with folder creation
- **Delete Files & Folders** - Remove files and entire folders (with confirmation)
- **Modern UI** - Clean, responsive design built with React and DaisyUI
- **S3-Compatible** - Works with AWS S3, MinIO, DigitalOcean Spaces, and other S3-compatible services

## Quick Start with Docker

### Using Docker Compose (Recommended)

1. Clone this repository or download the files

2. Create a `.env` file with your S3 credentials:
```bash
cp env.example .env
```

3. Edit `.env` and add your credentials:
```env
S3_ENDPOINT=              # Leave empty for AWS S3, or add your endpoint
S3_ACCESS_KEY=your-key    # Your S3 access key
S3_SECRET_KEY=your-secret # Your S3 secret key
```

4. Start the application:
```bash
docker-compose up -d
```

5. Open your browser and navigate to:
```
http://localhost:8080
```

### Using Docker Run

```bash
docker build -t pockets3 .

docker run -d \
  -p 8080:8080 \
  -e S3_ENDPOINT="" \
  -e S3_ACCESS_KEY="your-access-key" \
  -e S3_SECRET_KEY="your-secret-key" \
  --name pockets3 \
  pockets3
```

## Development

### Prerequisites

- Python 3.13+
- Node.js 22+
- An S3-compatible storage service

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Set environment variables
export S3_ENDPOINT=""  # optional, for non-AWS S3
export S3_ACCESS_KEY="your-key"
export S3_SECRET_KEY="your-secret"

# Run the backend
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and will proxy API requests to the backend.

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `S3_ENDPOINT` | No | S3 endpoint URL. Leave empty for AWS S3. For MinIO use `http://localhost:9000`, for DigitalOcean Spaces use `https://nyc3.digitaloceanspaces.com` |
| `S3_ACCESS_KEY` | Yes | Your S3 access key ID |
| `S3_SECRET_KEY` | Yes | Your S3 secret access key |

### S3-Compatible Services

PocketS3 works with any S3-compatible storage:

**AWS S3**
```env
S3_ENDPOINT=
S3_ACCESS_KEY=your-aws-key
S3_SECRET_KEY=your-aws-secret
```

**MinIO**
```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

**DigitalOcean Spaces**
```env
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY=your-spaces-key
S3_SECRET_KEY=your-spaces-secret
```

**Backblaze B2**
```env
S3_ENDPOINT=https://s3.us-west-001.backblazeb2.com
S3_ACCESS_KEY=your-b2-key
S3_SECRET_KEY=your-b2-secret
```

## Usage

1. **Select a Bucket** - Use the dropdown in the top-right corner to select a bucket
2. **Navigate Folders** - Click folders in the left sidebar or in the main file list
3. **Upload Files** - Drag and drop files into the upload zone or click "Choose Files"
4. **Create Folders** - Click "New Folder" button and enter a folder name
5. **Download Files** - Click the download icon next to any file
6. **Delete Items** - Click the trash icon to delete files or folders

## Security Notes

- This application requires S3 credentials with appropriate permissions
- Credentials are passed via environment variables and stored in the backend only
- In production, ensure the application is behind proper authentication/authorization
- Consider using IAM roles or temporary credentials when possible
- Always use HTTPS in production environments

## Technology Stack

### Frontend
- React 19
- Vite
- Tailwind CSS 4
- DaisyUI 5

### Backend
- FastAPI
- Boto3 (AWS SDK for Python)
- Python 3.13

## Roadmap

Future features planned:
- Search functionality across buckets
- Lifecycle policy management
- Bucket creation and configuration
- Multi-file selection and batch operations
- File preview for images and text files
- Object metadata editing
- Access control management

## License

MIT License - feel free to use this for any purpose.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

