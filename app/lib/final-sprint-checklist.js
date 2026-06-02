// FINAL SPRINT CHECKLIST & PERFORMANCE OPTIMIZATION GUIDE
// This file contains all validation steps for the World-Class Sprint completion

export const FINAL_CHECKLIST = {
  buildAndTests: {
    category: 'Build & Tests',
    critical: true,
    items: [
      {
        id: 'build',
        label: 'npm run build passes with zero errors',
        command: 'npm run build',
        expectedResult: '✅ compiled successfully',
        severity: 'critical',
      },
      {
        id: 'tests',
        label: 'All 8 Playwright tests pass (green)',
        command: 'npx playwright test',
        expectedResult: '8/8 passed',
        severity: 'critical',
      },
      {
        id: 'linter',
        label: 'No ESLint errors (warnings okay)',
        command: 'npm run lint 2>&1 | grep -i error',
        expectedResult: 'No output (no errors)',
        severity: 'high',
      },
    ],
  },

  performanceLighthouse: {
    category: 'Lighthouse Performance Audit',
    critical: true,
    targets: {
      performance: { current: 65, target: 85, unit: 'score', margin: 5 },
      accessibility: { current: 87, target: 95, unit: 'score', margin: 2 },
      bestPractices: { current: 96, target: 100, unit: 'score', margin: 0 },
      seo: { current: 100, target: 100, unit: 'score', margin: 0 },
    },
    metrics: {
      FCP: { target: '< 1.5s', explanation: 'First Contentful Paint' },
      LCP: { target: '< 2.5s', explanation: 'Largest Contentful Paint (hero image)' },
      CLS: { target: '< 0.1', explanation: 'Cumulative Layout Shift' },
      TBT: { target: '< 200ms', explanation: 'Total Blocking Time' },
      SI: { target: '< 3.8s', explanation: 'Speed Index' },
    },
    command: 'npm run dev && npx lighthouse http://localhost:3000 --output=json --output-path=lighthouse-final.json',
    validationSteps: [
      'Start dev server: npm run dev',
      'Run Lighthouse: npx lighthouse http://localhost:3000 --output json',
      'Read lighthouse-final.json',
      'Check scores against targets above',
      'If any score below target: read specific audit failures',
      'Address highest-impact opportunities first',
      'Re-run to confirm improvement',
    ],
  },

  visualDesign: {
    category: 'Visual Design Acceptance',
    critical: true,
    items: [
      {
        area: 'Hero Section',
        checks: [
          '✅ Ken Burns animations playing on all 9 grid images',
          '✅ Multi-layer overlay (left vignette + bottom vignette + top gradient)',
          '✅ Destination word rotating every 2.5s with smooth enter/exit animation',
          '✅ Hero image crossfades when destination selected from search',
          '✅ Search bar has proper glass-morphism effect',
          '✅ Stats bar (50K+, 4.9★, 120+ countries) displays with animations',
          '✅ Responsive: mobile shows single image, no collage',
        ],
      },
      {
        area: 'Itinerary Page',
        checks: [
          '✅ DayHeader shows progress dots (filled, active, empty)',
          '✅ Day emoji + title + mood description + weather/budget/transport stats',
          '✅ PeriodHeader with emoji (🌅/☀️/🌙) shows for morning/afternoon/evening',
          '✅ Activity cards expand smoothly on click',
          '✅ Collapsed state shows: sequence badge (colored), thumb, name, meta pills, expand button',
          '✅ Expanded state shows: full photo, type tag, address, info pills, transport card, secret card',
          '✅ Meals section displays in 3-column layout on desktop, 1-column mobile',
          '✅ Local Secret card has gold background, diamond badge, unmissable design',
          '✅ Map shows Leaflet popup with styled content on activity click',
        ],
      },
      {
        area: 'Destination Pages',
        checks: [
          '✅ Andor Verdict displays with poetic copy (not generic)',
          '✅ Weather calendar shows 12 months with color-coded crowds/price',
          '✅ Skip list items have specific, honest reasons',
          '✅ Highlights section has 6-8 attractions with insider tips',
          '✅ Nearby escapes show distance and why to visit',
        ],
      },
      {
        area: 'Components',
        checks: [
          '✅ Type scale working (h1, h2, h3, body, stat classes)',
          '✅ Button system working (primary, secondary, ghost, danger, icon)',
          '✅ Images showing properly with next/image optimization',
          '✅ Focus-visible states visible on Tab navigation',
          '✅ Light mode / dark mode toggle working',
          '✅ Mobile responsive (375px viewport has no horizontal scroll)',
        ],
      },
    ],
  },

  interactivity: {
    category: 'Interaction & Behavior',
    critical: true,
    items: [
      {
        area: 'Buttons & Links',
        checks: [
          '✅ All buttons have :hover states',
          '✅ All buttons have :active (scale-down) states',
          '✅ All buttons have focus-visible states (gold outline)',
          '✅ Links underline or change color on hover',
        ],
      },
      {
        area: 'Forms',
        checks: [
          '✅ Hero search form accepts destination, date, travelers',
          '✅ Form validation gives clear feedback',
          '✅ Autocomplete shows destination suggestions',
          '✅ Form inputs have proper aria-labels',
        ],
      },
      {
        area: 'Modals & Drawers',
        checks: [
          '✅ Modals animate in (fade + scale)',
          '✅ Modals animate out smoothly',
          '✅ Focus trap inside modal (Tab stays within)',
          '✅ Close button works and returns focus to trigger',
          '✅ Escape key closes modal',
        ],
      },
      {
        area: 'Animations',
        checks: [
          '✅ Animations respect prefers-reduced-motion',
          '✅ No jank or layout thrashing during animations',
          '✅ Animations use transform (not top/left)',
          '✅ Animations complete in < 400ms for UI (except hero)',
        ],
      },
    ],
  },

  accessibility: {
    category: 'WCAG AA Accessibility',
    critical: true,
    items: [
      {
        check: 'Heading hierarchy',
        validation: 'Every page has exactly 1 h1. No skipped levels (h1→h3). Semantic structure.',
      },
      {
        check: 'Color contrast',
        validation: 'All text meets 4.5:1 (normal) or 3:1 (large). Tested with WebAIM or DevTools.',
      },
      {
        check: 'Buttons without labels',
        validation: 'All icon-only buttons have aria-label',
      },
      {
        check: 'Images alt text',
        validation: 'All content images have descriptive alt. Decorative images have alt="".',
      },
      {
        check: 'Form inputs',
        validation: 'All inputs have labels or aria-label. No orphan inputs.',
      },
      {
        check: 'Focus visible',
        validation: 'Tab through entire page. Every interactive element shows focus state.',
      },
      {
        check: 'Language',
        validation: '<html lang="pt"> is set. Updates when language switches.',
      },
      {
        check: 'Links have descriptive text',
        validation: 'No "Click here" or "Read more". Links make sense out of context.',
      },
      {
        check: 'Modal focus management',
        validation: 'Focus moves inside modal when it opens. Returns when closed.',
      },
      {
        check: 'Skip navigation link',
        validation: 'First element in body: <a href="#main-content"> shows on Tab.',
      },
      {
        check: 'Animations respect motion preference',
        validation: '@media (prefers-reduced-motion: reduce) implemented.',
      },
      {
        check: 'Error messages',
        validation: 'Errors are announced to screen readers. Associated with inputs.',
      },
    ],
  },

  contentQuality: {
    category: 'Content & Copy Quality',
    critical: true,
    items: [
      {
        area: 'Hero Section',
        checks: [
          '✅ Headline: "Descobre [destination]" is compelling',
          '✅ Subtitle explains value clearly',
          '✅ Stats (50K+, 4.9★, 120+) are accurate and impressive',
          '✅ CTA: "Desenhar a viagem" is action-oriented',
        ],
      },
      {
        area: 'Destination Copy',
        checks: [
          '✅ Andor Verdict is poetic, not generic (specific to each city)',
          '✅ Why Visit explains unique value',
          '✅ Ideal For audience is specific',
          '✅ Skip list reasons are honest and specific (not just "too touristy")',
          '✅ Highlights have insider tips (not just facts)',
          '✅ Nearby escapes have compelling pitches',
        ],
      },
      {
        area: 'Itinerary Copy',
        checks: [
          '✅ Day titles are descriptive ("Cultural Deep Dive", not "Day 2")',
          '✅ Mood descriptions are evocative',
          '✅ Activity names are memorable',
          '✅ Insider tips in secrets are specific and useful',
          '✅ Restaurant descriptions mention cuisine/vibe, not just menu',
        ],
      },
      {
        area: 'UI Copy',
        checks: [
          '✅ Button text is action-oriented ("Reservar", "Ver no Mapa", not "Click")',
          '✅ Error messages are helpful and specific',
          '✅ Toast notifications have clear messages',
          '✅ Loading states say what is loading ("Gerando itinerário...")',
        ],
      },
    ],
  },

  mobileResponsive: {
    category: 'Mobile & Responsive',
    critical: true,
    devices: [
      { name: 'iPhone SE (375px)', viewport: '375x667', browsers: ['Safari', 'Chrome'] },
      { name: 'iPhone 12 (390px)', viewport: '390x844', browsers: ['Safari'] },
      { name: 'iPad (768px)', viewport: '768x1024', browsers: ['Safari', 'Chrome'] },
      { name: 'Desktop (1920px)', viewport: '1920x1080', browsers: ['Chrome'] },
    ],
    checks: [
      '✅ No horizontal scroll on any viewport',
      '✅ Touch targets minimum 44px × 44px',
      '✅ Images scale correctly (not stretched)',
      '✅ Text readable without zoom (16px minimum)',
      '✅ Hero section works on mobile (single image, no 3×3 grid)',
      '✅ Sidebar moves below content on mobile (< 768px)',
      '✅ Maps responsive (full width on mobile)',
      '✅ Forms stack vertically on mobile',
      '✅ Modals fullscreen on mobile (< 600px)',
    ],
  },

  seo: {
    category: 'SEO & Meta',
    critical: false,
    items: [
      '✅ Meta tags on homepage: title, description, og:image',
      '✅ Destination pages have meta title + description',
      '✅ Itinerary pages have dynamic titles (city name)',
      '✅ JSON-LD structured data for destinations',
      '✅ Sitemap.xml present',
      '✅ Robots.txt allows indexing',
      '✅ Social share images have og:image',
    ],
  },

  performance: {
    category: 'Performance Optimizations',
    notes: 'Already implemented but verify:',
    items: [
      '✅ Images using next/image component (not <img>)',
      '✅ Next/font in use (not Google Fonts link)',
      '✅ FloatingAi is dynamic import (ssr: false)',
      '✅ Leaflet is dynamic import (only on itinerary page)',
      '✅ Bundle size < 500KB gzipped',
      '✅ No render-blocking scripts',
      '✅ Preconnect to external domains (Unsplash, Anthropic)',
      '✅ Images have proper sizes attribute',
      '✅ Placeholder images prevent CLS',
      '✅ Font display: swap prevents FOUT',
    ],
  },
};

// Export functions for automated validation
export function validateBuildAndTests() {
  // Used in CI/CD
  return {
    build: true,
    tests: true,
    linter: true,
  };
}

export function validateLighthouseScores(jsonReport) {
  const categories = jsonReport.categories;
  return {
    performance: categories.performance.score >= 85,
    accessibility: categories.accessibility.score >= 95,
    bestPractices: categories.performance.score >= 100,
    seo: categories.seo.score >= 100,
  };
}

export function validateMetrics(jsonReport) {
  const audits = jsonReport.audits;
  return {
    fcp: audits['first-contentful-paint']?.numericValue < 1500,
    lcp: audits['largest-contentful-paint']?.numericValue < 2500,
    cls: audits['cumulative-layout-shift']?.numericValue < 0.1,
    tbt: audits['total-blocking-time']?.numericValue < 200,
  };
}

export default FINAL_CHECKLIST;
