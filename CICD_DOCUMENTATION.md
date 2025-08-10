# CI/CD Pipeline Documentation

This document describes the comprehensive CI/CD pipeline implemented for the CRM SaaS application.

## 🏗️ Pipeline Overview

Our CI/CD pipeline is built with **GitHub Actions** and provides:

- ✅ **Quality Gates**: Automated testing, linting, and type checking
- 🐳 **Containerization**: Docker builds with multi-stage optimization
- 🔒 **Security**: Vulnerability scanning and dependency audits
- 🚀 **Deployment**: Automated staging and production deployments
- 📊 **Monitoring**: Health checks and rollback capabilities
- 🔄 **Multi-Environment**: Staging and production environments

## 📋 Pipeline Stages

### 1. Quality Gates (`quality-gates`)

**Triggers**: Push to `main`/`develop`, Pull Requests
**Runs on**: All workspaces (frontend, services, shared)

```yaml
Matrix Strategy:
  - frontend (apps/frontend)
  - api-gateway (services/api-gateway)
  - auth-service (services/auth-service)
  - contacts-service (services/contacts-service)
  - shared-types (shared/types)
```

**Steps**:

1. 📥 Checkout code
2. 🏗️ Setup Node.js 18
3. 📦 Install dependencies
4. 🔍 Lint code (`npm run lint`)
5. 🎯 Type check (`npm run type-check`)
6. 🧪 Run tests (`npm run test`)
7. 📊 Upload coverage (frontend only)

### 2. Build Applications (`build`)

**Triggers**: After quality gates pass
**Dependency**: `needs: quality-gates`

```yaml
Matrix Strategy:
  - frontend (port 3000)
  - api-gateway (port 3001)
```

**Steps**:

1. 📥 Checkout code
2. 🏗️ Setup Node.js 18
3. 📦 Install dependencies
4. 🏗️ Build application (`npm run build`)
5. 📤 Upload build artifacts

### 3. Docker Build & Push (`docker`)

**Triggers**: Push to `main`/`develop` branches only
**Dependencies**: `needs: [quality-gates, build]`

```yaml
Matrix Strategy:
  - frontend
  - api-gateway
  - auth-service
  - contacts-service
```

**Steps**:

1. 📥 Checkout code
2. 🏗️ Setup Docker Buildx
3. 🔑 Login to GitHub Container Registry
4. 🏷️ Generate metadata and tags
5. 🐳 Build and push multi-platform images (linux/amd64, linux/arm64)

**Image Tags**:

- `latest` (main branch)
- `{branch}-{sha}` (all branches)
- `{pr-number}` (pull requests)

### 4. Security Scanning (`security`)

**Triggers**: After quality gates
**Permissions**: `security-events: write`

**Steps**:

1. 📥 Checkout code
2. 🛡️ Trivy vulnerability scanner
3. 📤 Upload SARIF results to GitHub Security
4. 🔍 npm audit (high/critical vulnerabilities)

### 5. Deploy to Staging (`deploy-staging`)

**Triggers**: Push to `develop` branch
**Environment**: `staging`
**Dependencies**: `needs: [build, docker, security]`

**Steps**:

1. 📥 Checkout code
2. 🚀 Deploy to staging environment
3. 🧪 Run E2E tests
4. 📝 Update deployment status

### 6. Deploy to Production (`deploy-production`)

**Triggers**: Push to `main` branch
**Environment**: `production`
**Dependencies**: `needs: [build, docker, security]`

**Steps**:

1. 📥 Checkout code
2. 🏗️ Setup kubectl
3. 🚀 Deploy to production
4. ✅ Verify deployment
5. 📝 Create GitHub release
6. 📢 Notify teams

## 🐳 Docker Configuration

### Multi-Stage Builds

All services use optimized multi-stage Docker builds:

```dockerfile
# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
RUN apk add --no-cache dumb-init curl
USER 1001
COPY --from=builder /app/dist ./dist
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### Security Features

- 🔒 **Non-root user**: All containers run as user ID 1001
- 🛡️ **Read-only filesystem**: Enhanced security
- 🚫 **No privilege escalation**: Security hardening
- 📊 **Health checks**: Automatic health monitoring
- 🔄 **Signal handling**: Proper shutdown with dumb-init

### Image Registry

Images are pushed to GitHub Container Registry:

```
ghcr.io/your-username/crm-frontend:latest
ghcr.io/your-username/crm-api-gateway:latest
ghcr.io/your-username/crm-auth-service:latest
ghcr.io/your-username/crm-contacts-service:latest
```

## ☸️ Kubernetes Deployment

### Infrastructure

- **Namespace**: `crm-saas`
- **ConfigMaps**: Environment configuration
- **Secrets**: Sensitive data (JWT, API keys)
- **Services**: Internal service communication
- **Ingress**: External traffic routing with SSL

### Helm Charts

Helm chart location: `infra/helm/crm/`

```bash
# Deploy to staging
helm upgrade --install crm-staging ./infra/helm/crm \
  --namespace crm-saas-staging \
  --values ./infra/helm/values-staging.yaml

# Deploy to production
helm upgrade --install crm-production ./infra/helm/crm \
  --namespace crm-saas-production \
  --values ./infra/helm/values-production.yaml
