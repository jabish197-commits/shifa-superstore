import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { tokenStore } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const clear = () => setUser(null);
    window.addEventListener('shifa-signout', clear);
    let active = true;
    setLoading(true);
    setRestoreError(false);
    if (tokenStore.get())
      authService
        .me()
        .then(({ data }) => { if (active && tokenStore.get()) setUser(data); })
        .catch((error) => {
          if (!active) return;
          if (error.response?.status === 401) tokenStore.clear();
          else if (tokenStore.get()) setRestoreError(true);
        })
        .finally(() => { if (active) setLoading(false); });
    else setLoading(false);
    return () => { active = false; window.removeEventListener('shifa-signout', clear); };
  }, [attempt]);
  async function login(values) {
    const { data } = await authService.login(values);
    tokenStore.set({ access: data.access, refresh: data.refresh });
    setUser(data.user);
    return data.user;
  }
  async function logout() {
    try {
      await authService.me();
      const refresh = tokenStore.get()?.refresh;
      if (refresh) await authService.logout(refresh);
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {restoreError ? <main className="empty" role="alert">
        <h1>We could not reconnect to the store</h1>
        <p>Your login is saved. Check your connection and try again.</p>
        <button className="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
      </main> : children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
