@echo off
echo ==========================================
echo    Arvayon CRM - Local Application
echo ==========================================
echo.
echo Starting services...
docker-compose up -d
echo.
echo Waiting for system to initialize...
timeout /t 5 /nobreak > nul
echo.
echo Opening Arvayon CRM...
start http://localhost:3000
echo.
echo ==========================================
echo    CRM is running in the background.
echo    Close this window to finish setup.
echo ==========================================
pause
