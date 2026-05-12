'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('andor_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const register = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('andor_users') || '[]');
    if (users.find(u => u.email === email)) {
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
    users.push({ ...newUser, password });
    localStorage.setItem('andor_users', JSON.stringify(users));
    localStorage.setItem('andor_user', JSON.stringify(newUser));
    setUser(newUser);
    return { success: true };
  };

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('andor_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) {
      return { error: 'Invalid email or password.' };
    }
    const { password: _, ...userData } = found;
    localStorage.setItem('andor_user', JSON.stringify(userData));
    setUser(userData);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('andor_user');
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('andor_user', JSON.stringify(updated));
    // Also update in users array
    const users = JSON.parse(localStorage.getItem('andor_users') || '[]');
    const idx = users.findIndex(u => u.id === updated.id);
    if (idx !== -1) {
      const pwd = users[idx].password;
      users[idx] = { ...updated, password: pwd };
      localStorage.setItem('andor_users', JSON.stringify(users));
    }
  };

  const saveTrip = (trip) => {
    const newTrip = { ...trip, id: Date.now().toString(), savedAt: new Date().toISOString() };
    const updatedTrips = [...(user.trips || []), newTrip];
    updateUser({ trips: updatedTrips });
    return newTrip;
  };

  const toggleCountry = (countryCode) => {
    const current = user.visitedCountries || [];
    const updated = current.includes(countryCode)
      ? current.filter(c => c !== countryCode)
      : [...current, countryCode];
    updateUser({ visitedCountries: updated });
  };

  return (
    <AuthContext.Provider value={{
      user, loading, register, login, logout, updateUser, saveTrip, toggleCountry
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
