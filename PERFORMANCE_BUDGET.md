# Andor Performance Budget

Mobile targets:

- No horizontal overflow at 390px.
- LCP under 2.5s on a good mobile connection.
- CLS under 0.1.
- INP under 200ms.
- Itinerary tab switch feels under 150ms.
- Activity expand responds under 100ms.
- Chat typing has no visible lag.
- Map, PDF, and other heavy features do not block homepage rendering.

Bundle safeguards:

- Leaflet stays isolated to itinerary map usage.
- `html2pdf.js` is dynamically imported only when PDF export starts.
- QR/PDF/chart-style libraries should be dynamically imported if added.
- Homepage must not import itinerary map or PDF code.
- Itinerary derived data should be memoized or scoped so tab switches do not rerender the full product.

Observed heavy dependencies:

- `leaflet`: map rendering; keep client-only and route-local.
- `html2pdf.js`: export only; already dynamically imported in the PDF action.
- `three` and `react-globe.gl`: keep away from core mobile itinerary unless explicitly needed.
- AI SDK/provider packages: server/API only.

Launch measurement:

- Run Playwright mobile regression for overflow and interaction checks.
- Run Lighthouse on a production-like build when Chrome/Lighthouse is available.
- Capture Safari video for map, chat, wizard keyboard, and PDF flows before launch.
