# CRM SaaS Development Server Starter
Write-Host "Starting CRM SaaS Development Servers..." -ForegroundColor Green
Write-Host ""

# Function to start a service in a new PowerShell window
function Start-Service {
    param(
        [string]$Title,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "Starting $Title..." -ForegroundColor Yellow
    $scriptBlock = "Set-Location '$Path'; $Command; Read-Host 'Press Enter to close'"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock -WindowStyle Normal
    Start-Sleep -Seconds 1
}

# Get the current directory
$rootPath = Get-Location

# Start Frontend Server
Start-Service -Title "Frontend Server" -Path "$rootPath\apps\frontend" -Command "npm run dev"

# Start Auth Service  
Start-Service -Title "Auth Service" -Path "$rootPath\services\auth-service" -Command "npm run dev"

Write-Host ""
Write-Host "All servers are starting..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Auth Service: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press 'q' to stop all servers or any other key to keep them running..." -ForegroundColor Yellow

$key = Read-Host

if ($key -eq 'q') {
    Write-Host "Stopping all Node.js processes..." -ForegroundColor Red
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "All servers stopped." -ForegroundColor Green
} else {
    Write-Host "Servers will continue running. Close manually when done." -ForegroundColor Green
}
