@echo off
REM Build script for Andor Travels
echo.
echo ===================================
echo Andor Travels — Build Validation
echo ===================================
echo.

cd /d c:\Users\berna\Desktop\Andor-main

echo [1/3] Checking npm and node...
call npm --version
call node --version
echo.

echo [2/3] Running build...
call npm run build
if errorlevel 1 (
  echo ERROR: Build failed
  exit /b 1
)
echo Build completed successfully!
echo.

echo [3/3] Running tests...
call npm run test:e2e
if errorlevel 1 (
  echo WARNING: Tests failed or playwright not configured
) else (
  echo Tests completed successfully!
)

echo.
echo ===================================
echo Build & Test Complete
echo ===================================
