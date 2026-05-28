@echo off
echo ========================================
echo AI Growth Manager - Quick Start
echo ========================================
echo.

:: Start Redis (if Docker is running)
echo Starting Redis...
docker start redis 2>nul || docker run -d -p 6379:6379 --name redis redis:7-alpine 2>nul
echo Redis started (or already running)
echo.

:: Start Backend
echo Starting Backend Server...
start "Backend" cmd /k "cd /d c:\Users\sahkr\OneDrive\Desktop\AI Growth Manager\backend && npm run dev"
echo Backend starting on http://localhost:3001
echo.

:: Start Frontend  
echo Starting Frontend Server...
start "Frontend" cmd /k "cd /d c:\Users\sahkr\OneDrive\Desktop\AI Growth Manager\frontend && npm run dev"
echo Frontend starting on http://localhost:5173
echo.

echo ========================================
echo All services starting...
echo.
echo Test URLs:
echo - Sign In: http://localhost:5173/signin
echo - Dashboard: http://localhost:5173/dashboard/ai-product-optimizer.myshopify.com
:: - API Test: http://localhost:3001/api/ai-product-optimizer.myshopify.com/dashboard
echo.
echo Press any key to exit this window...
pause
