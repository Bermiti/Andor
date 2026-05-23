@echo off
REM Commit Phase 11: Production Bug Fixes
REM Author: Copilot

cd /d "%~dp0"

REM Stage all changes
git add -A

REM Verify changes
echo.
echo === Git Status ===
git status
echo.

REM Commit with detailed message
git commit -m "fix: production bugs and improve error handling

CRITICAL FIXES:
- Fixed destination type handling crash (destination as string vs object)
- Replaced deprecated Unicode encoding functions (escape/unescape) with modern TextEncoder/TextDecoder
- Added robust error handling for localStorage operations

HIGH-SEVERITY FIXES:
- Fixed app crash in private browsing mode by wrapping localStorage writes in try-catch
- Fixed favorites state inconsistency when storage write fails

MEDIUM-SEVERITY FIXES:
- Fixed mobile CSS overflow from 500px pseudo-element on small screens
- Fixed undefined day title display in tab headers
- Fixed destination type consistency in favorites handling

CHANGES:
- app/itinerary/[id]/page.js: 7 bug fixes (destination handling, encoding, error handling)
- app/components/ItineraryGenerator.module.css: Mobile responsive fixes

DOCUMENTATION:
- PRODUCTION_BUGS_FIXED.md: Detailed documentation of all bugs and fixes
- PHASE11_FINAL_REPORT.md: Executive summary and validation results

No breaking changes. 100% backward compatible.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" || (
  echo.
  echo ERROR: Commit failed
  pause
  exit /b 1
)

echo.
echo === Commit Successful ===
echo.

REM Get commit hash
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set COMMIT_HASH=%%i
echo Commit Hash: %COMMIT_HASH%

echo.
echo === Ready for Push ===
echo Run: git push origin main

pause
