import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  deleteAccount as deleteAccountRequest,
  type AuthUser,
  signIn as signInRequest,
  signOut as signOutRequest,
  signUp as signUpRequest,
} from '@/lib/mobile-api';
import { getStoredToken, storeToken } from '@/lib/auth-storage';
import { recordAiConsent } from '@workspace/api-client-react';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, aiConsent?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getStoredToken()
      .then(setToken)
      .finally(() => setIsReady(true));
  }, []);

  const applyAuth = useCallback(async (nextToken?: string, nextUser?: AuthUser) => {
    if (!nextToken) throw new Error('The server did not return a mobile access token.');
    await storeToken(nextToken);
    setToken(nextToken);
    setUser(nextUser ?? null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInRequest(email, password);
    await applyAuth(result.token, result.user);
  }, [applyAuth]);

  const signUp = useCallback(async (name: string, email: string, password: string, aiConsent = false) => {
    const result = await signUpRequest(name, email, password);
    await applyAuth(result.token, result.user);
    if (aiConsent) await recordAiConsent();
  }, [applyAuth]);

  const clearAuth = useCallback(async () => {
    await storeToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const signOut = useCallback(async () => {
    if (token) await signOutRequest(token).catch(() => undefined);
    await clearAuth();
  }, [clearAuth, token]);

  const deleteAccount = useCallback(async (password: string) => {
    if (!token) return;
    await deleteAccountRequest(password, token);
    await clearAuth();
  }, [clearAuth, token]);

  const value = useMemo(
    () => ({ token, user, isReady, signIn, signUp, signOut, deleteAccount }),
    [token, user, isReady, signIn, signUp, signOut, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}