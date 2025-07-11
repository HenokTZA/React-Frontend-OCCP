import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./../lib/auth.jsx";

export default function Login() {
  const nav  = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err,  setErr ] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login({ username: form.email, password: form.password });
      nav("/", { replace: true });
    } catch (e) {
      setErr("Invalid credentials");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form onSubmit={handleSubmit}
            className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>

        <input type="email" placeholder="Email" required
               className="w-full input input-bordered"
               value={form.email}
               onChange={e=>setForm({...form,email:e.target.value})} />

        <input type="password" placeholder="Password" required
               className="w-full input input-bordered"
               value={form.password}
               onChange={e=>setForm({...form,password:e.target.value})} />

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <button type="submit" className="btn btn-primary w-full">Log in</button>

        <p className="text-center text-sm">
          No account? <Link to="/signup" className="link">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

