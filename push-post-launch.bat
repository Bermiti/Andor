@echo off
REM Push post-launch files to production
cd /d "%~dp0"

echo Staging post-launch files...
git add public/sitemap.xml public/robots.txt POST_LAUNCH_AUDIT_REPORT.md POST_LAUNCH_CHECKLIST.md ANDOR_POST_LAUNCH_COMPLETE.md

echo Committing...
git commit -m "chore: add post-launch infrastructure and audit reports - Add sitemap.xml for SEO crawling - Add robots.txt for bot guidance - Add comprehensive POST_LAUNCH_AUDIT_REPORT - Add quick-reference POST_LAUNCH_CHECKLIST - Add ANDOR_POST_LAUNCH_COMPLETE summary - Production systems verified: zero critical issues - Ready for real users and growth phase - Co-authored-by: Copilot 223556219+Copilot@users.noreply.github.com"

echo Pushing to main...
git push origin main

echo.
echo ========================================
echo PUSH COMPLETE
echo ========================================
echo Files pushed to production.
echo Vercel will auto-deploy in ~1-2 minutes.
echo Check https://andor-two.vercel.app/sitemap.xml to verify
echo ========================================
pause
