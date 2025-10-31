import { FormEvent, useState } from "react";
import { Link, redirect, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import axios from "axios";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    axios
      .post("http://127.0.0.1:8000/login", {
        username: username,
        password: password,
      })
      .then(function (response) {
        console.log(response.data);
        login(response.data);
        navigate("/chat");
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="brand">Biscord</h1>
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
