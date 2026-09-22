import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { api, getStoredUser, getToken, isNetworkError, setStoredUser, setToken } from '../api/client';
import type { LoginResponse, User } from '../api/types';

interface AuthState {
  user: User | null;
  demoMode: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const DEMO_USERS: Record<string, User> = {
  driver: { id: 'demo-driver', name: 'Demo Driver', username: 'driver', email: null, role: 'DRIVER', lgaId: 'lga-galle', lgaName: 'Galle Municipal Council', facilityId: null, facilityName: null, active: true },
  supervisor: { id: 'demo-supervisor', name: 'Demo Supervisor', username: 'supervisor', email: null, role: 'COLLECTION_SUPERVISOR', lgaId: 'lga-galle', lgaName: 'Galle Municipal Council', facilityId: null, facilityName: null, active: true },
  receiving: { id: 'demo-receiving', name: 'Demo Receiving', username: 'receiving', email: null, role: 'FACILITY_RECEIVING_OFFICER', lgaId: null, lgaName: null, facilityId: 'fac-monroviawatta', facilityName: 'Monroviawatta', active: true },
  processing: { id: 'demo-processing', name: 'Demo Processing', username: 'processing', email: null, role: 'FACILITY_PROCESSING_OPERATOR', lgaId: null, lgaName: null, facilityId: 'fac-monroviawatta', facilityName: 'Monroviawatta', active: true },
  officer: { id: 'demo-officer', name: 'Demo Provincial Officer', username: 'officer', email: null, role: 'PROVINCIAL_OFFICER', lgaId: null, lgaName: null, facilityId: null, facilityName: null, active: true },
  admin: { id: 'demo-admin', name: 'Demo Administrator', username: 'admin', email: null, role: 'SYSTEM_ADMINISTRATOR', lgaId: null, lgaName: null, facilityId: null, facilityName: null, active: true }
};

const DEMO_PASSWORDS: Record<string, string> = {
  driver: 'driver123',
  supervisor: 'super123',
  receiving: 'receiving123',
  processing: 'processing123',
  officer: 'officer123',
  admin: 'admin123'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser<User>());
  const [demoMode, setDemoMode] = useState<boolean>(() => getToken() === 'demo-token');

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await api.post<LoginResponse>('/auth/login', { username, password });
      setToken(result.accessToken);
      setStoredUser(result.user);
      setUser(result.user);
      setDemoMode(false);
    } catch (err) {
      // Offline/demo fallback so the dashboard is always demonstrable.
      const key = username.trim().toLowerCase();
      if (isNetworkError(err) && DEMO_PASSWORDS[key] === password) {
        const demoUser = DEMO_USERS[key];
        setToken('demo-token');
        setStoredUser(demoUser);
        setUser(demoUser);
        setDemoMode(true);
        return;
      }
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setStoredUser(null);
    setUser(null);
    setDemoMode(false);
  }, []);

  const value = useMemo(() => ({ user, demoMode, login, logout }), [user, demoMode, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
