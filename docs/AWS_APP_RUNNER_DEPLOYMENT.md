# 🚀 AWS App Runner Deployment Guide - Simple & Fast

> **Deploy your CRM SaaS Platform to AWS App Runner with minimal configuration**

[![AWS App Runner](https://img.shields.io/badge/AWS%20App%20Runner-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/apprunner/)

---

## 🎯 Why AWS App Runner?

**Perfect for your CRM app because:**
- ✅ **No container orchestration complexity** (no ECS/Fargate)
- ✅ **Automatic scaling** and load balancing
- ✅ **Built-in CI/CD** from GitHub
- ✅ **Simple configuration** - just point to your repo
- ✅ **Still counts as "AWS production deployment"** for portfolio

---

## 📋 Prerequisites

```bash
# 1. AWS CLI installed and configured
aws configure

# 2. GitHub repository with your CRM app
# 3. MongoDB Atlas account (recommended)
# 4. Domain name (optional)
```

---

## 🏗️ App Runner Architecture

```
GitHub Repo → App Runner Services → Load Balancer → Internet
     ↓              ↓                    ↓
Auto Deploy    Auto Scale           Custom Domain
```

**Services to deploy:**
- **Frontend Service** (React app)
- **API Gateway Service** (Node.js)
- **Auth Service** (Node.js) - Optional
- **Contacts Service** (Node.js) - Optional

---

## 🛠️ Step 1: Prepare Your App for App Runner

### 1.1 Create Dockerfiles (if not exists)

#### Frontend Dockerfile
```dockerfile
# apps/frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### API Gateway Dockerfile
```dockerfile
# services/api-gateway/Dockerfile
FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001
CMD ["node", "mock-server.js"]
```

### 1.2 Create nginx.conf for Frontend
```nginx
# apps/frontend/nginx.conf
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 1.3 Update Environment Variables
```javascript
// apps/frontend/src/config/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-service.us-east-1.awsapprunner.com'
  : 'http://localhost:3001';

export { API_BASE_URL };
```

---

## 🚀 Step 2: Deploy API Gateway Service

### 2.1 Create App Runner Service via AWS Console

1. **Go to AWS App Runner Console**
   ```
   https://console.aws.amazon.com/apprunner/
   ```

2. **Create Service**
   - Click "Create service"
   - Source: "Source code repository"
   - Repository provider: "GitHub"
   - Connect to GitHub and select your repo

3. **Configure Source and Deployment**
   ```yaml
   Repository URL: https://github.com/yourusername/crm
   Branch: main
   Source directory: services/api-gateway
   ```

4. **Configure Build**
   ```yaml
   Configuration file: Use configuration file
   ```

### 2.2 Create apprunner.yaml
```yaml
# services/api-gateway/apprunner.yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Building API Gateway service"
run:
  runtime-version: latest
  command: node mock-server.js
  network:
    port: 3001
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    - name: PORT
      value: "3001"
    - name: MONGODB_URI
      value: "your-mongodb-connection-string"
    - name: JWT_SECRET
      value: "your-super-secret-jwt-key"
    - name: CORS_ORIGIN
      value: "https://your-frontend.us-east-1.awsapprunner.com"
```

### 2.3 Complete Service Configuration
```yaml
Service name: crm-api-gateway
CPU: 0.25 vCPU
Memory: 0.5 GB
Port: 3001
Health check path: /api/health
```

---

## 🎨 Step 3: Deploy Frontend Service

### 3.1 Create Frontend App Runner Service

1. **Create Another Service**
   ```yaml
   Repository: Same GitHub repo
   Source directory: apps/frontend
   Service name: crm-frontend
   ```

2. **Frontend apprunner.yaml**
```yaml
# apps/frontend/apprunner.yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Building frontend"
run:
  runtime-version: latest
  command: nginx -g daemon off;
  network:
    port: 80
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    - name: VITE_API_URL
      value: "https://crm-api-gateway-xxxxxxxxx.us-east-1.awsapprunner.com"
```

---

## 🔐 Step 4: Configure Environment Variables

### 4.1 Set Environment Variables in App Runner Console

**For API Gateway Service:**
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_saas_platform
JWT_SECRET=your-super-secure-jwt-secret-256-bits
CORS_ORIGIN=https://your-frontend.us-east-1.awsapprunner.com
```

**For Frontend Service:**
```bash
NODE_ENV=production
VITE_API_URL=https://crm-api-gateway-xxxxxxxxx.us-east-1.awsapprunner.com
```

---

## 🌐 Step 5: Custom Domain (Optional)

### 5.1 Configure Custom Domain
```bash
# In App Runner console, go to your service
# Custom domains → Associate domain
Domain: api.yourcrm.com (for API service)
Domain: app.yourcrm.com (for frontend service)
```

### 5.2 Update Route 53 DNS
```bash
# Create CNAME records in Route 53
api.yourcrm.com → crm-api-gateway-xxxxxxxxx.us-east-1.awsapprunner.com
app.yourcrm.com → crm-frontend-xxxxxxxxx.us-east-1.awsapprunner.com
```

---

## 📊 Step 6: Monitoring & Health Checks

### 6.1 Health Check Endpoints

**API Gateway Health Check:**
```javascript
// services/api-gateway/mock-server.js
// Add this endpoint if not exists
if (pathname === "/api/health" && req.method === "GET") {
  sendJSON({
    status: "healthy",
    message: "CRM API Gateway is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
  return;
}
```

### 6.2 Configure Health Check in App Runner
```yaml
Health check configuration:
- Health check path: /api/health
- Health check interval: 30 seconds
- Health check timeout: 5 seconds
- Healthy threshold: 3
- Unhealthy threshold: 3
```

---

## 🔄 Step 7: Automatic Deployments

### 7.1 Enable Auto-Deploy

In App Runner console:
```yaml
Automatic deployments: Enabled
Branch: main
```

**Every push to main branch will:**
1. Trigger automatic build
2. Deploy new version
3. Perform health checks
4. Route traffic to new version

### 7.2 Deployment Commands (CLI Alternative)
```bash
# Create API Gateway service via CLI
aws apprunner create-service \
  --service-name crm-api-gateway \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "public.ecr.aws/docker/library/node:18-alpine",
      "ImageConfiguration": {
        "Port": "3001"
      },
      "ImageRepositoryType": "ECR_PUBLIC"
    },
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/yourusername/crm",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY"
      }
    }
  }' \
  --instance-configuration '{
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  }'
```

---

## 💰 Cost Estimation

**App Runner Pricing:**
- **0.25 vCPU, 0.5 GB RAM**: ~$7/month per service
- **2 services (API + Frontend)**: ~$14/month
- **Data transfer**: Usually minimal for development

**Total monthly cost**: ~$15-20 (much cheaper than full ECS setup)

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs in App Runner console
# Common fix: Update Dockerfile base image
FROM node:18-alpine  # Use specific version
```

