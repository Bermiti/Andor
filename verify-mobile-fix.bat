@echo off
REM Mobile Overflow Fix Verification Script (Batch version)
REM Run this script to verify the 375px mobile overflow fix

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Sprint 1 Mobile Overflow Fix Verification
echo ========================================
echo.

REM Step 1: Build
echo STEP 1: Building project...
echo ================================
call npm run build
if errorlevel 1 (
    echo Build FAILED - Exit Code: %errorlevel%
    set BUILD_RESULT=FAILED
) else (
    echo Build PASSED - Exit Code: 0
    set BUILD_RESULT=PASSED
)

REM Step 2: Run E2E Tests
echo.
echo STEP 2: Running E2E tests...
echo ================================
call npm run test:e2e
if errorlevel 1 (
    echo E2E tests FAILED - Exit Code: %errorlevel%
    set E2E_RESULT=FAILED
) else (
    echo E2E tests PASSED - Exit Code: 0
    set E2E_RESULT=PASSED
)

REM Step 3: Run Debug Test
echo.
echo STEP 3: Running mobile overflow debug test...
echo ================================
call npx playwright test tests/debug-mobile-overflow.spec.js --reporter=verbose
if errorlevel 1 (
    echo Debug test FAILED - Exit Code: %errorlevel%
    set DEBUG_RESULT=FAILED
) else (
    echo Debug test PASSED - Exit Code: 0
    set DEBUG_RESULT=PASSED
)

REM Summary
echo.
echo ========================================
echo VERIFICATION SUMMARY
echo ========================================
echo.
echo Build: !BUILD_RESULT!
echo E2E Tests: !E2E_RESULT!
echo Debug Test: !DEBUG_RESULT!
echo.

if "!BUILD_RESULT!"=="PASSED" if "!E2E_RESULT!"=="PASSED" if "!DEBUG_RESULT!"=="PASSED" (
    echo 🎉 ALL TESTS PASSED - Sprint 1 Ready for Completion
    exit /b 0
) else (
    echo ⚠️  SOME TESTS FAILED - Review output above
    exit /b 1
)
