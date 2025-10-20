# GitHub Actions - Docker Build and Push

This workflow automatically builds and pushes the PocketS3 Docker image to GitHub Container Registry (GHCR).

## Setup Instructions

### 1. No Configuration Required! 🎉

This workflow uses GitHub Container Registry (GHCR) which requires **zero configuration**:
- ✅ No secrets to configure (uses built-in `GITHUB_TOKEN`)
- ✅ Automatically uses your repository name
- ✅ Works immediately on push to main branch
- ✅ Free for public repositories

The workflow automatically pushes images to:
```
ghcr.io/YOUR-USERNAME/YOUR-REPO:latest
```

For example, if your repo is `github.com/johndoe/s3-browser`, images will be at:
```
ghcr.io/johndoe/s3-browser:latest
```

### 2. Workflow Triggers

The workflow is triggered by:

#### Automatic Triggers
- **Push to main/master branch**: Builds and tags with `latest` and `main-<sha>`
- **Version tags** (e.g., `v1.2.3`): Builds and tags with semantic versions
- **Pull requests**: Builds only (does not push) to validate changes

#### Manual Trigger
- **Workflow Dispatch**: Run manually from GitHub Actions tab with custom tag

### 3. Making Your Image Public (Optional)

By default, GHCR packages are private. To make your image public:

1. Go to your GitHub profile → **Packages**
2. Find your package (e.g., `s3-browser`)
3. Click **Package settings**
4. Scroll down to **Danger Zone**
5. Click **Change visibility** → **Public**

### 4. Image Tagging Strategy

The workflow automatically tags images based on the trigger:

| Trigger | Tags Applied | Example |
|---------|-------------|---------|
| Push to `main` | `latest`, `main`, `main-<sha>` | `latest`, `main`, `main-abc1234` |
| Version tag `v1.2.3` | `1.2.3`, `1.2`, `1`, `latest` | `1.2.3`, `1.2`, `1` |
| Pull request #42 | `pr-42` (build only, no push) | `pr-42` |
| Manual with tag `dev` | `dev` | `dev` |

### 5. Multi-Architecture Support

The workflow builds images for multiple architectures:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/Apple Silicon)

This ensures the image works on various platforms including:
- Intel/AMD servers
- ARM-based servers (AWS Graviton, etc.)
- Apple Silicon (M1/M2/M3) development machines

### 6. Caching

The workflow uses GitHub Actions cache to speed up builds:
- Docker layer caching via `type=gha`
- Significantly reduces build times for subsequent runs

## Usage Examples

### Deploy from GitHub Container Registry

Once the image is built and pushed, you can deploy it:

```bash
# Pull the latest image (replace with your actual repo path)
docker pull ghcr.io/your-username/s3-browser:latest

# Run the container
docker run -d \
  -p 8080:8080 \
  -e S3_ACCESS_KEY="your-key" \
  -e S3_SECRET_KEY="your-secret" \
  ghcr.io/your-username/s3-browser:latest
```

### Authenticate to Pull Images

For private images, authenticate with GHCR:

```bash
# Create a Personal Access Token (PAT) with 'read:packages' scope
# Then login:
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR-USERNAME --password-stdin
```

### Using docker-compose with GHCR Image

Update your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  pockets3:
    image: ghcr.io/your-username/s3-browser:latest
    ports:
      - "8080:8080"
    environment:
      - S3_ENDPOINT=${S3_ENDPOINT:-}
      - S3_REGION=${S3_REGION:-}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
    restart: unless-stopped
```

### Creating a Release

To trigger a versioned build:

```bash
# Tag your commit
git tag v1.0.0
git push origin v1.0.0

# This creates images tagged as:
# - 1.0.0
# - 1.0
# - 1
# - latest
```

### Manual Build with Custom Tag

1. Go to **Actions** tab in GitHub
2. Select **Build and Push Docker Image** workflow
3. Click **Run workflow**
4. Enter your custom tag (e.g., `dev`, `staging`, `test`)
5. Click **Run workflow**

## Kubernetes Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pockets3
spec:
  replicas: 1
  selector:
    matchLabels:
      app: pockets3
  template:
    metadata:
      labels:
        app: pockets3
    spec:
      containers:
      - name: pockets3
        image: ghcr.io/your-username/s3-browser:latest
        ports:
        - containerPort: 8080
        env:
        - name: S3_ENDPOINT
          value: ""
        - name: S3_REGION
          value: "us-east-1"
        - name: S3_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: s3-credentials
              key: access-key
        - name: S3_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: s3-credentials
              key: secret-key
      # For private images, add imagePullSecrets:
      # imagePullSecrets:
      # - name: ghcr-credentials
---
apiVersion: v1
kind: Service
metadata:
  name: pockets3
spec:
  selector:
    app: pockets3
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

## Troubleshooting

### Authentication Failures

If you see authentication errors:
1. Ensure the workflow has `packages: write` permission (already configured)
2. Check that Actions are enabled in your repository settings
3. For private repos, verify billing is set up (required for private packages)

### Build Failures

If builds fail:
1. Check the Actions logs for specific errors
2. Verify your Dockerfile is valid
3. Try building locally: `docker build -t pockets3 .`

### Multi-architecture Build Issues

If ARM builds fail:
- Some dependencies may not support ARM64
- Consider removing ARM64 from the `platforms` list if needed
- Or add conditional platform building based on tags

### Cache Issues

If you need to rebuild without cache:
1. Go to repository **Settings** → **Actions** → **Caches**
2. Delete all caches
3. Re-run the workflow

### Package Visibility

To pull your image publicly:
1. Navigate to **Packages** on your GitHub profile
2. Select your package
3. Go to **Package settings**
4. Change visibility to **Public**

## Security Best Practices

1. **Package Permissions**: The workflow uses `GITHUB_TOKEN` with minimal required permissions
2. **Least Privilege**: Only `packages: write` and `contents: read` are granted
3. **Public Images**: For public repos, consider making packages public for easier access
4. **Scan Images**: Consider adding vulnerability scanning to the workflow
5. **Sign Images**: Consider implementing image signing for production

## Advanced Customization

### Adding Vulnerability Scanning

Add this step after the build step:

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/${{ github.repository }}:latest
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload Trivy results to GitHub Security
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

### Build Notifications

Add Slack/Discord notifications:

```yaml
- name: Notify on success
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Docker image built successfully: ${{ steps.meta.outputs.tags }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Support

For issues with the workflow, check:
- GitHub Actions logs in the **Actions** tab
- Registry logs on your internal registry
- Docker build logs locally

For application issues, see the main [README.md](../../README.md).

