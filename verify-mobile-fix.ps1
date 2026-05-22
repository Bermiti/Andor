# Mobile Overflow Fix Verification Script
# Run this script to verify the 375px mobile overflow fix

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sprint 1 Mobile Overflow Fix Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting verification..." -ForegroundColor Yellow

# Step 1: Build
Write-Host ""
Write-Host "STEP 1: Building project..." -ForegroundColor Green
Write-Host "================================"
npm run build 2>&1 | Tee-Object -Variable buildOutput
$buildExit = $LASTEXITCODE
Write-Host "Build Exit Code: $buildExit" -ForegroundColor $(if ($buildExit -eq 0) { "Green" } else { "Red" })

# Step 2: Run E2E Tests
Write-Host ""
Write-Host "STEP 2: Running E2E tests..." -ForegroundColor Green
Write-Host "================================"
npm run test:e2e 2>&1 | Tee-Object -Variable e2eOutput
$e2eExit = $LASTEXITCODE
Write-Host "E2E Exit Code: $e2eExit" -ForegroundColor $(if ($e2eExit -eq 0) { "Green" } else { "Red" })

# Step 3: Run Debug Test (if E2E doesn't include it)
Write-Host ""
Write-Host "STEP 3: Running mobile overflow debug test..." -ForegroundColor Green
Write-Host "================================"
npx playwright test tests/debug-mobile-overflow.spec.js --reporter=verbose 2>&1 | Tee-Object -Variable debugOutput
$debugExit = $LASTEXITCODE
Write-Host "Debug Test Exit Code: $debugExit" -ForegroundColor $(if ($debugExit -eq 0) { "Green" } else { "Red" })

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build: $(if ($buildExit -eq 0) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($buildExit -eq 0) { "Green" } else { "Red" })
Write-Host "E2E Tests: $(if ($e2eExit -eq 0) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($e2eExit -eq 0) { "Green" } else { "Red" })
Write-Host "Debug Test: $(if ($debugExit -eq 0) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($debugExit -eq 0) { "Green" } else { "Red" })
Write-Host ""

$duration = ((Get-Date) - $startTime).TotalSeconds
Write-Host "Total time: $([Math]::Round($duration, 2)) seconds" -ForegroundColor Yellow
Write-Host ""

# Return overall status
$allPass = ($buildExit -eq 0) -and ($e2eExit -eq 0) -and ($debugExit -eq 0)
if ($allPass) {
    Write-Host "🎉 ALL TESTS PASSED - Sprint 1 Ready for Completion" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  SOME TESTS FAILED - Review output above" -ForegroundColor Red
    exit 1
}
