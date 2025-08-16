import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const role = await login(form);
      if (role === "super_admin") navigate("/");
      else                        navigate("/app");
    } catch (e) {
      //setError(err.message || "Login failed");
     setError(e?.message || "Invalid username or password");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>
        <input
          type="text"
          placeholder="Username"
          className="w-full input input-bordered"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
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
        <p className="mt-2 text-sm text-center">
          <Link to="/forgot-password" className="link link-secondary">
            Forgot password?
          </Link>
        </p>
      </form>
    </div>
  );
}

