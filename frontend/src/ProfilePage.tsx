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
        <div style={{ maxWidth: 500, margin: "40px auto", padding: 32, border: "1px solid #e0e0e0", background: "#fafafa", boxShadow: "0 2px 0 #d0d0d0, 0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#222", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: "bold", margin: "0 auto 24px" }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ textAlign: "center", margin: "0 0 24px" }}>{username}</h2>
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fff", border: "1px solid #e0e0e0" }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>USERNAME</div>
            <div style={{ fontSize: 16 }}>{username}</div>
          </div>
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fff", border: "1px solid #e0e0e0" }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>EMAIL</div>
            <div style={{ fontSize: 16 }}>{email}</div>
          </div>

          {/* API Key section */}
          <div style={{ marginBottom: 24, padding: "12px 16px", background: "#fff", border: "1px solid #e0e0e0" }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>API KEY (for AI features)</div>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={e => { setKey(e.target.value); setSaved(false); }}
              style={{ width: "100%", padding: "10px 12px", marginBottom: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={handleSave} className="keycap-btn keycap-btn-solid" style={{ padding: "6px 16px", fontSize: 13 }}>
                {saved ? "Saved ✓" : "Save key"}
              </button>
              {apiKey && (
                <span style={{ fontSize: 12, color: "#999" }}>
                  Key is stored in your browser only
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onBack} className="keycap-btn keycap-btn-ghost" style={{ flex: 1 }}>← Back</button>
            <button onClick={onLogout} className="keycap-btn keycap-btn-solid" style={{ flex: 1, padding: "10px 0", fontSize: 15 }}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
}
