import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "../styles.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid username or password");
      setSubmitting(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-art">
        <div className="brand-mark">SR</div>
        <h1>Smart Ramen POS</h1>
        <p>Desktop point-of-sale for your ramen stall — orders, payments, inventory, and sales in one place.</p>
      </section>

      <form className="login-panel" onSubmit={onSubmit}>
        <p className="eyebrow">Sign in</p>
        <h2>Welcome back</h2>

        <label className="field-label">
          Email
          <input
            className="field-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cashier@ramenbox.com"
            required
            autoComplete="email"
          />
        </label>

        <label className="field-label">
          Password
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-action" type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
