import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "root" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await signup(form);
      navigate("/login");
    } catch {
      setError("Registration failed");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-semibold text-center">Create account</h1>
        <input
          type="text"
          placeholder="Username"
          className="w-full input input-bordered"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          required
        />
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
        <select
          className="w-full select select-bordered"
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
        >
          <option value="root">Super Admin</option>
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

