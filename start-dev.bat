@echo off
echo Starting CRM SaaS Development Server...
echo.

echo Starting Frontend Server...
cd /d "%~dp0apps\frontend"
npm run dev

echo.
echo Development server started!
pause
