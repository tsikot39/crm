@echo off
REM Performance Testing Suite Runner for CRM SaaS (Windows)
REM This batch script runs comprehensive performance tests using K6 and Artillery

setlocal EnableDelayedExpansion

echo.
echo 🚀 Starting CRM SaaS Performance Testing Suite...
echo ==================================================

REM Function to print status (simulate colors with echo)
set "SUCCESS_PREFIX=✅"
set "WARNING_PREFIX=⚠️"
set "ERROR_PREFIX=❌"
set "INFO_PREFIX=ℹ️"

echo.
echo 🔍 Checking performance testing dependencies...

REM Check K6
where k6 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %WARNING_PREFIX% K6 is not installed. Please install K6 from https://k6.io/docs/getting-started/installation/
    echo You can install K6 using: winget install k6
    echo Or download from: https://github.com/grafana/k6/releases
    pause
    exit /b 1
)

REM Check Artillery
where artillery >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %WARNING_PREFIX% Artillery is not installed. Installing Artillery...
    npm install -g artillery
    if %ERRORLEVEL% neq 0 (
        echo %ERROR_PREFIX% Failed to install Artillery
        pause
        exit /b 1
    )
)

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %ERROR_PREFIX% Node.js is required but not installed
    pause
    exit /b 1
)

echo %SUCCESS_PREFIX% All dependencies are available

echo.
echo 🔧 Starting API server for performance testing...

REM Check if API server is already running
netstat -an | findstr "4000" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo %INFO_PREFIX% API server is already running on port 4000
) else (
    echo Starting API server...
    cd services\api-gateway
    start "API Server" cmd /c "npm run dev"
    cd ..\..
    
    REM Wait for server to start
    echo Waiting for API server to start...
    timeout /t 10 /nobreak >nul
    
    REM Test if server is responding
    for /l %%i in (1,1,30) do (
        curl -s http://localhost:4000/api/health >nul 2>&1
        if !ERRORLEVEL! equ 0 (
            echo %SUCCESS_PREFIX% API server is running
            goto :api_started
        )
        timeout /t 2 /nobreak >nul
    )
    
    echo %ERROR_PREFIX% API server failed to start
    pause
    exit /b 1
    
    :api_started
)

echo.
echo 🔧 Starting frontend server for performance testing...

REM Check if frontend server is already running
netstat -an | findstr "3000" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo %INFO_PREFIX% Frontend server is already running on port 3000
) else (
    echo Starting frontend server...
    cd apps\frontend
    start "Frontend Server" cmd /c "npm run dev"
    cd ..\..
    
    REM Wait for server to start
    echo Waiting for frontend server to start...
    timeout /t 15 /nobreak >nul
    
    REM Test if server is responding
    for /l %%i in (1,1,30) do (
        curl -s http://localhost:3000 >nul 2>&1
        if !ERRORLEVEL! equ 0 (
            echo %SUCCESS_PREFIX% Frontend server is running
            goto :frontend_started
        )
        timeout /t 2 /nobreak >nul
    )
    
    echo %ERROR_PREFIX% Frontend server failed to start
    pause
    exit /b 1
    
    :frontend_started
)

REM Create reports directory
if not exist "performance\reports" mkdir "performance\reports"

echo.
echo 📊 Running K6 Performance Tests...

echo %INFO_PREFIX% Running API Load Test...
k6 run --out json=performance\reports\k6-load-test.json performance\k6-scripts\api-load-test.js
if %ERRORLEVEL% neq 0 (
    echo %ERROR_PREFIX% K6 load test failed
) else (
    echo %SUCCESS_PREFIX% K6 load test completed
)

echo %INFO_PREFIX% Running Stress Test...
k6 run --out json=performance\reports\k6-stress-test.json performance\k6-scripts\stress-test.js
if %ERRORLEVEL% neq 0 (
    echo %ERROR_PREFIX% K6 stress test failed
) else (
    echo %SUCCESS_PREFIX% K6 stress test completed
)

echo.
echo 🎯 Running Artillery Performance Tests...

echo %INFO_PREFIX% Running API Performance Test...
artillery run performance\artillery\api-test.yml --output performance\reports\artillery-api-report.json
if %ERRORLEVEL% neq 0 (
    echo %ERROR_PREFIX% Artillery API test failed
) else (
    echo %SUCCESS_PREFIX% Artillery API test completed
)

echo %INFO_PREFIX% Running Frontend Performance Test...
artillery run performance\artillery\frontend-test.yml --output performance\reports\artillery-frontend-report.json
if %ERRORLEVEL% neq 0 (
    echo %ERROR_PREFIX% Artillery frontend test failed
) else (
    echo %SUCCESS_PREFIX% Artillery frontend test completed
)

echo.
echo 📋 Generating Performance Reports...

REM Generate HTML reports from Artillery JSON
if exist "performance\reports\artillery-api-report.json" (
    artillery report performance\reports\artillery-api-report.json --output performance\reports\artillery-api-report.html
)

if exist "performance\reports\artillery-frontend-report.json" (
    artillery report performance\reports\artillery-frontend-report.json --output performance\reports\artillery-frontend-report.html
)

echo %SUCCESS_PREFIX% Performance reports generated in performance\reports\

echo.
echo %INFO_PREFIX% View reports:
echo   - Artillery API Report: performance\reports\artillery-api-report.html
echo   - Artillery Frontend Report: performance\reports\artillery-frontend-report.html
echo   - K6 Load Test: performance\reports\k6-load-test.json
echo   - K6 Stress Test: performance\reports\k6-stress-test.json

echo.
echo ==================================================
echo %SUCCESS_PREFIX% Performance testing completed successfully!
echo Test execution finished at %date% %time%

REM Open reports folder
echo.
echo Opening reports folder...
explorer performance\reports

pause
