import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { baseUrl } from "../helper/constant";
import { options } from "../helper/fetchOptions";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const option = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",

      body: new URLSearchParams({
        username,
        password,
      }).toString(),
    };
    try {
      const response = await fetch(`${baseUrl}/login`, option);

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.message || "Login failed");
        return;
      }

      const data = await response.json();
      login(data.access_token);

      // Redirect to returnUrl if provided, otherwise go to chat
      const returnUrl = searchParams.get("returnUrl");
      navigate(returnUrl || "/chat");
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="brand">PingSpace</h1>
        <h2>Login</h2>
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            Username
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
            Sign in
          </button>
        </form>
        <div className="muted">
          No account? <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
