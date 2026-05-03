@echo off
echo ==========================================
echo    Arvayon CRM - Desktop Build Script
echo ==========================================
echo.

echo [1/4] Building Frontend...
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Frontend build failed!
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo [2/4] Syncing Frontend to Backend...
echo Cleaning backend/public/assets...
if exist "backend\public\assets" rd /s /q "backend\public\assets"
echo Copying new build...
xcopy /s /e /y "frontend\dist\*" "backend\public\"

echo [3/4] Preparing Backend...
cd backend
call composer install
call php artisan migrate --force
cd ..

echo [4/4] Starting Desktop App...
echo Note: This will start the app in development/preview mode.
echo To build a standalone .exe, run: php artisan native:build
echo.
cd backend
php artisan native:serve
