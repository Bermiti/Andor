'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '../lib/supabase/client';
import { safeParse, safeStringify } from '../lib/safe-json';

const AuthContext = createContext(null);

function mapAuthUser(authUser, profile = {}) {
  if (!authUser) return null;
  const metadata = authUser.user_metadata || {};
  return {
    id: authUser.id,
    name: profile.name || metadata.name || authUser.email?.split('@')[0] || 'Viajante',
    email: authUser.email || profile.email || '',
    createdAt: authUser.created_at || profile.created_at || new Date().toISOString(),
    visitedCountries: profile.visited_countries || profile.visitedCountries || [],
    trips: profile.trips || [],
    interests: profile.interests || ['History', 'Food'],
    bio: profile.bio || '',
    lookingForBuddy: Boolean(profile.looking_for_buddy || profile.lookingForBuddy),
  };
}

function toProfileRow(user, updates = {}) {
  return {
    id: user.id,
    email: updates.email || user.email || '',
    name: updates.name || user.name || '',
    bio: updates.bio ?? user.bio ?? '',
    interests: updates.interests || user.interests || [],
    visited_countries: updates.visitedCountries || updates.visited_countries || user.visitedCountries || [],
    looking_for_buddy: Boolean(updates.lookingForBuddy ?? updates.looking_for_buddy ?? user.lookingForBuddy),
    updated_at: new Date().toISOString(),
  };
}

function loadLocalUser() {
  try {
    return safeParse(localStorage.getItem('andor_user'), null);
  } catch (error) {
    return null;
  }
}

function saveLocalUser(user) {
  try {
    if (user) localStorage.setItem('andor_user', safeStringify(user));
    else localStorage.removeItem('andor_user');
  } catch (error) {}
}

function upsertLocalUser(user) {
  try {
    const users = safeParse(localStorage.getItem('andor_users'), []) || [];
    const index = users.findIndex((item) => item.id === user.id || item.email === user.email);
    if (index >= 0) users[index] = user;
    else users.push(user);
    localStorage.setItem('andor_users', safeStringify(users));
  } catch (error) {}
}

export function AuthProvider({ children }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUser) => {
    if (!supabase || !authUser?.id) return null;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    return data || null;
  };

  const persistProfile = async (nextUser, updates = {}) => {
    if (!supabase || !nextUser?.id) return;
    await supabase.from('profiles').upsert(toProfileRow(nextUser, updates), { onConflict: 'id' });
  };

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      if (!supabase) {
        setUser(loadLocalUser());
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (!active) return;

      if (error || !data?.user) {
        setUser(null);
        saveLocalUser(null);
        setLoading(false);
        return;
      }

      const profile = await fetchProfile(data.user);
      if (!active) return;
      const mapped = mapAuthUser(data.user, profile);
      setUser(mapped);
      saveLocalUser(mapped);
      setLoading(false);
    };

    hydrate();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const { data: subscriptionData } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setUser(null);
        saveLocalUser(null);
        return;
      }
      const profile = await fetchProfile(session.user);
      if (!active) return;
      const mapped = mapAuthUser(session.user, profile);
      setUser(mapped);
      saveLocalUser(mapped);
    });

    return () => {
      active = false;
      subscriptionData?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const register = async (name, email, password) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) return { error: error.message };

      if (data?.user) {
        const mapped = mapAuthUser(data.user, { name, email });
        setUser(mapped);
        saveLocalUser(mapped);
        persistProfile(mapped, { name, email }).catch(() => {});
      }
      return { success: true, pendingVerification: !data?.session };
    }

    const users = safeParse(localStorage.getItem('andor_users'), []) || [];
    if (users.find((item) => item.email === email)) {
      return { error: 'This email is already registered.' };
    }
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      createdAt: new Date().toISOString(),
      visitedCountries: [],
      trips: [],
      interests: ['History', 'Food'],
      bio: '',
      lookingForBuddy: false,
    };
    users.push(newUser);
    localStorage.setItem('andor_users', safeStringify(users));
    saveLocalUser(newUser);
    setUser(newUser);
    return { success: true, provider: 'local' };
  };

  const login = async (email, password) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      const profile = await fetchProfile(data.user);
      const mapped = mapAuthUser(data.user, profile);
      setUser(mapped);
      saveLocalUser(mapped);
      return { success: true };
    }

    const users = safeParse(localStorage.getItem('andor_users'), []) || [];
    const found = users.find((item) => item.email === email);
    if (!found) {
      return { error: 'Email not found. Please register first.' };
    }
    saveLocalUser(found);
    setUser(found);
    return { success: true, provider: 'local' };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    saveLocalUser(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    if (!user) return null;
    const updated = { ...user, ...updates };
    setUser(updated);
    saveLocalUser(updated);
    upsertLocalUser(updated);
    persistProfile(updated, updates).catch(() => {});
    return updated;
  };

  const saveTrip = (trip) => {
    if (!user) return null;
    const newTrip = { ...trip, id: trip.id || Date.now().toString(), savedAt: new Date().toISOString() };
    const updatedTrips = [...(user.trips || []), newTrip];
    updateUser({ trips: updatedTrips });
    if (newTrip.id) {
      fetch(`/api/itineraries/${newTrip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary: newTrip }),
      }).catch(() => {});
    }
    return newTrip;
  };

  const toggleCountry = (countryCode) => {
    if (!user) return;
    const current = user.visitedCountries || [];
    const updated = current.includes(countryCode)
      ? current.filter((item) => item !== countryCode)
      : [...current, countryCode];
    updateUser({ visitedCountries: updated });
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
      authProvider: supabase ? 'supabase' : 'local',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
