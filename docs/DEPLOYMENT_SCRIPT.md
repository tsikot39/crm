# 🚀 AWS App Runner Deployment Script

## Step-by-Step Deployment Guide

### 1. Prerequisites Check

- [ ] AWS CLI installed and configured
- [ ] GitHub repository pushed with latest changes
- [ ] MongoDB Atlas database ready
- [ ] Environment variables prepared

### 2. Environment Variables Setup

**For API Gateway Service:**

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=mongodb+srv://your-username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DATABASE_NAME=crm_saas_platform
JWT_SECRET=your-super-secret-jwt-key-256-bits-long-please-change
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-256-bits-long
REFRESH_TOKEN_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-api-gateway.us-east-1.awsapprunner.com/auth/google/callback
CORS_ORIGIN=https://your-frontend.us-east-1.awsapprunner.com
ALLOWED_ORIGINS=https://your-frontend.us-east-1.awsapprunner.com,https://localhost:5173
```

**For Frontend Service:**

```bash
NODE_ENV=production
VITE_API_URL=https://your-api-gateway.us-east-1.awsapprunner.com
```

### 3. Deployment Commands

**Option A: AWS Console (Recommended for first-time)**

1. Go to AWS App Runner Console: https://console.aws.amazon.com/apprunner/
2. Click "Create service"
3. Choose "Source code repository"
4. Connect GitHub and select your repository

**Option B: AWS CLI (Advanced)**

```bash
# Create API Gateway Service
aws apprunner create-service \
  --service-name "crm-api-gateway" \
  --source-configuration '{
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/tsikot39/crm",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY",
        "CodeConfigurationValues": {
          "Runtime": "DOCKER",
          "StartCommand": "node dist/index.js",
          "RuntimeEnvironmentVariables": {
            "NODE_ENV": "production",
            "PORT": "3001"
          },
          "BuildCommand": "docker build -f services/api-gateway/Dockerfile ."
        }
      },
      "SourceDirectory": "services/api-gateway"
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB",
    "InstanceRoleArn": ""
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 30,
    "Timeout": 5,
    "HealthyThreshold": 3,
    "UnhealthyThreshold": 3
  }'

# Create Frontend Service
aws apprunner create-service \
  --service-name "crm-frontend" \
  --source-configuration '{
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/tsikot39/crm",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY",
        "CodeConfigurationValues": {
          "Runtime": "DOCKER",
          "StartCommand": "nginx -g \"daemon off;\"",
          "RuntimeEnvironmentVariables": {
            "NODE_ENV": "production"
          },
          "BuildCommand": "docker build -f apps/frontend/Dockerfile ."
        }
      },
      "SourceDirectory": "apps/frontend"
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  }'
```

### 4. Post-Deployment Setup

**Update Frontend Environment:**

1. Get your API Gateway URL from App Runner console
2. Update frontend service environment variable `VITE_API_URL`
3. Trigger redeployment of frontend service

**Update CORS Settings:**

1. Get your frontend URL from App Runner console
2. Update API Gateway service environment variables:
   - `CORS_ORIGIN`
   - `ALLOWED_ORIGINS`
   - `GOOGLE_CALLBACK_URL`
3. Trigger redeployment of API Gateway service

### 5. Custom Domain Setup (Optional)

```bash
# Associate custom domain to API Gateway
aws apprunner associate-custom-domain \
  --service-arn "arn:aws:apprunner:us-east-1:123456789012:service/crm-api-gateway" \
  --domain-name "api.yourcrm.com"

# Associate custom domain to Frontend
aws apprunner associate-custom-domain \
  --service-arn "arn:aws:apprunner:us-east-1:123456789012:service/crm-frontend" \
  --domain-name "app.yourcrm.com"
```

### 6. Monitoring Commands

```bash
# Check service status
aws apprunner describe-service --service-arn "your-service-arn"

# View service logs
aws logs tail /aws/apprunner/crm-api-gateway --follow

# List all services
aws apprunner list-services
```

## 🎯 Quick Deployment Checklist

- [ ] Push latest code to GitHub main branch
- [ ] Create API Gateway service in App Runner console
- [ ] Set environment variables for API Gateway
- [ ] Wait for deployment to complete (5-10 minutes)
- [ ] Note the API Gateway URL
- [ ] Create Frontend service in App Runner console
- [ ] Set VITE_API_URL environment variable for frontend
- [ ] Wait for frontend deployment
- [ ] Test your live application!

## 🔧 Troubleshooting

**Build Failures:**

- Check Docker build context in apprunner.yaml
- Verify all dependencies are in package.json
- Check build logs in App Runner console

**Health Check Failures:**

- Ensure /health endpoint returns 200 status
- Verify port 3001 is exposed in Dockerfile
- Check if service is binding to 0.0.0.0 not localhost

**Environment Variables Issues:**

- Double-check all required variables are set
- Ensure MongoDB connection string is correct
- Verify CORS origins match your frontend URL

Your CRM will be live on AWS App Runner! 🎉
