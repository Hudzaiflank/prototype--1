import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import { authApi } from "../services/api/authApi";
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  setAccessToken,
  setStoredUser,
} from "../utils/storage";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [accessToken, setAccessTokenState] = useState(getAccessToken);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((session) => {
    const nextUser = session?.user ?? null;
    const nextToken = session?.accessToken ?? null;
    setUser(nextUser);
    setAccessTokenState(nextToken);
    if (nextUser) setStoredUser(nextUser);
    if (nextToken) setAccessToken(nextToken);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessTokenState(null);
    clearAuthStorage();
  }, []);

  const login = useCallback(
    async (credentials) => {
      const { data } = await authApi.login(credentials);
      applySession(data.data);
      return data.data;
    },
    [applySession],
  );

  const refresh = useCallback(async () => {
    const { data } = await authApi.refresh();
    const nextToken = data.data.accessToken;
    setAccessTokenState(nextToken);
    setAccessToken(nextToken);
    return nextToken;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (accessToken) await authApi.logout();
    } finally {
      clearSession();
    }
  }, [accessToken, clearSession]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        if (getAccessToken()) {
          const { data } = await authApi.me();
          if (active)
            applySession({ accessToken: getAccessToken(), user: data.data });
        } else if (getStoredUser()) {
          await refresh();
        }
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setIsLoading(false);
      }
    };
    restore();
    return () => {
      active = false;
    };
  }, [applySession, clearSession, refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: Boolean(user && accessToken),
        login,
        logout,
        refresh,
        setUser: applySession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
