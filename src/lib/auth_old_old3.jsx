// src/lib/auth.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
// import { fetchJson } from "./api";
import { fetchJson } from "@/lib/api";

const AuthCtx = createContext(null);


// Normalize legacy roles -> your new two roles
const mapRole = (r) => {
  const m = {
    root: "super_admin",
    admin: "super_admin",
    cp_admin: "super_admin",
    super_admin: "super_admin",
    user: "user",
    normal: "user",
  };
  return m[r] || r || "user";
};

let state = { user: null, loading: true, tokens: null };

// --- helpers ---
function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function getAccessExp(accessToken) {
  const payload = parseJwt(accessToken);
  return payload?.exp ? payload.exp * 1000 : null; // ms epoch
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAuth = !!user;

  // keep a refresh timer to renew access before it expires
  const refreshTimer = useRef(null);

  function clearRefreshTimer() {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }

  function setTokens({ access, refresh }) {
    if (access) localStorage.setItem("accessToken", access);
    if (refresh) localStorage.setItem("refreshToken", refresh);
    scheduleRefresh(access || localStorage.getItem("accessToken"));
  }

  function clearTokens() {
    clearRefreshTimer();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  async function tryMe() {
    // fetch current user; if 401, try to refresh and retry once
    try {
      const me = await fetchJson("/me/");
      setUser(me);
      return true;
    } catch (e) {
      // attempt refresh if unauthorized
      try {
        await refreshTokens();
        const me = await fetchJson("/me/");
        setUser(me);
        return true;
      } catch {
        setUser(null);
        return false;
      }
    }
  }

  async function refreshTokens() {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) throw new Error("No refresh token");

    // some backends use /auth/refresh/, others /auth/token/refresh/
    // we will try both, first one that works wins
    async function call(path) {
      return fetchJson(path, {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    }

    let data;
    try {
      data = await call("/auth/refresh/");
    } catch {
      data = await call("/auth/token/refresh/");
    }

    // expected shapes: { access } or { access, refresh }
    if (!data?.access && !data?.token && !data?.accessToken) {
      throw new Error("Refresh failed");
    }

    const access = data.access || data.token || data.accessToken;
    const newRefresh = data.refresh || null;
    setTokens({ access, refresh: newRefresh || refresh });
    return access;
  }

  function scheduleRefresh(accessToken) {
    clearRefreshTimer();
    if (!accessToken) return;

    const expMs = getAccessExp(accessToken);
    if (!expMs) return;

    const now = Date.now();
    // refresh 30s before expiry, minimum 5s from now
    const delta = Math.max(expMs - now - 30_000, 5_000);

    refreshTimer.current = setTimeout(async () => {
      try {
        await refreshTokens();
      } catch {
        // refresh failed; force logout
        clearTokens();
        setUser(null);
      }
    }, delta);
  }

  // on mount: if we have a token, load /me
  useEffect(() => {
    (async () => {
      const access = localStorage.getItem("accessToken");
      const refresh = localStorage.getItem("refreshToken");

      if (!access && !refresh) {
        setLoading(false);
        return;
      }

      scheduleRefresh(access);
      await tryMe();
      setLoading(false);
    })();

    return () => clearRefreshTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- public API ---

  export async function login({ username, password }) {
  const data = await fetchJson("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  const access  = data.access || data.token || data.accessToken;
  const refresh = data.refresh;
  if (!access) throw new Error("No access token");

  // Get role from server field OR JWT claim
  const role = mapRole(data.role || parseJwt(access).role);
  localStorage.setItem("role", role);

  // Persist tokens etc. (your existing logic)
  state.tokens = { access, refresh };
  const me = await fetchJson("/me/");
  state.user = { ...me, role: role || mapRole(me?.role) };
  state.loading = false;

  return state.user.role;
}


  async function signup({ username, email, password, role }) {
    await fetchJson("/auth/signup/", {
      method: "POST",
      body: JSON.stringify({ username, email, password, role }),
    });
  }

  async function logout() {
    // optional server-side logout
    try {
             const refresh = localStorage.getItem("refreshToken");
     await fetchJson("/auth/logout/", {
       method: "POST",
       body: JSON.stringify({ refresh }),            // ← send refresh
     });      

    } catch {
      // ignore network/server errors here
    } finally {
      clearTokens();
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      isAuth,
      loading,
      login,
      signup,
      logout,
      refreshTokens,
      setUser, // exposed for rare cases
    }),
    [user, isAuth, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

