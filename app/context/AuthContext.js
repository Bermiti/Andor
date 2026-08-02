'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  bindBrowserDataToUser,
  clearBrowserDataSubject,
  hasBrowserDataSubject,
} from '../lib/browser-data-boundary';

const AuthContext = createContext(null);

const PROFILE_UPDATE_KEYS = new Set([
  'name',
  'bio',
  'interests',
  'visitedCountries',
  'lookingForBuddy',
]);

function profileUpdatesOnly(updates = {}) {
  return Object.fromEntries(
    Object.entries(updates).filter(([key, value]) => (
      PROFILE_UPDATE_KEYS.has(key) && value !== undefined
    ))
  );
}

async function readPayload(response) {
  return response.json().catch(() => null);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('server');

  const refreshSession = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const payload = await readPayload(response);
      if (!response.ok || !payload?.authenticated || !payload?.user) {
        if (hasBrowserDataSubject()) clearBrowserDataSubject();
        setUser(null);
        setProvider('none');
        return null;
      }
      bindBrowserDataToUser(payload.user.id);
      setUser(payload.user);
      setProvider(payload.provider || 'server');
      return payload.user;
    } catch (error) {
      // Network failures do not turn a stale browser cache into an identity.
      setUser(null);
      setProvider('none');
      return null;
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
    const handleFocus = () => refreshSession({ quiet: true });
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshSession]);

  const register = async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email, password }),
      });
      const payload = await readPayload(response);
      if (!response.ok) {
        return { error: payload?.error?.message || 'Nao foi possivel criar a conta.' };
      }

      setProvider(payload.provider || 'server');
      if (payload.authenticated && payload.user) {
        bindBrowserDataToUser(payload.user.id);
        setUser(payload.user);
      } else {
        setUser(null);
      }
      return {
        success: true,
        pendingVerification: Boolean(payload.pendingVerification),
        provider: payload.provider,
      };
    } catch (error) {
      return { error: 'Nao foi possivel ligar ao servidor.' };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      const payload = await readPayload(response);
      if (!response.ok || !payload?.authenticated || !payload?.user) {
        return { error: payload?.error?.message || 'Email ou palavra-passe invalidos.' };
      }
      bindBrowserDataToUser(payload.user.id);
      setUser(payload.user);
      setProvider(payload.provider || 'server');
      return { success: true, provider: payload.provider };
    } catch (error) {
      return { error: 'Nao foi possivel ligar ao servidor.' };
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    }).catch(() => null);
    clearBrowserDataSubject();
    setUser(null);
    setProvider('none');
  };

  const updateUser = (updates) => {
    if (!user) return null;
    const updated = { ...user, ...updates };
    setUser(updated);

    const profileUpdates = profileUpdatesOnly(updates);
    if (Object.keys(profileUpdates).length > 0) {
      fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(profileUpdates),
      }).then(async (response) => {
        if (response.status === 401) {
          setUser(null);
          setProvider('none');
          return;
        }
        const payload = await readPayload(response);
        if (!response.ok || !payload?.user) return;
        setUser((current) => {
          if (!current || current.id !== payload.user.id) return current;
          return {
            ...current,
            ...payload.user,
            trips: current.trips || payload.user.trips || [],
          };
        });
      }).catch(() => null);
    }
    return updated;
  };

  const saveTrip = async (trip) => {
    if (!user) return { ok: false, status: 'auth_required' };
    const isDurableTrip = typeof trip?.id === 'string'
      && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trip.id)
      && Number.isInteger(Number(trip.version));
    const response = await fetch(
      isDurableTrip ? `/api/itineraries/${encodeURIComponent(trip.id)}` : '/api/itineraries',
      {
        method: isDurableTrip ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isDurableTrip ? { 'If-Match': `"${Number(trip.version)}"` } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify(isDurableTrip
          ? { itinerary: trip }
          : { itinerary: trip, source: 'manual' }),
      }
    );
    const payload = await readPayload(response);
    if (!response.ok || !payload?.trip) {
      return {
        ok: false,
        status: response.status === 409 ? 'conflict' : 'error',
        error: payload?.error || null,
      };
    }
    const durableTrip = payload.trip;
    setUser((current) => {
      if (!current || current.id !== user.id) return current;
      const trips = (current.trips || []).filter((item) => item.id !== durableTrip.id);
      return { ...current, trips: [durableTrip, ...trips] };
    });
    return { ok: true, trip: durableTrip, persistence: payload.persistence };
  };

  const toggleCountry = (countryCode) => {
    if (!user) return;
    const current = user.visitedCountries || [];
    const visitedCountries = current.includes(countryCode)
      ? current.filter((item) => item !== countryCode)
      : [...current, countryCode];
    updateUser({ visitedCountries });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      register,
      login,
      logout,
      updateUser,
      saveTrip,
      toggleCountry,
      refreshSession,
      authProvider: provider,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
