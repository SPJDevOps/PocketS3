# Container Registry Configuration Examples

This document provides configuration examples for various internal container registries.

## GitHub Container Registry (GHCR)

If using GitHub's own container registry:

```yaml
# Secrets to configure:
REGISTRY_URL=ghcr.io/your-org
REGISTRY_USERNAME=${{ github.actor }}
REGISTRY_PASSWORD=${{ secrets.GITHUB_TOKEN }}  # Automatically available
```

In the workflow, use:
```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

Full image path: `ghcr.io/your-org/pockets3:latest`

---

## Harbor

Popular open-source enterprise registry:

```yaml
# Secrets to configure:
REGISTRY_URL=harbor.company.com/library
REGISTRY_USERNAME=robot-github-actions
REGISTRY_PASSWORD=<robot-account-token>
```

Notes:
- Create a Robot Account in Harbor with push permissions
- Include the project name in the URL (e.g., `/library`, `/production`)
- Full image path: `harbor.company.com/library/pockets3:latest`

---

## JFrog Artifactory

Popular enterprise artifact repository:

```yaml
# Secrets to configure:
REGISTRY_URL=artifactory.company.com/docker-local
REGISTRY_USERNAME=github-actions
REGISTRY_PASSWORD=<identity-token-or-api-key>
```

Notes:
- Use an Identity Token or API Key (not username/password)
- Include repository name in URL (e.g., `/docker-local`)
- Full image path: `artifactory.company.com/docker-local/pockets3:latest`

---

## Nexus Repository Manager

Sonatype Nexus:

```yaml
# Secrets to configure:
REGISTRY_URL=nexus.company.com:5000
REGISTRY_USERNAME=github-actions
REGISTRY_PASSWORD=<password-or-token>
```

Notes:
- Use the Docker repository port (often 5000, 5001, etc.)
- Create a dedicated user with nx-repository-view-docker-*-* permissions
- Full image path: `nexus.company.com:5000/pockets3:latest`

---

## GitLab Container Registry

If using GitLab's built-in registry:

```yaml
# Secrets to configure:
REGISTRY_URL=registry.gitlab.com/your-group/your-project
REGISTRY_USERNAME=gitlab-ci-token
REGISTRY_PASSWORD=<deploy-token-or-personal-token>
```

Notes:
- Create a Deploy Token with `read_registry` and `write_registry` scopes
- Or use a Personal Access Token
- Full image path: `registry.gitlab.com/your-group/your-project/pockets3:latest`

---

## AWS Elastic Container Registry (ECR)

Amazon's container registry:

```yaml
# Secrets to configure (different approach):
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
```

Modified workflow step:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}

- name: Login to Amazon ECR
  id: login-ecr
  uses: aws-actions/amazon-ecr-login@v2

- name: Build and push to ECR
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: |
      ${{ steps.login-ecr.outputs.registry }}/pockets3:latest
      ${{ steps.login-ecr.outputs.registry }}/pockets3:${{ github.sha }}
```

Full image path: `123456789012.dkr.ecr.us-east-1.amazonaws.com/pockets3:latest`

---

## Azure Container Registry (ACR)

Microsoft Azure's container registry:

```yaml
# Secrets to configure:
REGISTRY_URL=yourregistry.azurecr.io
REGISTRY_USERNAME=<service-principal-id>
REGISTRY_PASSWORD=<service-principal-password>
```

Or use Azure login:
```yaml
- name: Login to Azure
  uses: azure/login@v1
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}

- name: Login to ACR
  uses: azure/docker-login@v1
  with:
    login-server: yourregistry.azurecr.io
    username: ${{ secrets.REGISTRY_USERNAME }}
    password: ${{ secrets.REGISTRY_PASSWORD }}
```

Full image path: `yourregistry.azurecr.io/pockets3:latest`

---

## Google Container Registry (GCR) / Artifact Registry

Google Cloud's container registry:

```yaml
# For GCR (legacy):
REGISTRY_URL=gcr.io/project-id

# For Artifact Registry (recommended):
REGISTRY_URL=us-docker.pkg.dev/project-id/repository-name
```

Modified workflow:
```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}

- name: Set up Cloud SDK
  uses: google-github-actions/setup-gcloud@v2

- name: Configure Docker to use gcloud
  run: gcloud auth configure-docker us-docker.pkg.dev

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: us-docker.pkg.dev/project-id/repository-name/pockets3:latest
```

