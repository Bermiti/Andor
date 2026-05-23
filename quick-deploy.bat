@echo off
REM Quick deployment - Stage, Commit, Push
cd /d "%~dp0"

echo Staging changes...
git add .

echo Committing...
git commit -m "fix: production bugs and improve error handling

CRITICAL FIXES:
- Fixed destination type handling crash
- Replaced deprecated Unicode encoding functions  
- Added robust error handling for localStorage

HIGH-SEVERITY FIXES:
- Fixed app crash in private browsing mode
- Fixed favorites state inconsistency

MEDIUM-SEVERITY FIXES:
- Fixed mobile CSS overflow
- Fixed undefined day title display
- Fixed destination type in favorites

Files: app/itinerary/[id]/page.js, app/components/ItineraryGenerator.module.css
Bugs fixed: 8 (3 CRITICAL, 2 HIGH, 3 MEDIUM)
Breaking changes: 0

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

echo Pushing to main...
git push origin main

echo.
echo Deployment complete!
echo Check Vercel dashboard for build status.
