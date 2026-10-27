@echo off
title Smart Manufacturing AI & Blockchain Framework
echo ==============================================================================
echo   Starting Smart Manufacturing AI & Blockchain Monitoring Framework
echo ==============================================================================
echo.

echo [1/2] Launching Flask Backend REST API on Port 5000...
start "Smart Manufacturing Backend (Port 5000)" cmd /k "cd /d %~dp0backend && python app.py"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Dashboard on Port 3000...
start "Smart Manufacturing Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==============================================================================
echo   System Services Launched!
echo   - Backend REST API : http://localhost:5000/api
echo   - Frontend Dashboard : http://localhost:3000
echo ==============================================================================
echo.
pause
