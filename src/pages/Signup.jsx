import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "user" });
  const [error, setError] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await signup(form);        // includes role
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Registration failed");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-semibold text-center mb-4">Create account</h1>

        <input
          name="username"
          type="text"
          placeholder="Username"
          className="w-full input input-bordered mb-3"
          value={form.username}
          onChange={onChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full input input-bordered mb-3"
          value={form.email}
          onChange={onChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full input input-bordered mb-3"
          value={form.password}
          onChange={onChange}
          required
        />

        <select
  name="role"
  className="w-full select select-bordered mb-4"
  value={form.role}
  onChange={onChange}
>
  <option value="user">Normal User</option>
  <option value="super_admin">Super Admin</option>
  
</select>


        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button type="submit" className="btn btn-primary w-full">Sign up</button>

        <p className="text-center text-sm mt-3">
          Already have an account? <Link to="/login" className="link">Log in</Link>
        </p>
      </form>
    </div>
  );
}

