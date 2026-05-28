@echo off
echo Starting AI Growth Manager - Local Development
echo ================================================
echo.

echo Step 1: Starting Redis...
docker start redis
if errorlevel 1 (
    echo Redis not found, starting new container...
    docker run -d -p 6379:6379 --name redis redis:7-alpine
)
echo Redis started.
echo.

echo Step 2: Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"
echo Backend server starting on http://localhost:3001
echo.

echo Step 3: Starting Frontend Server...
cd ../frontend
start "Frontend Server" cmd /k "npm run dev"
echo Frontend server starting on http://localhost:5173
echo.

echo ================================================
echo All servers starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press any key to continue...
pause
