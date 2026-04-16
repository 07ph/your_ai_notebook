@echo off
title StudyMark
echo ========================================
echo   StudyMark - AI Study Assistant
echo ========================================
echo.

cd /d "%~dp0"

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Force reinstall dependencies
echo [1/3] Installing dependencies...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Installation failed
    pause
    exit /b 1
)

:: Kill old process
echo [2/3] Checking port...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: Start server
echo [3/3] Starting server...
echo.
echo ========================================
echo   http://localhost:5173
echo   Close this window to stop server
echo ========================================
echo.

:: Open browser after 5 seconds
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:5173"

:: Start vite using npx
call npx --yes vite --host 0.0.0.0 --port 5173

echo.
echo Server stopped
pause
