import 'server-only';

import { createSupabaseAdminClient } from '../supabase/admin';
import { createEmptyLedger, normalizeExpenseLedger } from '../expense-ledger';
import { logger } from '../logger';
import { getRequestIdentity } from './identity';
import { getLocalLedger, upsertLocalLedger } from './local-db';

export async function getTripLedger(tripKey, identityOverride = null) {
  const identity = identityOverride || await getRequestIdentity();
  if (!identity?.ownerKey) return { ok: false, status: 'auth_required' };

  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('trip_ledgers')
      .select('ledger, updated_at')
      .eq('trip_key', String(tripKey))
      .eq('owner_key', identity.ownerKey)
      .maybeSingle();
    if (!error && data) {
      return { ok: true, provider: 'supabase', ledger: normalizeExpenseLedger(data.ledger), updatedAt: data.updated_at };
    }
    if (error) logger.warn('supabase:get_trip_ledger_failed', error, { tripKey });
  }

  const local = getLocalLedger(String(tripKey), identity.ownerKey);
  return {
    ok: true,
    provider: 'sqlite',
    ledger: local ? normalizeExpenseLedger(local.ledger) : createEmptyLedger(),
    updatedAt: local?.updatedAt || null,
  };
}

export async function saveTripLedger(tripKey, input, identityOverride = null) {
  const identity = identityOverride || await getRequestIdentity();
  if (!identity?.ownerKey) return { ok: false, status: 'auth_required' };
  const ledger = normalizeExpenseLedger(input);
  const updatedAt = new Date().toISOString();

  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from('trip_ledgers').upsert({
      trip_key: String(tripKey),
      owner_key: identity.ownerKey,
      ledger,
      updated_at: updatedAt,
    }, { onConflict: 'trip_key,owner_key' });
    if (!error) return { ok: true, provider: 'supabase', ledger, updatedAt };
    logger.warn('supabase:save_trip_ledger_failed', error, { tripKey });
  }

  const local = upsertLocalLedger(String(tripKey), identity.ownerKey, ledger);
  return { ok: true, provider: 'sqlite', ledger, updatedAt: local.updatedAt };
}
