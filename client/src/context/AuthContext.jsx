import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // ── Validate existing token on mount ────────────────────────────────────
  useEffect(() => {
    if (token) {
      API.get('/auth/me')
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          // Token invalid / backend down — clear everything so user sees login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []); // run once on mount only

  // ── Register (Signup) ────────────────────────────────────────────────────
  const register = async ({ name, email, password }) => {
    const res = await API.post('/auth/register', { name, email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await API.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  // ── Update Profile ───────────────────────────────────────────────────────
  const updateProfile = async (profileData) => {
    const response = await API.put('/auth/profile', profileData);
    setUser(response.data.user);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data.user;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,

      // Auth methods
      login,
      register,
      logout,
      updateProfile,

      // Role helpers (unchanged — keeps AdminRoute / ProtectedRoute working)
      isOwner:    user?.role === 'OWNER',
      isAdmin:    ['OWNER', 'ADMIN', 'STAFF'].includes(user?.role),
      isDelivery: user?.role === 'DELIVERY',
      isCustomer: user?.role === 'CUSTOMER'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
