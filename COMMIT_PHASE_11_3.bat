@echo off
REM ========================================
REM ANDOR TRAVELS — PHASE 11.3 COMMIT SCRIPT
REM ========================================
REM This script stages and commits Phase 11.3 changes

echo.
echo ========================================
echo Andor Travels — Phase 11.3 Commit
echo ========================================
echo.

cd /d c:\Users\berna\Desktop\Andor-main

echo [1/4] Checking git status...
git status --short
echo.

echo [2/4] Staging all changes...
git add .
echo Changes staged.
echo.

echo [3/4] Committing changes...
git commit -m "feat: complete premium itinerary travel intelligence"
if errorlevel 1 (
  echo ERROR: Commit failed
  exit /b 1
)
echo Commit successful!
echo.

echo [4/4] Showing commit info...
git log --oneline -1
echo.
git show --stat
echo.

echo ========================================
echo Phase 11.3 Commit Complete
echo ========================================
echo.
echo Next step: git push origin main
echo.

pause
