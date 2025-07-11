// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({
    email:    "",
    password: "",
    role:     "customer",  // match your Django choices
  });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // 👉 pull the values out
    const { email, password, role } = form;

    try {
      const res = await fetch("/api/auth/signup/", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          username: email,   // or your serializer’s expected field
          email,
          password,
          role,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      // success → send them to login
      navigate("/login");
    } catch (err) {
      console.error(err);
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
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full input input-bordered"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <select
          className="select select-bordered w-full"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="customer">Customer</option>
          <option value="admin">CP Admin</option>
          <option value="root">Super Admin</option>
        </select>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" className="btn btn-primary w-full">
          Sign up
        </button>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="link">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

