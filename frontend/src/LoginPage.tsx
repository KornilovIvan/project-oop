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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #f5f5f5 0%, #ffffff 100%)" }}>
      <div style={{ maxWidth: 380, width: "100%", margin: "0 16px", padding: 32, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <h2 style={{ textAlign: "center", marginBottom: 24, fontSize: 18, fontWeight: 600 }}>Task Management</h2>
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
            <button onClick={handleLogin} style={{ width: "100%", padding: 10, fontSize: 15, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 3px 0 #000", transition: "all 0.06s ease", marginTop: 16 }}
              onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}
              onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 3px 0 #000"; }}>Login</button>
          </>
        ) : (
          <>
            <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={s} />
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={s} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={s} />
            {error && <p style={{ color: "red", fontSize: 14 }}>{error}</p>}
            <button onClick={handleRegister} style={{ width: "100%", padding: 10, fontSize: 15, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 3px 0 #000", transition: "all 0.06s ease", marginTop: 16 }}
              onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}
              onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 3px 0 #000"; }}>Register</button>
          </>
        )}
      </div>
    </div>
  );
}

const s: React.CSSProperties = { width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", borderRadius: 4, fontSize: 14, boxSizing: "border-box", outline: "none" };
