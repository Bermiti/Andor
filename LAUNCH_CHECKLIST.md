# Andor Launch Checklist

Run these before every production deploy:

```bash
npm install
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run eval:itineraries -- --fixtures
npm.cmd run check:launch
```

Run live itinerary eval only when the app is running and provider env vars are available:

```bash
set ANDOR_EVAL_BASE_URL=http://localhost:3000
npm.cmd run eval:itineraries -- --live
```

Required and optional environment variables:

- `GROQ_API_KEY`: itinerary generation provider.
- `GOOGLE_GENERATIVE_AI_API_KEY`: itinerary generation fallback provider.
- `ANTHROPIC_API_KEY`: concierge chat provider.
- `ANDOR_EVAL_BASE_URL` or `EVAL_BASE_URL`: local/prod base URL for live evals.

Manual iPhone Safari QA:

- Homepage: hero visible, search stacked, no horizontal scroll, autocomplete usable.
- Wizard: keyboard open on destination input, all steps reachable, buttons above safe area.
- Tokyo itinerary: day tabs scroll, map is 240px high, activity expands, budget opens.
- Modals: share, booking, regenerate, and budget close on Escape/backdrop/close button.
- Chat: opens over the app, textarea stays above keyboard, suggestions remain tappable.
- PDF: generating state appears and failure toast is understandable if Safari blocks download.
- Offline: generation/chat explain what is unavailable and do not crash.

Known limitations:

- Local-only share URLs rely on browser storage. Export PDF for durable external sharing.
- Live AI quality depends on provider behavior, so fixture eval is required and live eval is recommended before deploy.
- Leaflet may create internal offscreen tile elements; launch tests assert page scroll width stays correct.

Rollback:

1. Revert the deploy in the hosting provider.
2. Revert or cherry-pick the last safe Git commit.
3. Re-run `npm.cmd run build`, `npm.cmd run test:e2e`, and fixture eval before redeploying.
