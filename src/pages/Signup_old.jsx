import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchJson } from "../lib/api.js";

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", role: "user" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
  e.preventDefault();

  try {
    await fetchJson("/api/auth/signup/", {
      method: "POST",                     // ← POST, not GET
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        role,           // "customer" | "admin" | "root"
      }),
    });

    // success → maybe redirect to /login
    navigate("/login");
  } catch (err) {
    setError("Registration failed");
  }
}

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center">Create account</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full input input-bordered"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full input input-bordered"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />

        {/* quick role selector (remove later if you want strict backend control) */}
        <select
          className="select select-bordered w-full"
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
        >
          <option value="user">Customer</option>
          <option value="admin">CP Admin</option>
        </select>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" className="btn btn-primary w-full">
          Sign up
        </button>

        <p className="text-center text-sm">
          Already have an account? <Link to="/login" className="link">Log in</Link>
        </p>
      </form>
    </div>
  );
}

