import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserResponse } from "shared";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshTokenOnce,
} from "../lib/api";
import {
  clearAccessToken,
  setAccessToken,
} from "../lib/token";

interface AuthContextValue {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const token = await refreshTokenOnce();
        if (!token) return;

        const me = await getCurrentUser();
        if (!cancelled) setUser(me);
      } catch {
        clearAccessToken();
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser, accessToken } = await loginUser({
      email,
      password,
    });
    setAccessToken(accessToken);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    clearAccessToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isInitializing,
      login,
      logout,
    }),
    [user, isInitializing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}