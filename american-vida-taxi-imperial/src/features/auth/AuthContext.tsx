import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setAuthToken } from '@/lib/apiClient';
import type { AuthUser, Session } from './types';

const STORAGE_KEY = 'av-ti.session';

interface AuthContextValue {
  session: Session | null;
  signIn: (session: Session, remember: boolean) => void;
  signOut: () => void;
  updateUser: (changes: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    setAuthToken(session.token);
    return session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);

  const signIn = useCallback((next: Session, remember: boolean) => {
    setAuthToken(next.token);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const updateUser = useCallback((changes: Partial<AuthUser>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next: Session = { ...prev, user: { ...prev.user, ...changes } };
      const storage = localStorage.getItem(STORAGE_KEY) ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ session, signIn, signOut, updateUser }),
    [session, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
