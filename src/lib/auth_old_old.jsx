/* src/lib/auth.js
   Simple auth context: stores JWT tokens in localStorage, adds Authorization
   on every fetch, handles automatic logout on 401, and exposes user info. */

import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const nav = useNavigate();
  const [access,  setAccess]  = useState(() => localStorage.getItem("access"));
  const [refresh, setRefresh] = useState(() => localStorage.getItem("refresh"));
  const [user,    setUser]    = useState(null);        // /api/me/ payload
  const isAuth = Boolean(access);

  // ------------------------------------------------------------
  // low-level fetch that automatically adds Authorization header
  // ------------------------------------------------------------
  async function api(path, opts = {}) {
    const cfg = {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
    };
    const res = await fetch(`/api${path}`, cfg);
    if (res.status === 401) {
      // access expired → try silent refresh once, else logout
      if (await _tryRefresh()) return api(path, opts);
      logout();
      throw new Error("auth-expired");
    }
    if (!res.ok) throw new Error(await res.text());
    if (res.status === 204) return null;
    return res.json();
  }

  // ------------------
  // signup / login
  // ------------------
  async function signup(data) {
    await api("/auth/signup/", { method: "POST", body: JSON.stringify(data) });
    return login({ username: data.email, password: data.password });
  }

  async function login({ username, password }) {
    const res = await api("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    _storeTokens(res.access, res.refresh);
    await _loadUser();
  }

  // ------------------
  // logout
  // ------------------
  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setAccess(null);
    setRefresh(null);
    setUser(null);
    nav("/login", { replace: true });
  }

  // ------------------
  // helpers
  // ------------------
  function _storeTokens(a, r) {
    setAccess(a);
    setRefresh(r);
    localStorage.setItem("access",  a);
    localStorage.setItem("refresh", r);
  }

  async function _tryRefresh() {
    if (!refresh) return false;
    try {
      const res = await fetch("/api/auth/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      _storeTokens(json.access, refresh);
      return true;
    } catch {
      return false;
    }
  }

  async function _loadUser() {
    if (!access) return;
    try {
      const me = await api("/me/");
      setUser(me);
    } catch {
      logout();
    }
  }

  // pull user on first load / after token refresh
  useEffect(() => { _loadUser(); }, [access]);

  // context value
  const ctx = { api, login, signup, logout, isAuth, user };
  return <AuthCtx.Provider value={ctx}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

