// src/lib/auth.js
export function isAuthenticated() {
  //        👇 any check you like (JWT in localStorage, cookie, Redux store…)
  return Boolean(localStorage.getItem("access_token"));
}

