import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./../lib/auth.jsx";

export default function Signup() {
  const nav = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    email: "", password: "", role: "customer"
  });
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await signup(form);          // back-end accepts {email,password,role}
      nav("/", { replace: true });
    } catch {
      setErr("Registration failed");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form onSubmit={handleSubmit}
            className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-semibold text-center">Create account</h1>

        <input type="email" placeholder="Email" required
               className="w-full input input-bordered"
               value={form.email}
               onChange={e=>setForm({...form,email:e.target.value})} />

        <input type="password" placeholder="Password" required
               className="w-full input input-bordered"
               value={form.password}
               onChange={e=>setForm({...form,password:e.target.value})} />

        <select className="select select-bordered w-full"
                value={form.role}
                onChange={e=>setForm({...form,role:e.target.value})}>
          <option value="customer">Customer</option>
          <option value="admin">CP Admin</option>
          <option value="root">Super Admin</option>
        </select>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <button className="btn btn-primary w-full">Sign up</button>

        <p className="text-center text-sm">
          Already have an account? <Link to="/login" className="link">Log in</Link>
        </p>
      </form>
    </div>
  );
}

