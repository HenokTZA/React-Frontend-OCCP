import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/password/reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ " + data.detail);
      } else {
        setMessage("❌ " + (data.detail || "Something went wrong"));
      }
    } catch (err) {
      setMessage("❌ Network error");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>

      {message && <div className="mb-4">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Your email"
          className="w-full input input-bordered"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <button
          type="submit"
          className="w-full btn btn-primary"
        >
          Send reset link
        </button>
      </form>

      <p className="mt-4 text-sm">
        Remembered?{" "}
        <Link to="/login" className="link link-primary">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;

