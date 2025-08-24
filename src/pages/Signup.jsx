import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    full_name: "",
    phone: "",
    password: "",
    password2: "",
    role: "user", // <-- default to normal user; backend expects "user" or "super_admin"
  });

  const [error, setError] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // simple client-side checks
    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }
    if ((form.password || "").length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    // prepare payload (trim some fields)
    const payload = {
      ...form,
      username: form.username.trim(),
      email: form.email.trim(),
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
    };

    try {
      await signup(payload); // make sure signup() forwards all fields to /api/auth/signup/
      navigate("/login");
    } catch (e) {
      // show server message if available
      setError(e?.message || "Registration failed");
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
          name="full_name"
          type="text"
          placeholder="Full name"
          className="w-full input input-bordered"
          value={form.full_name}
          onChange={onChange}
          required
        />

        <input
          name="phone"
          type="tel"
          placeholder="Phone number"
          className="w-full input input-bordered"
          value={form.phone}
          onChange={onChange}
        />

        <input
          name="username"
          type="text"
          placeholder="Username"
          className="w-full input input-bordered"
          value={form.username}
          onChange={onChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full input input-bordered"
          value={form.email}
          onChange={onChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full input input-bordered"
          value={form.password}
          onChange={onChange}
          required
          minLength={8}
        />

        <input
          name="password2"
          type="password"
          placeholder="Confirm password"
          className="w-full input input-bordered"
          value={form.password2}
          onChange={onChange}
          required
          minLength={8}
        />

        <select
          name="role"
          className="w-full select select-bordered"
          value={form.role}
          onChange={onChange}
        >
          <option value="user">Normal User</option>
          <option value="super_admin">Super Admin</option>
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