#### 2. Health Check Failures
```bash
# Ensure health endpoint returns 200 status
# Check if port matches in configuration
```

#### 3. CORS Issues
```javascript
// Update CORS configuration in your API
const corsOptions = {
  origin: [
    'https://crm-frontend-xxxxxxxxx.us-east-1.awsapprunner.com',
    'https://app.yourcrm.com'  // if using custom domain
  ],
  credentials: true
};
```

#### 4. Environment Variables Not Loading
```bash
# Check App Runner service configuration
# Environment variables should be set in service settings
```

### Debug Commands
```bash
# View service status
aws apprunner describe-service --service-arn "arn:aws:apprunner:us-east-1:123456789012:service/crm-api-gateway"

# View service logs
aws logs tail /aws/apprunner/crm-api-gateway --follow
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Dockerfiles created for each service
- [ ] Health check endpoints implemented
- [ ] Environment variables configured
- [ ] CORS settings updated for production URLs

### Deployment
- [ ] API Gateway service deployed and healthy
- [ ] Frontend service deployed and healthy
- [ ] Services can communicate with each other
- [ ] Database connection working

### Post-Deployment
- [ ] Custom domains configured (optional)
- [ ] SSL certificates working
- [ ] Monitoring and alerts set up
- [ ] Auto-deployment from GitHub working

---

## 🎯 Benefits for Your Portfolio

**What this gives you:**
✅ **"AWS Production Deployment"** on your resume
✅ **Automatic CI/CD pipeline** from GitHub  
✅ **Scalable infrastructure** that handles traffic
✅ **Professional URLs** for live demos
✅ **Much simpler than ECS** but still enterprise-grade

**Portfolio Impact:**
- Shows you can deploy complex full-stack applications
- Demonstrates understanding of cloud services
- Proves you can set up production infrastructure
- Much more impressive than Heroku/Netlify deployments

---

## 🚀 Next Steps

1. **Deploy your services** following this guide
2. **Test all functionality** in production environment
3. **Set up custom domains** for professional URLs
4. **Add this to your portfolio** as "AWS App Runner Deployment"
5. **Include live demo links** in your resume

Your CRM app will be production-ready and accessible worldwide! 🌍
