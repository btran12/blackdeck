@echo off
REM React MagicMirror Development Script
REM This script sets up and runs the development environment

cd /d C:\Users\baotr\GIT\react-magicmirror

echo ========================================
echo React MagicMirror - Development Server
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local from template...
    copy .env.example .env.local
    echo.
    echo ⚠️  IMPORTANT: Edit .env.local with your API keys:
    echo    - VITE_OPENWEATHER_API_KEY
    echo    - VITE_NEWS_API_KEY
    echo.
    pause
)

echo Starting development server...
echo Open http://localhost:3000 in your browser
echo Press Ctrl+C to stop the server
echo.

call npm run dev
