import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('medchain_user');
      const token  = localStorage.getItem('medchain_token');
      if (stored && token) {
        const parsed = JSON.parse(stored);
        if (parsed?._id && parsed?.role) setUser(parsed);
        else localStorage.clear();
      }
    } catch { localStorage.clear(); }
    finally { setLoading(false); }
  }, []);

  const _persist = (data) => {
    localStorage.setItem('medchain_token', data.token);
    localStorage.setItem('medchain_user',  JSON.stringify(data));
    setUser(data);
  };

  // General login — for manufacturer, distributor, pharmacy, hospital
  const login = useCallback(async (email, password) => {
    const res  = await authAPI.login({ email, password });
    const data = res.data.data;
    _persist(data);
    return data;
  }, []);

  // Admin-only login — uses separate endpoint
  const adminLogin = useCallback(async (email, password) => {
    const res  = await authAPI.adminLogin({ email, password });
    const data = res.data.data;
    _persist(data);
    return data;
  }, []);

  // Public registration — only for non-admin roles
  const register = useCallback(async (formData) => {
    const res  = await authAPI.register(formData);
    const data = res.data.data;
    _persist(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('medchain_token');
    localStorage.removeItem('medchain_user');
    setUser(null);
    toast.success('Signed out successfully');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res    = await authAPI.getMe();
      const fresh  = res.data.data;
      const token  = localStorage.getItem('medchain_token');
      const merged = { ...fresh, token };
      localStorage.setItem('medchain_user', JSON.stringify(merged));
      setUser(merged);
    } catch {}
  }, []);

  // isRole — admin always passes any role check
  const isRole = useCallback((...roles) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return roles.includes(user.role);
  }, [user]);

  const isApproved = user?.role === 'admin' || user?.isApproved === true;

  return (
    <AuthContext.Provider value={{
      user, loading, login, adminLogin, register,
      logout, refreshUser, isRole, isApproved,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
