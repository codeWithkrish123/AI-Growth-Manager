@echo off
echo Initializing Vite project...
call npx -y create-vite@latest frontend --template react
if %ERRORLEVEL% neq 0 (
    echo Failed to create Vite project.
    exit /b %ERRORLEVEL%
)
cd frontend
echo Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo npm install failed.
    exit /b %ERRORLEVEL%
)
echo Installing Tailwind and other dependencies...
call npm install -D tailwindcss postcss autoprefixer
call npx tailwindcss init -p
call npm install framer-motion lucide-react react-router-dom@6
echo Setup completed successfully.
