@echo off
REM CRM SaaS Windows Deployment Script
REM Usage: deploy.bat [environment] [version]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=staging

set VERSION=%2
if "%VERSION%"=="" set VERSION=latest

set REGISTRY=ghcr.io
set NAMESPACE=crm-saas-%ENVIRONMENT%

echo [INFO] Starting CRM SaaS deployment to %ENVIRONMENT% with version %VERSION%

REM Check prerequisites
echo [INFO] Checking prerequisites...

where kubectl >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] kubectl is required but not installed
    exit /b 1
)

where helm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] helm is required but not installed
    exit /b 1
)

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] docker is required but not installed
    exit /b 1
)

echo [SUCCESS] Prerequisites check completed

REM Create namespace if it doesn't exist
kubectl get namespace %NAMESPACE% >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Creating namespace: %NAMESPACE%
    kubectl create namespace %NAMESPACE%
    kubectl label namespace %NAMESPACE% environment=%ENVIRONMENT%
)

REM Build and push Docker images
echo [INFO] Building and pushing Docker images...

REM Frontend
echo [INFO] Building frontend...
docker build -f apps/frontend/Dockerfile -t %REGISTRY%/your-username/crm-frontend:%VERSION% .
if %errorlevel% neq 0 goto :error
docker push %REGISTRY%/your-username/crm-frontend:%VERSION%
if %errorlevel% neq 0 goto :error

REM API Gateway
echo [INFO] Building api-gateway...
docker build -f services/api-gateway/Dockerfile -t %REGISTRY%/your-username/crm-api-gateway:%VERSION% .
if %errorlevel% neq 0 goto :error
docker push %REGISTRY%/your-username/crm-api-gateway:%VERSION%
if %errorlevel% neq 0 goto :error

REM Auth Service
echo [INFO] Building auth-service...
docker build -f services/auth-service/Dockerfile -t %REGISTRY%/your-username/crm-auth-service:%VERSION% .
if %errorlevel% neq 0 goto :error
docker push %REGISTRY%/your-username/crm-auth-service:%VERSION%
if %errorlevel% neq 0 goto :error

REM Contacts Service
echo [INFO] Building contacts-service...
docker build -f services/contacts-service/Dockerfile -t %REGISTRY%/your-username/crm-contacts-service:%VERSION% .
if %errorlevel% neq 0 goto :error
docker push %REGISTRY%/your-username/crm-contacts-service:%VERSION%
if %errorlevel% neq 0 goto :error

echo [SUCCESS] All images built and pushed successfully

REM Deploy with Helm
echo [INFO] Deploying with Helm...
cd infra\helm\crm
helm dependency update
cd ..\..\..

set VALUES_FILE=infra\helm\values-%ENVIRONMENT%.yaml
if not exist "%VALUES_FILE%" (
    echo [WARNING] Values file %VALUES_FILE% not found, using default values.yaml
    set VALUES_FILE=infra\helm\crm\values.yaml
)

helm upgrade --install crm-%ENVIRONMENT% infra/helm/crm/ --namespace %NAMESPACE% --values %VALUES_FILE% --set image.tag=%VERSION% --set environment=%ENVIRONMENT% --timeout 10m --wait
if %errorlevel% neq 0 goto :error

echo [SUCCESS] Helm deployment completed

REM Verify deployment
echo [INFO] Verifying deployment...
kubectl wait --for=condition=available --timeout=600s deployment --all -n %NAMESPACE%
if %errorlevel% neq 0 goto :error

echo [INFO] Deployment status:
kubectl get deployments -n %NAMESPACE%

echo [INFO] Service status:
kubectl get services -n %NAMESPACE%

echo [SUCCESS] Deployment verification completed
echo [SUCCESS] Deployment process completed successfully!

goto :end

:error
echo [ERROR] Deployment failed!
exit /b 1

:end
endlocal
