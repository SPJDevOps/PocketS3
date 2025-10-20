# Quick Start Guide

## 🚀 Start in 3 Steps

### Option 1: Docker (Recommended)

```bash
# 1. Create environment file
cp env.example .env

# 2. Edit .env with your S3 credentials
nano .env  # or use your favorite editor

# 3. Start the application
docker-compose up -d

# Open browser to http://localhost:8080
```

### Option 2: Development Mode

```bash
# 1. Create environment file
cp env.example .env

# 2. Edit .env with your S3 credentials
nano .env

# 3. Run the startup script
./start-dev.sh

# Open browser to http://localhost:5173
```

## 📝 Configuration

Edit `.env` file:

```env
# For AWS S3 (default)
S3_ENDPOINT=
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key

# For MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# For DigitalOcean Spaces
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY=your-spaces-key
S3_SECRET_KEY=your-spaces-secret
```

## 🧪 Test with MinIO (Local S3)

```bash
# Start MinIO
docker run -d -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"

# MinIO Console: http://localhost:9001
# Use credentials: minioadmin / minioadmin
```

## 🛠️ Common Commands

```bash
# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Start development mode
./start-dev.sh
```

## ✨ Features

- ✅ Browse S3 buckets
- ✅ Navigate folder tree
- ✅ Upload files (drag & drop)
- ✅ Download files
- ✅ Create folders
- ✅ Delete files & folders
- ✅ Works with any S3-compatible storage

## 📚 Documentation

- **README.md** - Full documentation
- **DEVELOPMENT.md** - Development guide
- **env.example** - Configuration template

## 🆘 Need Help?

1. Check your S3 credentials in `.env`
2. Verify S3 endpoint is correct
3. Ensure you have proper IAM permissions
4. Check logs: `docker-compose logs -f`

## 🔒 Security

- Keep your `.env` file secure (it's in .gitignore)
- Use read-only credentials if you only need browsing
- Consider using temporary credentials
- Always use HTTPS in production

