# Build & Deploy Instructions — Andor Travels Phase 11.3

## 📋 Prerequisites

- **Node.js**: v18+ (check with `node --version`)
- **npm**: v9+ (check with `npm --version`)
- **Git**: For version control

## 🏗️ Build Instructions

### Option 1: Direct Command Line

Open Command Prompt or PowerShell and navigate to the project:

```bash
cd c:\Users\berna\Desktop\Andor-main
npm run build
```

**Expected output on success:**
```
> next build
...
✓ Compiled successfully
Linting source code...
...
```

### Option 2: Using the Batch Script

Run the provided batch script:

```bash
c:\Users\berna\Desktop\Andor-main\build-validate.bat
```

This will:
1. Check npm and node versions
2. Run `npm run build`
3. Run `npm run test:e2e`

## ✅ Build Validation Checklist

After running the build, verify:

- [ ] Build completes with "Compiled successfully"
- [ ] No errors about missing modules
- [ ] No TypeScript/syntax errors
- [ ] File `.next/` directory is created
- [ ] No "undefined" or "cannot find module" errors

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module 'itinerary-enricher'` | Import path wrong | Check import in `app/itinerary/[id]/page.js` line 6 |
| `CSS Module not found` | CSS file missing | Verify all `.module.css` files exist in `app/components/` |
| `'use client' at top of file` | Client component issue | Ensure component has `'use client'` as first line |
| `Unexpected token {` | Syntax error | Check for missing closing braces or semicolons |

## 🧪 Testing

After successful build:

```bash
npm run test:e2e
```

This runs Playwright E2E tests. If tests fail, check:

1. Playwright is installed: `npm list @playwright/test`
2. Tests exist in `tests/` or `playwright.config.js`
3. Browser binaries are installed: `npx playwright install`

## 🚀 Development Mode

To test locally before building:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

Key pages to test:
- `/` — Landing page
- `/create` — Creation wizard
- `/itinerary/test` — Sample itinerary (if localStorage has data)

## 📦 Production Build

The production-ready build is in `.next/`

To start the production server:

```bash
npm run build
npm start
```

Then open `http://localhost:3000`

## 🔍 Code Changes Made (Phase 11.3)

### New Files Created

1. **app/lib/itinerary-enricher.js** (16.8 KB)
   - Transforms any itinerary into full-featured structure
   - Generates premium fallbacks for missing data
   - Ensures components always have data to render

2. **app/components/FlightSection.js** + .module.css
3. **app/components/HotelSection.js** + .module.css
4. **app/components/BudgetVisualization.js** + .module.css
5. **app/components/BookingChecklist.js** + .module.css
6. **app/components/AlertsSection.js** + .module.css
7. **app/components/AirportTransferSection.js** + .module.css
8. **app/components/LocalTransportSection.js** + .module.css
9. **app/components/DailyPlanTimeline.js** + .module.css (previously created)

### Files Modified

- **app/itinerary/[id]/page.js**
  - Added imports for enricher and all 8 new components (lines 5-18)
  - Added enrichItinerary call in data loading (line 168)
  - Integrated all components in right panel (lines 877-884)

## 🎯 What Was Improved

### Components
✅ 3-tier flight display (economical/balanced/comfortable)
✅ Hotel zones with alternatives and 3 price tiers
✅ Budget breakdown with scenarios
✅ Interactive booking checklist
✅ Destination alerts (scams, safety, cultural, practical)
✅ Airport transfer options comparison
✅ Local transport guide (passes, apps, modes)
✅ Daily plan expandable timeline

### Data Handling
✅ Automatic data enrichment on page load
✅ Fallback premium content for missing data
✅ No undefined/null rendering
✅ localStorage persistence
✅ Refresh resilience

### UX/UI
✅ Premium glassmorphism styling
✅ Mobile-first responsive design
✅ Clear visual hierarchy
✅ External booking links
✅ Fallback UI states

## 📊 Quality Assurance

### Code Quality Checks

```bash
# Lint the code (if eslint is configured)
npm run lint

# Check for unused dependencies
npm ls

# Check for security vulnerabilities
npm audit
```

### Manual Testing Checklist

- [ ] Landing page loads without errors
- [ ] Creation wizard works end-to-end
- [ ] Itinerary page displays all 8 components
- [ ] Mobile viewport (375px) has no horizontal overflow
- [ ] Refresh `/itinerary/[id]` doesn't lose data
- [ ] All external links are valid
- [ ] AI Concierge responds to requests
- [ ] Favorites save/load correctly
- [ ] No console errors (check DevTools)

## 🔐 Environment Variables

The app requires these optional environment variables:

```
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

For development (local):
- Create `.env.local` in root
- Add `GOOGLE_GENERATIVE_AI_API_KEY` if you want to test AI features
- App works fine without it (shows graceful fallback)

For production (Vercel):
- Add environment variables in Vercel dashboard under Settings → Environment Variables
- See DEPLOY_NOTES.md for details

## 📝 Next Steps

After successful build:

1. **Stage changes**:
   ```bash
   git add .
   ```

2. **Commit**:
   ```bash
   git commit -m "feat: complete premium itinerary travel intelligence"
   ```

3. **Push**:
   ```bash
   git push origin main
   ```

4. **Deploy to Vercel**:
   - See DEPLOY_NOTES.md for step-by-step instructions
   - Or use Vercel CLI: `vercel deploy --prod`

## 🆘 Troubleshooting

### Build Fails with Module Errors

1. Clear node_modules and reinstall:
   ```bash
   rm -r node_modules package-lock.json
   npm install
   npm run build
   ```

2. Check for circular imports:
   ```bash
   grep -r "import.*from.*itinerary-enricher" app/
   ```

### CSS Not Loading in Browser

1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check that `.module.css` files exist in `app/components/`

### TypeScript Errors

If the app has TypeScript configuration:

1. Check `tsconfig.json` exists
2. Rebuild: `npm run build`
3. Check compiler output for specific errors

## 📞 Support

For issues:

1. Check the error message carefully
2. Review the code changes in `PHASE11_3_STATUS.md`
3. Check browser console for runtime errors (F12)
4. Verify all files exist (see files list above)

---

**Last Updated**: Phase 11.3 (Itinerary & UI Overhaul)
**Status**: Ready for build and deployment validation