---

## Docker Hub (Public/Private)

Standard Docker Hub:

```yaml
# Secrets to configure:
REGISTRY_URL=docker.io  # or leave empty
REGISTRY_USERNAME=your-dockerhub-username
REGISTRY_PASSWORD=<access-token>
```

Notes:
- Use Access Token instead of password (create in Docker Hub settings)
- For organizations: `docker.io/orgname/pockets3:latest`
- For personal: `docker.io/username/pockets3:latest`

---

## Quay.io

Red Hat's container registry:

```yaml
# Secrets to configure:
REGISTRY_URL=quay.io/your-org
REGISTRY_USERNAME=your-username
REGISTRY_PASSWORD=<encrypted-password>
```

Notes:
- Create an encrypted password in Quay.io settings
- Supports Robot Accounts for automation
- Full image path: `quay.io/your-org/pockets3:latest`

---

## Self-Hosted Docker Registry

Basic self-hosted registry:

```yaml
# Secrets to configure:
REGISTRY_URL=registry.internal.company.com:5000
REGISTRY_USERNAME=github
REGISTRY_PASSWORD=<password>
```

Notes:
- Ensure registry has authentication enabled
- May need to configure as insecure registry for HTTP (not recommended)
- For HTTPS, ensure valid certificates
- Full image path: `registry.internal.company.com:5000/pockets3:latest`

---

## Generic Configuration Template

For any registry not listed above:

```yaml
# Required GitHub Secrets:
REGISTRY_URL: <your-registry-url>           # No https://, just domain:port
REGISTRY_USERNAME: <service-account-name>   # Or robot account
REGISTRY_PASSWORD: <token-or-password>      # Prefer tokens over passwords
```

Test your configuration locally:
```bash
# Login test
docker login $REGISTRY_URL -u $REGISTRY_USERNAME -p $REGISTRY_PASSWORD

# Build and push test
docker build -t $REGISTRY_URL/pockets3:test .
docker push $REGISTRY_URL/pockets3:test
```

---

## Troubleshooting Tips

### SSL Certificate Issues
If your registry uses self-signed certificates:
```yaml
- name: Add registry certificate
  run: |
    echo "${{ secrets.REGISTRY_CERT }}" | sudo tee /etc/docker/certs.d/${{ secrets.REGISTRY_URL }}/ca.crt
```

### Insecure Registry (HTTP)
Not recommended, but if needed:
```yaml
- name: Configure insecure registry
  run: |
    echo '{"insecure-registries":["${{ secrets.REGISTRY_URL }}"]}' | sudo tee /etc/docker/daemon.json
    sudo systemctl restart docker
```

### Testing Authentication
Add a test step before building:
```yaml
- name: Test registry authentication
  run: |
    docker pull hello-world
    docker tag hello-world ${{ secrets.REGISTRY_URL }}/hello-world:test
    docker push ${{ secrets.REGISTRY_URL }}/hello-world:test
    docker rmi ${{ secrets.REGISTRY_URL }}/hello-world:test
```

### Proxy Configuration
If behind a corporate proxy:
```yaml
- name: Configure Docker proxy
  run: |
    sudo mkdir -p /etc/systemd/system/docker.service.d
    cat <<EOF | sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf
    [Service]
    Environment="HTTP_PROXY=${{ secrets.HTTP_PROXY }}"
    Environment="HTTPS_PROXY=${{ secrets.HTTPS_PROXY }}"
    Environment="NO_PROXY=${{ secrets.NO_PROXY }}"
    EOF
    sudo systemctl daemon-reload
    sudo systemctl restart docker
```

---

## Security Best Practices

1. **Use Tokens/Service Accounts**: Never use personal credentials
2. **Least Privilege**: Grant minimum required permissions
3. **Rotate Regularly**: Set expiration dates on tokens
4. **Audit Logs**: Monitor registry access logs
5. **Network Security**: Use VPN/private networks when possible
6. **Image Scanning**: Enable vulnerability scanning in your registry
7. **Content Trust**: Use Docker Content Trust for image signing

---

## Need Help?

If your registry type isn't listed or you need assistance:
1. Check your registry's documentation for "CI/CD" or "GitHub Actions" guides
2. Look for "Service Account" or "Robot Account" creation
3. Verify authentication method (username/password vs tokens)
4. Test locally with `docker login` first

