import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, refreshSession, setAccessToken, setSessionLostHandler } from '../api';
import { reconnectSocket } from '../socket';

const AuthContext = createContext(null);

// Seconds until a JWT expires (0 if unreadable)
function secondsUntilExpiry(jwt) {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Math.max(0, payload.exp - Date.now() / 1000);
  } catch {
    return 0;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  const clearSession = useCallback(() => {
    clearTimeout(refreshTimer.current);
    setAccessToken(null);
    setToken(null);
    setUser(null);
    reconnectSocket();
  }, []);

  const applySession = useCallback((nextToken, nextUser) => {
    setAccessToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  // Refresh a minute before the access token expires so long-lived sockets
  // and idle tabs keep a valid token
  useEffect(() => {
    clearTimeout(refreshTimer.current);
    if (!token) return;
    const delay = Math.max(10, secondsUntilExpiry(token) - 60) * 1000;
    refreshTimer.current = setTimeout(async () => {
      try {
        const data = await refreshSession();
        applySession(data.accessToken, data.user);
      } catch {
        clearSession();
      }
    }, delay);
    return () => clearTimeout(refreshTimer.current);
  }, [token, applySession, clearSession]);

  // Restore the session from the httpOnly refresh cookie on page load
  useEffect(() => {
    setSessionLostHandler(clearSession);
    let cancelled = false;
    refreshSession()
      .then((data) => {
        if (cancelled) return;
        applySession(data.accessToken, data.user);
        reconnectSocket();
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [applySession, clearSession]);

  const login = useCallback((nextToken, userPayload) => {
    applySession(nextToken, userPayload);
    reconnectSocket();
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Clear locally even if the server is unreachable
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(() => ({ token, user, loading, login, logout }), [token, user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
