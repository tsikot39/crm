#!/bin/bash

# Performance Testing Suite Runner for CRM SaaS
# This script runs comprehensive performance tests using K6 and Artillery

set -e

echo "🚀 Starting CRM SaaS Performance Testing Suite..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if performance testing tools are installed
check_dependencies() {
    echo "🔍 Checking performance testing dependencies..."
    
    # Check K6
    if ! command -v k6 &> /dev/null; then
        print_warning "K6 is not installed. Installing K6..."
        
        # Install K6 on different platforms
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo gpg -k
            sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
            echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
            sudo apt-get update
            sudo apt-get install k6
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install k6
        else
            print_error "Please install K6 manually: https://k6.io/docs/getting-started/installation/"
            exit 1
        fi
    fi
    
    # Check Artillery
    if ! command -v artillery &> /dev/null; then
        print_warning "Artillery is not installed. Installing Artillery..."
        npm install -g artillery
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    print_status "All dependencies are available"
}

# Start the API server for testing
start_api_server() {
    echo "🔧 Starting API server for performance testing..."
    
    cd services/api-gateway
    
    # Check if server is already running
    if lsof -i :4000 &> /dev/null; then
        print_info "API server is already running on port 4000"
    else
        # Start the API server in background
        npm run dev > /dev/null 2>&1 &
        API_SERVER_PID=$!
        
        # Wait for server to start
        echo "Waiting for API server to start..."
        for i in {1..30}; do
            if curl -s http://localhost:4000/api/health > /dev/null; then
                print_status "API server is running (PID: $API_SERVER_PID)"
                break
            fi
            sleep 2
            
            if [ $i -eq 30 ]; then
                print_error "API server failed to start"
                exit 1
            fi
        done
    fi
    
    cd ../..
}

# Start the frontend server for testing
start_frontend_server() {
    echo "🔧 Starting frontend server for performance testing..."
    
    cd apps/frontend
    
    # Check if server is already running
    if lsof -i :3000 &> /dev/null; then
        print_info "Frontend server is already running on port 3000"
    else
        # Start the frontend server in background
        npm run dev > /dev/null 2>&1 &
        FRONTEND_SERVER_PID=$!
        
        # Wait for server to start
        echo "Waiting for frontend server to start..."
        for i in {1..30}; do
            if curl -s http://localhost:3000 > /dev/null; then
                print_status "Frontend server is running (PID: $FRONTEND_SERVER_PID)"
                break
            fi
            sleep 2
            
            if [ $i -eq 30 ]; then
                print_error "Frontend server failed to start"
                exit 1
            fi
        done
    fi
    
    cd ../..
}

# Run K6 load tests
run_k6_tests() {
    echo "📊 Running K6 Performance Tests..."
    
    # Create reports directory
    mkdir -p performance/reports
    
    print_info "Running API Load Test..."
    k6 run --out json=performance/reports/k6-load-test.json performance/k6-scripts/api-load-test.js
    
    print_info "Running Stress Test..."
    k6 run --out json=performance/reports/k6-stress-test.json performance/k6-scripts/stress-test.js
    
    print_status "K6 tests completed"
}

# Run Artillery tests
run_artillery_tests() {
    echo "🎯 Running Artillery Performance Tests..."
    
    print_info "Running API Performance Test..."
    artillery run performance/artillery/api-test.yml --output performance/reports/artillery-api-report.json
    
    print_info "Running Frontend Performance Test..."
    artillery run performance/artillery/frontend-test.yml --output performance/reports/artillery-frontend-report.json
    
    print_status "Artillery tests completed"
}

# Generate performance report
generate_report() {
    echo "📋 Generating Performance Report..."
    
    # Create HTML report from Artillery JSON
    if [ -f "performance/reports/artillery-api-report.json" ]; then
        artillery report performance/reports/artillery-api-report.json --output performance/reports/artillery-api-report.html
    fi
    
    if [ -f "performance/reports/artillery-frontend-report.json" ]; then
        artillery report performance/reports/artillery-frontend-report.json --output performance/reports/artillery-frontend-report.html
    fi
    
    print_status "Performance reports generated in performance/reports/"
    echo
    print_info "View reports:"
    echo "  - Artillery API Report: performance/reports/artillery-api-report.html"
    echo "  - Artillery Frontend Report: performance/reports/artillery-frontend-report.html"
    echo "  - K6 Load Test: performance/reports/k6-load-test.json"
    echo "  - K6 Stress Test: performance/reports/k6-stress-test.json"
}

# Cleanup function
cleanup() {
    echo
    print_info "Cleaning up test servers..."
    
    # Kill servers if we started them
    if [ ! -z "$API_SERVER_PID" ]; then
        kill $API_SERVER_PID 2>/dev/null || true
        print_info "Stopped API server (PID: $API_SERVER_PID)"
    fi
    
    if [ ! -z "$FRONTEND_SERVER_PID" ]; then
        kill $FRONTEND_SERVER_PID 2>/dev/null || true
        print_info "Stopped frontend server (PID: $FRONTEND_SERVER_PID)"
    fi
}

# Set up cleanup on script exit
trap cleanup EXIT

# Main execution
main() {
    local RUN_ALL=true
    local RUN_K6=false
    local RUN_ARTILLERY=false
    local SKIP_SERVERS=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --k6)
                RUN_K6=true
                RUN_ALL=false
                shift
                ;;
            --artillery)
                RUN_ARTILLERY=true
                RUN_ALL=false
                shift
                ;;
            --skip-servers)
                SKIP_SERVERS=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --k6           Run only K6 tests"
                echo "  --artillery    Run only Artillery tests"
                echo "  --skip-servers Don't start test servers (assume already running)"
                echo "  --help         Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    echo "Starting performance test execution at $(date)"
    
    check_dependencies
    
    if [[ $SKIP_SERVERS != true ]]; then
        start_api_server
        start_frontend_server
        
        # Give servers time to stabilize
        print_info "Allowing servers to stabilize..."
        sleep 10
    fi
    
    if [[ $RUN_ALL == true ]]; then
        run_k6_tests
        run_artillery_tests
    else
        if [[ $RUN_K6 == true ]]; then
            run_k6_tests
        fi
        
        if [[ $RUN_ARTILLERY == true ]]; then
            run_artillery_tests
        fi
    fi
    
    generate_report
    
    echo "=================================================="
    print_status "Performance testing completed successfully!"
    echo "Test execution finished at $(date)"
}

# Error handling
trap 'print_error "Performance test execution failed!"; cleanup; exit 1' ERR

# Run main function
main "$@"
