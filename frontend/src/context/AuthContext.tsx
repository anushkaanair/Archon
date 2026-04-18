import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: check for active session via /auth/me (httpOnly cookie) or localStorage fallback
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(data.token || 'session');
        } else {
          // Fallback to localStorage (dev/demo mode)
          const savedUser = localStorage.getItem('archon_user');
          const savedToken = localStorage.getItem('archon_token');
          if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
          }
        }
      } catch {
        // Network error or backend not running — try localStorage
        const savedUser = localStorage.getItem('archon_user');
        const savedToken = localStorage.getItem('archon_token');
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('archon_token', newToken);
    localStorage.setItem('archon_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('archon_token');
    localStorage.removeItem('archon_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
