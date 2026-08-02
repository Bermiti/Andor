// Backwards-compatible alias. The canonical endpoint is /api/itineraries/:id/ledger.
export const runtime = 'nodejs';
export { GET, PUT } from '../../../itineraries/[id]/ledger/route';
