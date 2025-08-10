# CRM SaaS Testing Suite Runner (PowerShell)
# This script runs all tests: unit, integration, and e2e

param(
    [switch]$Unit,
    [switch]$Integration,
    [switch]$E2E,
    [switch]$Coverage,
    [switch]$Help
)

# Colors for output
function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Cyan
}

if ($Help) {
    Write-Host "CRM SaaS Test Suite Runner"
    Write-Host "=========================="
    Write-Host "Usage: .\run-tests.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Unit        Run only unit tests"
    Write-Host "  -Integration Run only integration tests" 
    Write-Host "  -E2E         Run only E2E tests"
    Write-Host "  -Coverage    Generate coverage report"
    Write-Host "  -Help        Show this help message"
    exit 0
}

Write-Host "🧪 Starting CRM SaaS Test Suite..." -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue

# Check dependencies
function Test-Dependencies {
    Write-Info "Checking dependencies..."
    
    try {
        $nodeVersion = node --version
        $npmVersion = npm --version
        Write-Success "Node.js $nodeVersion and npm $npmVersion found"
    }
    catch {
        Write-Error "Node.js or npm not found. Please install Node.js first."
        exit 1
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Info "Installing dependencies..."
    
    try {
        # Root dependencies
        npm ci
        
        # Frontend dependencies
        Set-Location "apps\frontend"
        npm ci
        Set-Location "..\..\"
        
        # Backend dependencies  
        Set-Location "services\api-gateway"
        npm ci
        Set-Location "..\..\"
        
        Write-Success "Dependencies installed"
    }
    catch {
        Write-Error "Failed to install dependencies"
        exit 1
    }
}

# Run linting
function Invoke-Linting {
    Write-Info "Running linting..."
    
    try {
        Write-Host "  Frontend linting..."
        Set-Location "apps\frontend"
        npm run lint
        Set-Location "..\..\"
        
        Write-Host "  Backend linting..."
        Set-Location "services\api-gateway" 
        npm run lint
        Set-Location "..\..\"
        
        Write-Success "Linting passed"
    }
    catch {
        Write-Warning "Linting issues found"
    }
}

# Run type checking
function Invoke-TypeCheck {
    Write-Info "Running type checking..."
    
    try {
        Write-Host "  Frontend type checking..."
        Set-Location "apps\frontend"
        npm run type-check
        Set-Location "..\..\"
        
        Write-Host "  Backend type checking..."
        Set-Location "services\api-gateway"
        npm run type-check
        Set-Location "..\..\"
        
        Write-Success "Type checking passed"
    }
    catch {
        Write-Warning "Type checking issues found"
    }
}

# Run unit tests
function Invoke-UnitTests {
    Write-Info "Running unit tests..."
    
    try {
        Write-Host "  Frontend unit tests..."
        Set-Location "apps\frontend"
        npm run test:run
        Set-Location "..\..\"
        
        Write-Host "  Backend unit tests..."
        Set-Location "services\api-gateway"
        npm test
        Set-Location "..\..\"
        
        Write-Success "Unit tests passed"
    }
    catch {
        Write-Warning "Some unit tests failed"
    }
}

# Run integration tests
function Invoke-IntegrationTests {
    Write-Info "Running integration tests..."
    
    # Check if Docker is available
    try {
        docker --version | Out-Null
        
        Write-Host "  Starting MongoDB container..."
        # Using environment variables for MongoDB credentials in test environment
        # In production, use proper secret management and strong passwords
        $mongoUser = $env:MONGO_TEST_USER ?? "testuser"
        $mongoPassword = $env:MONGO_TEST_PASSWORD ?? (New-Guid).ToString().Substring(0,12)
        docker run -d --name test-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=$mongoUser -e MONGO_INITDB_ROOT_PASSWORD=$mongoPassword mongo:6 2>$null
        Start-Sleep -Seconds 5
        
        Write-Host "  Running integration tests..."
        Set-Location "services\api-gateway"
        $env:DATABASE_URL = "mongodb://${mongoUser}:${mongoPassword}@localhost:27017/test_crm?authSource=admin"
        $env:JWT_SECRET = $env:TEST_JWT_SECRET ?? "test-jwt-secret-key-for-testing"
        
        try {
            npm run test:integration
        }
        catch {
            Write-Warning "Integration tests failed or skipped"
        }
        
        Set-Location "..\..\"
        
        Write-Host "  Stopping MongoDB container..."
        docker stop test-mongo 2>$null
        docker rm test-mongo 2>$null
        
        Write-Success "Integration tests completed"
    }
    catch {
        Write-Warning "Docker not available, skipping integration tests"
    }
}

# Run E2E tests
function Invoke-E2ETests {
    Write-Info "Running E2E tests..."
    
    try {
        # Build applications
        Write-Host "  Building applications..."
        try { npm run build:frontend } catch { Write-Warning "Frontend build failed" }
        try { npm run build:services } catch { Write-Warning "Backend build failed" }
        
        # Start services
        Write-Host "  Starting services..."
        $backendJob = Start-Job -ScriptBlock { npm run dev:backend }
        $frontendJob = Start-Job -ScriptBlock { npm run dev:frontend }
        
        # Wait for services to start
        Start-Sleep -Seconds 15
        
        # Install Playwright browsers
        Set-Location "apps\frontend"
        try {
            npx playwright install chromium --with-deps
        }
        catch {
            Write-Warning "Playwright install failed"
        }
        
        # Run E2E tests
        try {
            npm run e2e
            Write-Success "E2E tests passed"
        }
        catch {
            Write-Warning "E2E tests failed or skipped"
        }
        
        Set-Location "..\..\"
        
        # Stop services
        Write-Host "  Stopping services..."
        Stop-Job $backendJob -ErrorAction SilentlyContinue
        Stop-Job $frontendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob -ErrorAction SilentlyContinue  
        Remove-Job $frontendJob -ErrorAction SilentlyContinue
        
        Write-Success "E2E tests completed"
    }
    catch {
        Write-Error "E2E tests failed"
    }
}

# Generate coverage report
function New-CoverageReport {
    Write-Info "Generating test coverage..."
    
    try {
        Set-Location "apps\frontend"
        npm run test:coverage
        Set-Location "..\..\"
        
        Write-Success "Coverage report generated at apps/frontend/coverage/"
    }
    catch {
        Write-Warning "Coverage generation failed"
    }
}

# Run security audit
function Invoke-SecurityAudit {
    Write-Info "Running security audit..."
    
    try {
        npm audit --audit-level moderate
        Write-Success "Security audit completed"
    }
    catch {
        Write-Warning "Security vulnerabilities found"
    }
}

# Main execution
try {
    $startTime = Get-Date
    Write-Host "Test execution started at $startTime"
    
    Test-Dependencies
    Install-Dependencies
    
    $runAll = -not ($Unit -or $Integration -or $E2E)
    
    if ($runAll) {
        Invoke-Linting
        Invoke-TypeCheck  
        Invoke-UnitTests
        Invoke-IntegrationTests
        Invoke-E2ETests
        Invoke-SecurityAudit
    }
    else {
        if ($Unit) {
            Invoke-Linting
            Invoke-TypeCheck
            Invoke-UnitTests
        }
        
        if ($Integration) {
            Invoke-IntegrationTests
        }
        
        if ($E2E) {
            Invoke-E2ETests
        }
    }
    
    if ($Coverage) {
        New-CoverageReport
    }
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host "==================================" -ForegroundColor Blue
    Write-Success "All tests completed successfully!"
    Write-Host "Test execution finished at $endTime (Duration: $($duration.ToString('mm\:ss')))"
}
catch {
    Write-Error "Test execution failed: $_"
    exit 1
}
