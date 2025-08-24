// src/lib/auth.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchJson } from "@/lib/api";

const AuthCtx = createContext(null);

// Normalize legacy roles -> your two roles
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

// --- helpers ---
function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json); // keep simple; returns {}
  } catch {
    return {};
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

  async function refreshTokens() {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) throw new Error("No refresh token");

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

    if (!data?.access && !data?.token && !data?.accessToken) {
      throw new Error("Refresh failed");
    }

    const access = data.access || data.token || data.accessToken;
    const newRefresh = data.refresh || null;
    setTokens({ access, refresh: newRefresh || refresh });
    return access;
  }

  async function tryMe() {
    try {
      const me = await fetchJson("/me/");
      // prefer stored role or server role
      const storedRole = localStorage.getItem("role");
      setUser({ ...me, role: mapRole(storedRole || me?.role) });
      return true;
    } catch {
      try {
        await refreshTokens();
        const me = await fetchJson("/me/");
        const storedRole = localStorage.getItem("role");
        setUser({ ...me, role: mapRole(storedRole || me?.role) });
        return true;
      } catch {
        setUser(null);
        return false;
      }
    }
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

  // --- public API (NO exports here; these are provided via context) ---

  async function login({ username, password }) {
    const data = await fetchJson("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const access  = data.access || data.token || data.accessToken;
    const refresh = data.refresh;
    if (!access) throw new Error("No access token");

    // Get role from server field OR JWT claim
    const role = mapRole(data.role || parseJwt(access)?.role);
    localStorage.setItem("role", role);

    setTokens({ access, refresh });

    const me = await fetchJson("/me/");
    setUser({ ...me, role: role || mapRole(me?.role) });

    return role; // callers can redirect based on role
  }

  // Auth.jsx (only the signup function)
async function signup({
  username,
  email,
  full_name,
  phone,
  password,
  password2,
  role = "user",
}) {
  const payload = {
    username: (username || "").trim(),
    email: (email || "").trim(),
    full_name: (full_name || "").trim(),
    phone: (phone || "").trim(),
    password,
    password2,
    role, // "user" or "super_admin"
  };

  try {
    // If your fetchJson auto-prefixes /api, keep "/auth/signup/" as-is
    return await fetchJson("/auth/signup/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // Normalize server-side field errors into a friendly message
    let msg = e?.message || "Signup failed";
    if (e?.data && typeof e.data === "object") {
      // e.g. { password2: ["Passwords do not match."] }
      const firstKey = Object.keys(e.data)[0];
      if (firstKey) {
        const val = e.data[firstKey];
        if (Array.isArray(val) && val[0]) msg = val[0];
        else if (typeof val === "string") msg = val;
      }
    }
    throw new Error(msg);
  }
}


  async function logout() {
    try {
      const refresh = localStorage.getItem("refreshToken");
      await fetchJson("/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // ignore server errors on logout
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

