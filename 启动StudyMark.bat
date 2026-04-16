@echo off
chcp 65001 >nul
title StudyMark - AI 学习助手
echo ========================================
echo   StudyMark - AI 学习助手
echo ========================================
echo.

cd /d "%~dp0"

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 安装依赖（用 npm，不需要 pnpm）
if not exist "node_modules" (
    echo [1/3] 安装依赖（首次可能需要几分钟）...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [1/3] 依赖已就绪
)

:: 杀掉旧进程
echo [2/3] 检查端口...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: 启动服务器
echo [3/3] 启动服务器...
echo.
echo ========================================
echo   浏览器将自动打开 http://localhost:5173
echo   关闭此窗口将停止服务器
echo ========================================
echo.

:: 延迟打开浏览器
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5173"

:: 用 npx 启动 vite（npm install 后 npx 可以找到）
call npx vite --host 0.0.0.0 --port 5173

echo.
echo 服务器已停止
pause
