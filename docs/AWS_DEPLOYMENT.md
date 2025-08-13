# 🚀 AWS Deployment Guide - Enterprise CRM SaaS Platform

> **Industry-Standard Production Deployment Guide for AWS Cloud Infrastructure**

[![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)

---

## 📋 Table of Contents

- [🏗️ Architecture Overview](#️-architecture-overview)
- [📋 Prerequisites](#-prerequisites)
- [🔧 Initial AWS Setup](#-initial-aws-setup)
- [🗄️ Database Setup](#️-database-setup)
- [🐳 Container Preparation](#-container-preparation)
- [🚀 Frontend Deployment](#-frontend-deployment)
- [⚙️ Backend Services Deployment](#️-backend-services-deployment)
- [🌐 Load Balancer & DNS](#-load-balancer--dns)
- [📊 Monitoring & Logging](#-monitoring--logging)
- [🔐 Security Configuration](#-security-configuration)
- [🔄 CI/CD Pipeline](#-cicd-pipeline)
- [📈 Auto Scaling](#-auto-scaling)
- [💰 Cost Optimization](#-cost-optimization)

---

## 🏗️ Architecture Overview

### Production AWS Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CloudFront CDN                      │
├─────────────────────────────────────────────────────────┤
│  Route 53 DNS → Application Load Balancer (ALB)        │
├─────────────────┬─────────────────┬─────────────────────┤
│   React App     │   API Gateway   │   Microservices     │
│  (S3 + CF)      │  (ECS Fargate)  │   (ECS Fargate)     │
├─────────────────┼─────────────────┼─────────────────────┤
│     Redis       │   MongoDB       │    CloudWatch       │
│ (ElastiCache)   │   (Atlas)       │   (Monitoring)      │
└─────────────────┴─────────────────┴─────────────────────┘
```

### AWS Services Used

- **Amazon S3** - Static website hosting for React frontend
- **CloudFront** - Global CDN for fast content delivery
- **Elastic Container Service (ECS)** - Container orchestration
- **Fargate** - Serverless container compute
- **Application Load Balancer (ALB)** - Traffic distribution
- **Route 53** - DNS management
- **ElastiCache** - Redis caching layer
- **CloudWatch** - Monitoring and logging
- **Systems Manager** - Parameter store for secrets
- **IAM** - Identity and access management

---

## 📋 Prerequisites

### Required Tools

```bash
# AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Docker
sudo apt-get update && sudo apt-get install docker.io

# AWS CDK (recommended)
npm install -g aws-cdk

# Terraform (alternative)
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform
```

### AWS Account Requirements

- **AWS Account** with administrative access
- **Domain name** registered (for production)
- **MongoDB Atlas** account (recommended over self-hosted)
- **GitHub account** for CI/CD integration

---

## 🔧 Initial AWS Setup

### 1. Configure AWS CLI

```bash
# Configure AWS credentials
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

### 2. Create IAM Roles and Policies

#### ECS Task Execution Role

```bash
# Create ECS task execution role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach AWS managed policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

#### Custom ECS Task Role

```bash
# Create custom task role for application permissions
aws iam create-role \
  --role-name crmTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Create custom policy for application access
aws iam create-policy \
  --policy-name crmAppPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "elasticache:*",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "*"
      }
    ]
  }'
```

### 3. Create VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=crm-vpc}]'

# Create public subnets (2 for high availability)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=crm-public-1a}]'

aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=crm-public-1b}]'

# Create private subnets
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.0.3.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=crm-private-1a}]'

aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.0.4.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=crm-private-1b}]'
```

---

## 🗄️ Database Setup

### MongoDB Atlas Configuration (Recommended)

```bash
# 1. Create MongoDB Atlas cluster at https://cloud.mongodb.com
# 2. Configure network access for AWS regions
# 3. Create database user with readWrite privileges
# 4. Get connection string

# Store connection string in AWS Parameter Store
aws ssm put-parameter \
  --name "/crm/mongodb/connection-string" \
  --value "mongodb+srv://username:password@cluster.mongodb.net/crm_saas_platform?retryWrites=true&w=majority" \
  --type "SecureString" \
  --description "MongoDB Atlas connection string"
```

### Redis Cache Setup

```bash
# Create ElastiCache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name crm-cache-subnet-group \
  --cache-subnet-group-description "CRM Redis subnet group" \
  --subnet-ids subnet-xxxxxxxxx subnet-yyyyyyyyy

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id crm-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name crm-cache-subnet-group \
  --security-group-ids sg-xxxxxxxxx
```

---

## 🐳 Container Preparation

### 1. Create Dockerfiles for Each Service

#### API Gateway Dockerfile

```dockerfile
# services/api-gateway/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
```

#### Frontend Dockerfile

```dockerfile
# apps/frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
```

### 2. Build and Push to ECR

```bash
# Create ECR repositories
aws ecr create-repository --repository-name crm/api-gateway
aws ecr create-repository --repository-name crm/auth-service
aws ecr create-repository --repository-name crm/contacts-service
aws ecr create-repository --repository-name crm/frontend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push API Gateway
docker build -t crm/api-gateway ./services/api-gateway
docker tag crm/api-gateway:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/crm/api-gateway:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/crm/api-gateway:latest

# Repeat for other services...
```

---

## 🚀 Frontend Deployment

### 1. S3 Bucket Setup

```bash
# Create S3 bucket for frontend hosting
aws s3 mb s3://your-crm-frontend-bucket --region us-east-1

# Configure bucket for static website hosting
aws s3 website s3://your-crm-frontend-bucket \
  --index-document index.html \
  --error-document error.html

# Set bucket policy for public read access
aws s3api put-bucket-policy \
  --bucket your-crm-frontend-bucket \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::your-crm-frontend-bucket/*"
      }
    ]
  }'
```

### 2. CloudFront Distribution

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "crm-frontend-'$(date +%s)'",
    "Comment": "CRM Frontend Distribution",
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-your-crm-frontend-bucket",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      },
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {
          "Forward": "none"
        }
      },
      "MinTTL": 0,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    },
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "S3-your-crm-frontend-bucket",
          "DomainName": "your-crm-frontend-bucket.s3.amazonaws.com",
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          }
        }
      ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_All"
  }'
```

### 3. Deploy Frontend

```bash
# Build frontend
cd apps/frontend
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-crm-frontend-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id EDFDVBD6EXAMPLE \
  --paths "/*"
```

---

## ⚙️ Backend Services Deployment

### 1. Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name crm-cluster \
  --capacity-providers FARGATE \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
```

### 2. Create Task Definitions

#### API Gateway Task Definition

```json
{
  "family": "crm-api-gateway",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/crmTaskRole",
  "containerDefinitions": [
    {
      "name": "api-gateway",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/crm/api-gateway:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "/crm/mongodb/connection-string"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "/crm/jwt/secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/crm-api-gateway",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3001/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 3. Create ECS Services

```bash
# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://api-gateway-task-definition.json

# Create security group for ECS tasks
aws ec2 create-security-group \
  --group-name crm-ecs-sg \
  --description "Security group for CRM ECS tasks" \
  --vpc-id vpc-xxxxxxxxx

# Allow inbound traffic on port 3001 from ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 3001 \
  --source-group sg-yyyyyyyyy

# Create ECS service
aws ecs create-service \
  --cluster crm-cluster \
  --service-name crm-api-gateway \
  --task-definition crm-api-gateway:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration '{
    "awsvpcConfiguration": {
      "subnets": ["subnet-xxxxxxxxx", "subnet-yyyyyyyyy"],
      "securityGroups": ["sg-xxxxxxxxx"],
      "assignPublicIp": "ENABLED"
    }
  }' \
  --load-balancers '[
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/crm-api-tg/50dc6c495c0c9188",
      "containerName": "api-gateway",
      "containerPort": 3001
    }
  ]'
```

---

## 🌐 Load Balancer & DNS

### 1. Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name crm-alb \
  --subnets subnet-xxxxxxxxx subnet-yyyyyyyyy \
  --security-groups sg-xxxxxxxxx

# Create target group for API Gateway
aws elbv2 create-target-group \
  --name crm-api-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-xxxxxxxxx \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/crm-alb/50dc6c495c0c9188 \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/crm-api-tg/50dc6c495c0c9188
```

### 2. SSL Certificate and HTTPS

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name api.yourcrm.com \
  --subject-alternative-names "*.yourcrm.com" \
  --validation-method DNS

# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/crm-alb/50dc6c495c0c9188 \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/crm-api-tg/50dc6c495c0c9188
```

### 3. Route 53 DNS Configuration

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name yourcrm.com \
  --caller-reference crm-$(date +%s)

# Create A record for API
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "api.yourcrm.com",
          "Type": "A",
          "AliasTarget": {
            "DNSName": "crm-alb-123456789.us-east-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true,
            "HostedZoneId": "Z35SXDOTRQ7X7K"
          }
        }
      }
    ]
  }'
```

---

## 📊 Monitoring & Logging

### 1. CloudWatch Log Groups

```bash
# Create log groups for each service
aws logs create-log-group --log-group-name /ecs/crm-api-gateway
aws logs create-log-group --log-group-name /ecs/crm-auth-service
aws logs create-log-group --log-group-name /ecs/crm-contacts-service

# Set retention period
aws logs put-retention-policy \
  --log-group-name /ecs/crm-api-gateway \
  --retention-in-days 30
```

### 2. CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "CRM-API-Gateway-CPU-High" \
  --alarm-description "API Gateway CPU utilization is high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 70 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=crm-api-gateway Name=ClusterName,Value=crm-cluster \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:crm-alerts

# Memory utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "CRM-API-Gateway-Memory-High" \
  --alarm-description "API Gateway memory utilization is high" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=crm-api-gateway Name=ClusterName,Value=crm-cluster \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:crm-alerts
```

### 3. Application Performance Monitoring

```bash
# Install AWS X-Ray SDK in your applications
npm install aws-xray-sdk-core

# Add X-Ray tracing to task definition
"environment": [
  {
    "name": "_X_AMZN_TRACE_ID",
    "value": ""
  }
]
```

---

## 🔐 Security Configuration

### 1. WAF (Web Application Firewall)

```bash
# Create WAF web ACL
aws wafv2 create-web-acl \
  --scope CLOUDFRONT \
  --default-action Allow={} \
  --name crm-waf \
  --description "WAF for CRM application" \
  --rules '[
    {
      "Name": "RateLimitRule",
      "Priority": 1,
      "Statement": {
        "RateBasedStatement": {
          "Limit": 10000,
          "AggregateKeyType": "IP"
        }
      },
      "Action": {
        "Block": {}
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "RateLimitRule"
      }
    }
  ]'
```

### 2. Security Groups Configuration

```bash
# Create security group for ALB
aws ec2 create-security-group \
  --group-name crm-alb-sg \
  --description "Security group for CRM ALB" \
  --vpc-id vpc-xxxxxxxxx

# Allow HTTP and HTTPS from internet
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### 3. Secrets Management

```bash
# Store application secrets in Parameter Store
aws ssm put-parameter \
  --name "/crm/jwt/secret" \
  --value "your-super-secure-jwt-secret-256-bits" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/crm/encryption/key" \
  --value "your-encryption-key" \
  --type "SecureString"
```

---

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/deploy-aws.yml
name: Deploy to AWS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY_API: crm/api-gateway
  ECR_REPOSITORY_AUTH: crm/auth-service
  ECR_REPOSITORY_CONTACTS: crm/contacts-service
  ECS_CLUSTER: crm-cluster

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run type-check

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push API Gateway
        run: |
          cd services/api-gateway
          docker build -t $ECR_REPOSITORY_API .
          docker tag $ECR_REPOSITORY_API:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_API:latest
          docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_API:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster $ECS_CLUSTER --service crm-api-gateway --force-new-deployment

      - name: Build and deploy frontend
        run: |
          cd apps/frontend
          npm run build
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
```

### 2. Blue-Green Deployment Strategy

```bash
# Create blue-green deployment script
#!/bin/bash
# deploy-blue-green.sh

CLUSTER_NAME="crm-cluster"
SERVICE_NAME="crm-api-gateway"
TASK_DEFINITION="crm-api-gateway"

# Get current task definition
CURRENT_TASK_DEF=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --query 'services[0].taskDefinition' --output text)

# Create new revision
NEW_TASK_DEF=$(aws ecs register-task-definition --cli-input-json file://task-definition.json --query 'taskDefinition.taskDefinitionArn' --output text)

# Update service with new task definition
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --task-definition $NEW_TASK_DEF

# Wait for deployment to complete
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME

echo "Blue-green deployment completed successfully"
```

---

## 📈 Auto Scaling

### 1. ECS Service Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/crm-cluster/crm-api-gateway \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy for CPU
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-scaling \
  --service-namespace ecs \
  --resource-id service/crm-cluster/crm-api-gateway \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 50.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 300
  }'
```

### 2. ALB Auto Scaling

```bash
# Create CloudWatch alarm for ALB
aws cloudwatch put-metric-alarm \
  --alarm-name "ALB-TargetResponseTime-High" \
  --alarm-description "ALB target response time is high" \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --threshold 2 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=LoadBalancer,Value=app/crm-alb/50dc6c495c0c9188 \
  --evaluation-periods 2
```

---

## 💰 Cost Optimization

### 1. Resource Right-Sizing

```bash
# Use Fargate Spot for non-critical workloads
aws ecs create-capacity-provider \
  --name crm-fargate-spot \
  --fargate-capacity-provider-config '{
    "spotPolicy": "ENABLED"
  }'

# Update cluster capacity providers
aws ecs modify-cluster \
  --cluster crm-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy '[
    {
      "capacityProvider": "FARGATE",
      "weight": 1
    },
    {
      "capacityProvider": "FARGATE_SPOT",
      "weight": 3
    }
  ]'
```

### 2. CloudFront Cost Optimization

```bash
# Use appropriate price class for CloudFront
aws cloudfront update-distribution \
  --id EDFDVBD6EXAMPLE \
  --distribution-config '{
    "CallerReference": "crm-frontend",
    "PriceClass": "PriceClass_100",
    "Comment": "Use only North America and Europe edge locations"
  }'
```

### 3. S3 Intelligent Tiering

```bash
# Enable S3 Intelligent Tiering
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket your-crm-frontend-bucket \
  --id "EntireBucket" \
  --intelligent-tiering-configuration '{
    "Id": "EntireBucket",
    "Status": "Enabled",
    "Filter": {},
    "Tierings": [
      {
        "Days": 90,
        "AccessTier": "ARCHIVE_ACCESS"
      },
      {
        "Days": 180,
        "AccessTier": "DEEP_ARCHIVE_ACCESS"
      }
    ]
  }'
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] AWS account setup with proper permissions
- [ ] Domain name registered and DNS configured
- [ ] SSL certificates requested and validated
- [ ] MongoDB Atlas cluster configured
- [ ] Environment variables and secrets stored in Parameter Store
- [ ] All Docker images built and pushed to ECR

### Production Deployment

- [ ] VPC and networking configured
- [ ] ECS cluster created
- [ ] Task definitions registered
- [ ] ECS services deployed and healthy
- [ ] Load balancer configured and healthy
- [ ] Route 53 DNS records created
- [ ] CloudFront distribution configured
- [ ] Frontend deployed to S3 and cached

### Post-Deployment

- [ ] Health checks passing
- [ ] Monitoring and alerting configured
- [ ] Auto-scaling policies tested
- [ ] Security groups and WAF rules applied
- [ ] CI/CD pipeline tested
- [ ] Backup and disaster recovery procedures verified

---

## 📞 Support & Troubleshooting

### Common Issues

#### ECS Service Won't Start

```bash
# Check ECS service events
aws ecs describe-services --cluster crm-cluster --services crm-api-gateway

# Check CloudWatch logs
aws logs tail /ecs/crm-api-gateway --follow
```

#### Database Connection Issues

```bash
# Test MongoDB connection from ECS task
aws ecs execute-command \
  --cluster crm-cluster \
  --task task-id \
  --container api-gateway \
  --command "mongo $MONGODB_URI --eval 'db.runCommand(\"ping\")'"
```

#### Load Balancer Health Checks Failing

```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/crm-api-tg/50dc6c495c0c9188

# Test health endpoint directly
curl -f http://your-alb-url/health
```

### Monitoring Commands

```bash
# View ECS service metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=crm-api-gateway Name=ClusterName,Value=crm-cluster \
  --start-time 2023-01-01T00:00:00Z \
  --end-time 2023-01-02T00:00:00Z \
  --period 300 \
  --statistics Average

# View application logs
aws logs filter-log-events \
  --log-group-name /ecs/crm-api-gateway \
  --start-time 1609459200000 \
  --filter-pattern "ERROR"
```

---

## 🎯 Production Best Practices

1. **Multi-AZ Deployment**: Always deploy across multiple availability zones
2. **Database Backups**: Configure automated backups for MongoDB Atlas
3. **Monitoring**: Set up comprehensive monitoring and alerting
4. **Security**: Implement least privilege access and regular security audits
5. **Testing**: Use blue-green deployments for zero-downtime updates
6. **Documentation**: Keep deployment documentation updated
7. **Cost Optimization**: Regular review of resource usage and costs
8. **Disaster Recovery**: Test backup and recovery procedures regularly

This comprehensive guide provides enterprise-grade AWS deployment for your CRM SaaS platform following industry standards and best practices.
