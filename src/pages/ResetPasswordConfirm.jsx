import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

const ResetPasswordConfirm = () => {
  const { uid, token }       = useParams();
  const [newPassword, setPw] = useState("");
  const [message, setMessage]= useState(null);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/password/reset/confirm/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ " + data.detail);
        // Optional: redirect back to login after a delay
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage("❌ " + (data.detail || "Failed to reset"));
      }
    } catch {
      setMessage("❌ Network error");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Reset Your Password</h2>

      {message && <div className="mb-4">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          required
          placeholder="New password"
          className="w-full input input-bordered"
          value={newPassword}
          onChange={e => setPw(e.target.value)}
        />

        <button type="submit" className="w-full btn btn-primary">
          Reset Password
        </button>
      </form>

      <p className="mt-4 text-sm">
        <Link to="/login" className="link link-primary">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordConfirm;