```

### Resource Allocation

| Service          | CPU Request | CPU Limit | Memory Request | Memory Limit |
| ---------------- | ----------- | --------- | -------------- | ------------ |
| Frontend         | 100m        | 200m      | 128Mi          | 256Mi        |
| API Gateway      | 200m        | 500m      | 256Mi          | 512Mi        |
| Auth Service     | 100m        | 300m      | 128Mi          | 256Mi        |
| Contacts Service | 100m        | 300m      | 128Mi          | 256Mi        |

## 🔄 Environments

### Staging Environment

- **Branch**: `develop`
- **URL**: `https://staging.crm-app.com`
- **Purpose**: Feature testing and validation
- **Auto-deploy**: Yes
- **E2E Tests**: Automatic

### Production Environment

- **Branch**: `main`
- **URL**: `https://app.crm-saas.com`
- **Purpose**: Live customer environment
- **Auto-deploy**: Yes (with approval)
- **Monitoring**: Full observability stack

## 📊 Monitoring & Observability

### Health Checks

All services expose `/health` endpoints:

```javascript
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
});
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 🔒 Security Features

### Container Security

- **Non-root execution**: All containers run as unprivileged user
- **Read-only root filesystem**: Prevents tampering
- **Security contexts**: Drop all capabilities
- **Image scanning**: Trivy vulnerability scanning
- **Base image updates**: Automated security updates

### Dependency Security

- **npm audit**: High/critical vulnerability checking
- **CodeQL analysis**: Static code analysis
- **SARIF reporting**: Security findings in GitHub
- **Dependency updates**: Automated with Dependabot

## 🚀 Deployment Scripts

### Linux/Mac Deployment

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy to staging
./scripts/deploy.sh staging v1.2.3

# Deploy to production
./scripts/deploy.sh production v1.2.3

# Rollback deployment
./scripts/deploy.sh production v1.2.2 rollback
```

### Windows Deployment

```cmd
# Deploy to staging
scripts\deploy.bat staging v1.2.3

# Deploy to production
scripts\deploy.bat production v1.2.3
```

## 📋 Environment Variables

### Required Secrets

Set these in GitHub Secrets:

```bash
# Container Registry
GITHUB_TOKEN=ghp_xxx

# Database
MONGODB_PASSWORD=secure-password

# Authentication
JWT_SECRET=super-secure-jwt-secret
GOOGLE_OAUTH_CLIENT_ID=xxx.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxx

# Email
RESEND_API_KEY=re_xxx

# Kubernetes (if not using GitHub-hosted runners)
KUBE_CONFIG=base64-encoded-kubeconfig
```

## 🔄 Rollback Procedures

### Automatic Rollback

The pipeline includes automatic rollback on deployment failure:

```yaml
- name: Rollback on failure
  if: failure()
  run: |
    helm rollback crm-${{ env.ENVIRONMENT }} -n crm-saas-${{ env.ENVIRONMENT }}
```

### Manual Rollback

```bash
# Check deployment history
helm history crm-production -n crm-saas-production

# Rollback to previous version
helm rollback crm-production -n crm-saas-production

# Rollback to specific revision
helm rollback crm-production 5 -n crm-saas-production
```

## 📈 Performance Optimizations

### Build Optimizations

- **Docker layer caching**: GitHub Actions cache
- **Multi-platform builds**: ARM64 and AMD64 support
- **Parallel matrix builds**: Services built simultaneously
- **Artifact caching**: npm and build caches

### Runtime Optimizations

- **Multi-stage builds**: Minimal production images
- **Alpine Linux base**: Reduced image size
- **Resource limits**: Prevent resource exhaustion
- **Horizontal scaling**: Auto-scaling based on CPU/Memory

## 🎯 Best Practices

### Security

- ✅ Never commit secrets to repository
- ✅ Use least-privilege access
- ✅ Regular security scanning
- ✅ Automated dependency updates
- ✅ Container hardening

### Reliability

- ✅ Health checks for all services
- ✅ Graceful shutdown handling
- ✅ Circuit breaker patterns
- ✅ Retry mechanisms
- ✅ Monitoring and alerting

### Performance

- ✅ Resource limits and requests
- ✅ Horizontal pod autoscaling
- ✅ Efficient Docker images
- ✅ Build caching
- ✅ CDN for static assets

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**

   ```bash
   # Check build logs
   kubectl logs -l app=frontend -n crm-saas

   # Debug build process
   docker build --no-cache -f apps/frontend/Dockerfile .
   ```

2. **Deployment Failures**

   ```bash
   # Check pod status
   kubectl get pods -n crm-saas

   # Describe failing pods
   kubectl describe pod <pod-name> -n crm-saas

   # Check logs
   kubectl logs <pod-name> -n crm-saas
   ```

3. **Health Check Failures**
   ```bash
   # Test health endpoint
   kubectl port-forward service/frontend 3000:80 -n crm-saas
   curl http://localhost:3000/health
   ```

### Support

For CI/CD pipeline support:

- 📧 Email: devops@your-company.com
- 💬 Slack: #devops-support
- 📖 Documentation: https://docs.crm-saas.com/cicd

---

This CI/CD pipeline provides enterprise-grade deployment automation with security, reliability, and performance at its core. 🚀
