// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchJson } from "../lib/api";

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "customer",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await fetchJson("/auth/signup/", {
        method: "POST",
        body: JSON.stringify(form),   // 👈  email, password, role
      });
      nav("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form onSubmit={handleSubmit}
            className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4">

        <h1 className="text-2xl font-semibold text-center">Create account</h1>

        <input type="email"     value={form.email}
               onChange={e => setForm({ ...form, email: e.target.value })}
               placeholder="Email"     className="w-full input input-bordered"  required />

        <input type="password"  value={form.password}
               onChange={e => setForm({ ...form, password: e.target.value })}
               placeholder="Password"  className="w-full input input-bordered" required />

        <select value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="select select-bordered w-full">
          <option value="customer">Customer</option>
          <option value="admin">CP Admin</option>
          <option value="root">Super Admin</option> {/* 👈  maps to “root” */}
        </select>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button className="btn btn-primary w-full">Sign up</button>

        <p className="text-center text-sm">
          Already have an account? <Link to="/login" className="link">Log in</Link>
        </p>
      </form>
    </div>
  );
}

