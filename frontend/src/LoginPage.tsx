import { useState } from "react";
import { authApi, setAccessToken } from "./api";

interface Props {
  onLogin: (userId: number, username: string) => void;
}

export function LoginPage({ onLogin }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setError("");
      const { token, user } = await authApi.login({ email, password });
      setAccessToken(token);
      onLogin(user.id, user.username);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  const handleRegister = async () => {
    try {
      setError("");
      await authApi.register({ username, email, password, role: 3 });
      const { token, user } = await authApi.login({ email, password });
      setAccessToken(token);
      onLogin(user.id, user.username);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 32, border: "1px solid #ddd", borderRadius: 8 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Task Management</h2>
      <div style={{ display: "flex", marginBottom: 24 }}>
        <button onClick={() => setTab("login")} style={{ flex: 1, padding: 10, background: tab === "login" ? "#1677ff" : "#f5f5f5", color: tab === "login" ? "#fff" : "#333", border: "none", fontSize: 16, cursor: "pointer" }}>Login</button>
        <button onClick={() => setTab("register")} style={{ flex: 1, padding: 10, background: tab === "register" ? "#1677ff" : "#f5f5f5", color: tab === "register" ? "#fff" : "#333", border: "none", fontSize: 16, cursor: "pointer" }}>Register</button>
      </div>
      {tab === "register" && <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={s} />}
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={s} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={s} />
      {error && <p style={{ color: "red", fontSize: 14 }}>{error}</p>}
      <button onClick={tab === "login" ? handleLogin : handleRegister} style={{ width: "100%", padding: 10, marginTop: 16, background: "#1677ff", color: "#fff", border: "none", borderRadius: 6, fontSize: 16, cursor: "pointer" }}>
        {tab === "login" ? "Login" : "Register"}
      </button>
    </div>
  );
}

const s: React.CSSProperties = { width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", borderRadius: 6, fontSize: 15, boxSizing: "border-box" };
