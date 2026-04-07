import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../app/api";
import { useAuth } from "../app/auth";

export function LoginPage() {
  const [username, setUsername] = useState("anna.support");
  const [password, setPassword] = useState("secret");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api.login(username, password);
      setSession({ token: result.token, user: result.user });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Northstar Care Portal</h1>
        <p>Secure operations workspace</p>
        <form onSubmit={onSubmit}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
      </div>
    </div>
  );
}
