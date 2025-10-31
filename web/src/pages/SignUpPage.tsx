import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to create account");
        return;
      }

      console.log("Signup success:", data);

      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="brand">Biscord</h1>
        <h2>Create account</h2>
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            Name
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>

          {error && <div className="error-text">{error}</div>}

          <button type="submit" className="primary-btn">
            Sign up
          </button>
        </form>

        <div className="muted">
          Have an account? <Link to="/">Login</Link>
        </div>
      </div>
    </div>
  );
}
