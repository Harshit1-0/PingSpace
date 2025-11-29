import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getToken } from "../store/authStore";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../store/authStore";
import { baseUrl } from "../helper/constant";

// Backend token payload: {"sub": "<user_id>", "username": "<username>"}
type TokenPayload = { sub: string };

const JoinPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const serverId = searchParams.get("server");

  const handleJoinServer = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError("You must be logged in to join a server.");
      navigate("/");
      return;
    }

    if (!serverId) {
      setError("Invalid invite link.");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const userId = decoded.sub;

      if (!userId) {
        setError("Invalid authentication token.");
        return;
      }

      setLoading(true);
      setError(null);
      const payload = {
        user_id: userId,
        server_id: serverId,
        role: "member",
      };

      // Join the server (role: "member" for regular invites)
      const option = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      };
      const response = await fetch(`${baseUrl}/server/join`, option);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check if user is already a member
        if (response.status === 400 || response.status === 409) {
          setSuccess(true);
          setTimeout(() => {
            navigate("/chat");
          }, 1500);
          return;
        }

        throw new Error(
          errorData.detail || errorData.message || "Failed to join server"
        );
      }

      const data = await response.json();
      console.log("Joined server:", data);
      setSuccess(true);

      // Redirect to chat after a short delay
      setTimeout(() => {
        navigate("/chat");
      }, 1500);
    } catch (err: any) {
      console.error("Error joining server:", err);
      setError(
        err.message ||
          "An error occurred while joining the server. Please try again."
      );
      setLoading(false);
    }
  }, [serverId, navigate]);

  useEffect(() => {
    // If not authenticated, redirect to login with return URL
    if (!isAuthenticated && !getToken()) {
      navigate(`/?returnUrl=/join?server=${serverId || ""}`);
      return;
    }

    // If no server ID in URL, show error
    if (!serverId) {
      setError("Invalid invite link. No server ID provided.");
      return;
    }

    // Auto-join if authenticated
    if (isAuthenticated && serverId) {
      handleJoinServer();
    }
  }, [isAuthenticated, serverId, navigate, handleJoinServer]);

  if (!serverId) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="brand">PingSpace</h1>
          <div className="error-text">
            Invalid invite link. No server ID provided.
          </div>
          <div className="muted" style={{ marginTop: "16px" }}>
            <a href="/">Go to home</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="brand">PingSpace</h1>

        {success ? (
          <>
            <h2>Success!</h2>
            <p style={{ color: "var(--text)", marginTop: "12px" }}>
              You've successfully joined the server!
            </p>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "14px",
                marginTop: "8px",
              }}
            >
              Redirecting to chat...
            </p>
          </>
        ) : error ? (
          <>
            <h2>Unable to join</h2>
            <div className="error-text" style={{ marginTop: "12px" }}>
              {error}
            </div>
            <div className="muted" style={{ marginTop: "16px" }}>
              <a href="/chat">Go to chat</a> | <a href="/">Go to home</a>
            </div>
          </>
        ) : loading ? (
          <>
            <h2>Joining server...</h2>
            <p style={{ color: "var(--muted)", marginTop: "12px" }}>
              Please wait while we add you to the server.
            </p>
          </>
        ) : (
          <>
            <h2>Join Server</h2>
            <p style={{ color: "var(--muted)", marginTop: "12px" }}>
              Click the button below to join this server.
            </p>
            <button
              onClick={handleJoinServer}
              className="primary-btn"
              style={{ marginTop: "20px" }}
            >
              Join Server
            </button>
            <div className="muted" style={{ marginTop: "16px" }}>
              <a href="/chat">Go to chat</a> | <a href="/">Go to home</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinPage;
