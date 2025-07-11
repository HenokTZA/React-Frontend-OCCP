import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchJson } from "../lib/api.js";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      // POST /auth/login  (adapt to your backend)
      await fetchJson("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      nav("/");          // go to dashboard on success
    } catch (err) {
      setError("Invalid credentials");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>

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

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" className="btn btn-primary w-full">
          Log in
        </button>

        <p className="text-center text-sm">
          No account? <Link to="/signup" className="link">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

