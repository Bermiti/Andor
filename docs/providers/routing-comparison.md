# Routing Provider Evaluation & Architecture Decision Record

**Date:** 2026-08-03
**Status:** Evaluation Completed & Strategy Adopted

## Options Evaluated

1. **OSRM (Open Source Routing Machine) / Project OSRM:**
   - **Coverage:** Global (via OpenStreetMap)
   - **Supported Modes:** Walking, Driving, Cycling
   - **Authentication:** None required for public demo / OpenStreetMap servers; self-hostable via Docker/K8s.
   - **Cost / Quota:** Free / Open Data / Self-hostable for unlimited commercial usage.
   - **Suitability:** High (Primary engine for verified route geometry and durations).

2. **GraphHopper Routing API:**
   - **Coverage:** Global
   - **Supported Modes:** Walking, Driving, Cycling, Transit (Enterprise)
   - **Authentication:** Requires API Key (`GRAPHHOPPER_API_KEY`)
   - **Cost / Quota:** 500 requests/day free tier.
   - **Suitability:** High (Secondary fallback provider).

3. **Google Maps Directions API:**
   - **Coverage:** Global
   - **Supported Modes:** Walking, Driving, Cycling, Transit
   - **Authentication:** Requires API Key (`GOOGLE_MAPS_API_KEY`)
   - **Cost / Quota:** $5 per 1,000 requests.
   - **Suitability:** High (Commercial production upgrade path).

## Selected Solution
- **Primary:** OSRM Engine (`routing-provider.js` with fallback to `estimated_route` and `straight_line_distance`).
- **Modes Enabled:** `walking`, `driving`, `cycling`. `transit` requires verified public transport timetable integration.
