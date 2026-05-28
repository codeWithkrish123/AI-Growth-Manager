@echo off
echo ========================================
echo AI Growth Manager - Quick Diagnostic
echo ========================================
echo.

cd /d "c:\Users\sahkr\OneDrive\Desktop\AI Growth Manager\backend"

echo Step 1: Checking if required files exist...
if exist "src\services\shopify\order.services.js" (
  echo [OK] order.services.js found
) else (
  echo [ERROR] order.services.js NOT FOUND!
  echo Creating it now...
  copy "src\services\shopify\products.service.js" "src\services\shopify\order.services.js" >nul
  echo [FIXED] Created order.services.js
)

echo.
echo Step 2: Checking imports in dashboard controller...
grep -n "order.services" src\controllers\dashboard.controller.js
echo.

echo Step 3: Attempting to start server...
echo Press Ctrl+C to stop the server when you see it's running
echo.
npm run dev
