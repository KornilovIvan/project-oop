import { useState } from "react";
import { getApiKey, setApiKey } from "./api";
import { NavBar } from "./NavBar";

interface Props { username: string; email: string; onBack: () => void; onLogout: () => void; onDashboard?: () => void; onProjects?: () => void; onMenuToggle?: () => void }

export function ProfilePage({ username, email, onBack, onLogout, onDashboard, onProjects, onMenuToggle }: Props) {
  const [apiKey, setKey] = useState(getApiKey());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <NavBar username={username} onProfile={() => {}} onLogout={onLogout} onMenuToggle={onMenuToggle} />

      {/* Content */}
      <div style={{ padding: 24 }}>
        <div style={{ maxWidth: 460, margin: "40px auto" }}>
          {/* Avatar + name */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#222", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: "bold", margin: "0 auto 16px" }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{username}</h2>
          </div>

          {/* Info cards */}
          <div style={{ marginBottom: 12, padding: "14px 16px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 4 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Username</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{username}</div>
          </div>
          <div style={{ marginBottom: 20, padding: "14px 16px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 4 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{email}</div>
          </div>

          {/* API Key section */}
          <div style={{ marginBottom: 24, padding: "14px 16px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 4 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>API Key (for AI features)</div>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={e => { setKey(e.target.value); setSaved(false); }}
              style={{ width: "100%", padding: "10px 12px", marginBottom: 8, border: "1px solid #ddd", borderRadius: 4, fontSize: 13, boxSizing: "border-box", outline: "none" }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={handleSave} style={{ padding: "8px 16px", fontSize: 12, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease" }}
                onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; }}
                onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}>
                {saved ? "Saved ✓" : "Save key"}
              </button>
              {apiKey && (
                <span style={{ fontSize: 12, color: "#999" }}>Stored locally</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onBack} style={{ flex: 1, padding: "10px", fontSize: 13, border: "1px solid #ddd", borderRadius: 4, background: "transparent", color: "#555", cursor: "pointer", fontWeight: 500, position: "relative", top: 0, boxShadow: "0 2px 0 #d0d0d0", transition: "all 0.06s ease" }}
              onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #d0d0d0"; }}
              onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #d0d0d0"; }}>
              ← Back
            </button>
            <button onClick={onLogout} style={{ flex: 1, padding: "10px", fontSize: 13, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease" }}
              onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; }}
              onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
