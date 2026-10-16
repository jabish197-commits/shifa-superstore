import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { tokenStore } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const clear = () => setUser(null);
    window.addEventListener('shifa-signout', clear);
    if (tokenStore.get())
      authService
        .me()
        .then(({ data }) => setUser(data))
        .catch(() => tokenStore.clear())
        .finally(() => setLoading(false));
    else setLoading(false);
    return () => window.removeEventListener('shifa-signout', clear);
  }, []);
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
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
