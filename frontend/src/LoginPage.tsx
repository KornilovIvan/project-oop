import { useState } from "react";
import { authApi, setAccessToken } from "./api";

interface Props { onLogin: (userId: number, username: string) => void }

export function LoginPage({ onLogin }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setError("");
      const { token, user } = await authApi.login({ email: login, password });
      setAccessToken(token);
      onLogin(user.id, user.username);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Login failed"); }
  };

  const handleRegister = async () => {
    try {
      setError("");
      if (!username.trim() || !email.trim() || !password.trim()) { setError("All fields are required"); return; }
      if (!email.includes("@")) { setError("Email must contain @"); return; }
      if (username.includes("@")) { setError("Username cannot contain @"); return; }
      await authApi.register({ username, email, password });
      const { token, user } = await authApi.login({ email, password });
      setAccessToken(token);
      onLogin(user.id, user.username);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Registration failed"); }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 32, border: "1px solid #ddd" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Task Management</h2>
      <div className="tab-bar">
        <button onClick={() => setTab("login")} className={`tab-btn ${tab === "login" ? "active" : ""}`}>Login</button>
        <button onClick={() => setTab("register")} className={`tab-btn ${tab === "register" ? "active" : ""}`}>Register</button>
        <div className={`tab-underline ${tab === "register" ? "right" : ""}`} />
      </div>

      {tab === "login" ? (
        <>
          <input placeholder="Email or username" value={login} onChange={e => setLogin(e.target.value)} style={s} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={s} />
          {error && <p style={{ color: "red", fontSize: 14 }}>{error}</p>}
          <button onClick={handleLogin} className="keycap-btn keycap-btn-solid" style={{ width: "100%", padding: 10, marginTop: 16, fontSize: 16 }}>Login</button>
        </>
      ) : (
        <>
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={s} />
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={s} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={s} />
          {error && <p style={{ color: "red", fontSize: 14 }}>{error}</p>}
          <button onClick={handleRegister} className="keycap-btn keycap-btn-solid" style={{ width: "100%", padding: 10, marginTop: 16, fontSize: 16 }}>Register</button>
        </>
      )}
    </div>
  );
}

const s: React.CSSProperties = { width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" };
