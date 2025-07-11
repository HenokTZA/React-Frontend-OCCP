import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchJson } from "./api";

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const isAuth = !!user;

  // on mount, try to load /me if we already have a token
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchJson("/me/")
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("accessToken");
          setUser(null);
        });
    }
  }, []);

  async function login({ username, password }) {
    const { access, refresh } = await fetchJson("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    const me = await fetchJson("/me/");
    setUser(me);
  }

  async function signup({ username, email, password, role }) {
    // adjust payload to match your backend
    await fetchJson("/auth/signup/", {
      method: "POST",
      body: JSON.stringify({ username, email, password, role }),
    });
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, isAuth, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}

