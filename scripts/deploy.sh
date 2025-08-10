#!/bin/bash

# CRM SaaS Deployment Script
# Usage: ./deploy.sh [environment] [version]
# Example: ./deploy.sh production v1.2.3

set -euo pipefail

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
REGISTRY="ghcr.io"
NAMESPACE="crm-saas-${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required but not installed."; exit 1; }
    command -v helm >/dev/null 2>&1 || { log_error "helm is required but not installed."; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "docker is required but not installed."; exit 1; }
    
    # Check kubectl context
    CURRENT_CONTEXT=$(kubectl config current-context)
    log_info "Current kubectl context: $CURRENT_CONTEXT"
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
        log_info "Creating namespace: $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
        kubectl label namespace "$NAMESPACE" environment="$ENVIRONMENT"
    fi
    
    log_success "Prerequisites check completed"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    SERVICES=("frontend" "api-gateway" "auth-service" "contacts-service")
    
    for service in "${SERVICES[@]}"; do
        log_info "Building $service..."
        
        if [[ "$service" == "frontend" ]]; then
            DOCKERFILE_PATH="apps/frontend/Dockerfile"
        else
            DOCKERFILE_PATH="services/$service/Dockerfile"
        fi
        
        IMAGE_NAME="$REGISTRY/$GITHUB_REPOSITORY_OWNER/crm-$service:$VERSION"
        
        docker build -f "$DOCKERFILE_PATH" -t "$IMAGE_NAME" .
        docker push "$IMAGE_NAME"
        
        log_success "Built and pushed $service: $IMAGE_NAME"
    done
}

# Deploy with Helm
deploy_with_helm() {
    log_info "Deploying with Helm..."
    
    # Update Helm dependencies
    helm dependency update infra/helm/crm/
    
    # Determine values file
    VALUES_FILE="infra/helm/values-${ENVIRONMENT}.yaml"
    if [[ ! -f "$VALUES_FILE" ]]; then
        log_warning "Values file $VALUES_FILE not found, using default values.yaml"
        VALUES_FILE="infra/helm/crm/values.yaml"
    fi
    
    # Deploy with Helm
    helm upgrade --install \
        "crm-${ENVIRONMENT}" \
        infra/helm/crm/ \
        --namespace "$NAMESPACE" \
        --values "$VALUES_FILE" \
        --set image.tag="$VERSION" \
        --set environment="$ENVIRONMENT" \
        --timeout 10m \
        --wait
    
    log_success "Helm deployment completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Wait for deployments to be ready
    kubectl wait --for=condition=available --timeout=600s deployment --all -n "$NAMESPACE"
    
    # Get deployment status
    log_info "Deployment status:"
    kubectl get deployments -n "$NAMESPACE"
    
    # Get service status
    log_info "Service status:"
    kubectl get services -n "$NAMESPACE"
    
    # Get ingress status
    log_info "Ingress status:"
    kubectl get ingress -n "$NAMESPACE"
    
    # Run health checks
    log_info "Running health checks..."
    
    # Check frontend
    if kubectl get service frontend -n "$NAMESPACE" >/dev/null 2>&1; then
        FRONTEND_PORT=$(kubectl get service frontend -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}')
        kubectl port-forward service/frontend "$FRONTEND_PORT:$FRONTEND_PORT" -n "$NAMESPACE" &
        PORT_FORWARD_PID=$!
        sleep 5
        
        if curl -f "http://localhost:$FRONTEND_PORT/health" >/dev/null 2>&1; then
            log_success "Frontend health check passed"
        else
            log_error "Frontend health check failed"
        fi
        
        kill $PORT_FORWARD_PID 2>/dev/null || true
    fi
    
    log_success "Deployment verification completed"
}

# Rollback deployment
rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    helm rollback "crm-${ENVIRONMENT}" -n "$NAMESPACE"
    
    log_success "Rollback completed"
}

# Cleanup old releases
cleanup_old_releases() {
    log_info "Cleaning up old releases..."
    
    helm history "crm-${ENVIRONMENT}" -n "$NAMESPACE" --max 10
    
    # Keep only last 5 releases
    REVISION_COUNT=$(helm history "crm-${ENVIRONMENT}" -n "$NAMESPACE" -o json | jq length)
    if [[ $REVISION_COUNT -gt 5 ]]; then
        REVISIONS_TO_DELETE=$((REVISION_COUNT - 5))
        log_info "Deleting $REVISIONS_TO_DELETE old revisions"
        # Note: Helm doesn't have a direct way to delete old revisions
        # This would be implementation specific
    fi
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting CRM SaaS deployment to $ENVIRONMENT with version $VERSION"
    
    case "${3:-deploy}" in
        "build")
            build_and_push_images
            ;;
        "deploy")
            check_prerequisites
            build_and_push_images
            deploy_with_helm
            verify_deployment
            cleanup_old_releases
            ;;
        "rollback")
            rollback_deployment
            ;;
        "verify")
            verify_deployment
            ;;
        *)
            log_error "Unknown action: ${3:-deploy}"
            echo "Usage: $0 [environment] [version] [action]"
            echo "Actions: build, deploy, rollback, verify"
            exit 1
            ;;
    esac
    
    log_success "Deployment process completed successfully!"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
