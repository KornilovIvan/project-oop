import { useState, useRef, useEffect } from "react";
import { getApiKey, setApiKey } from "./api";
import { NotificationBell } from "./NotificationBell";

interface Props {
  username?: string;
  email?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectProject?: (projectId: number) => void;
  onLogout?: () => void;
  onMenuToggle?: () => void;
  style?: React.CSSProperties;
}

export function NavBar({ username, email, searchQuery, onSearchChange, onSelectProject, onLogout, onMenuToggle, style }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiKey, setKey] = useState(getApiKey());
  const [saved, setSaved] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSaveKey = () => {
    setApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div style={{ padding: "0 24px", borderBottom: "1px solid #eee", background: "#fff", position: "sticky", top: 0, zIndex: 50, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 56 }}>
        {/* Left: hamburger menu */}
        <button onClick={onMenuToggle} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#555", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, transition: "background 0.1s ease" }}
          onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="3" y1="5" x2="17" y2="5" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="15" x2="17" y2="15" />
          </svg>
        </button>

        {/* Center: search */}
        {onSearchChange && (
          <div style={{ flex: 1, maxWidth: 360, margin: "0 24px" }}>
            <input
              placeholder="Search tasks..."
              value={searchQuery || ""}
              onChange={e => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                background: "#f5f5f5",
                transition: "border-color 0.15s ease, background 0.15s ease",
              }}
              onFocus={e => { e.target.style.borderColor = "#222"; e.target.style.background = "#fff"; }}
              onBlur={e => { e.target.style.borderColor = "#ddd"; e.target.style.background = "#f5f5f5"; }}
            />
          </div>
        )}

        {/* Right: bell + avatar */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginLeft: "auto" }}>
          {onSelectProject && <NotificationBell onAccept={onSelectProject} />}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 34, height: 34, borderRadius: "50%", background: "#222", color: "#fff",
                border: "none", fontSize: 14, fontWeight: "bold", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {(username || "?").charAt(0).toUpperCase()}
            </button>
            {menuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "100%", marginTop: 8,
                background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6,
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 300, zIndex: 2000, padding: 16,
              }}>
                {/* Avatar + name */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#222", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: "bold", margin: "0 auto 8px" }}>
                    {(username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{username || "User"}</div>
                  {email && <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{email}</div>}
                </div>

                {/* Info cards */}
                <div style={{ marginBottom: 8, padding: "10px 12px", background: "#fafafa", border: "1px solid #eee", borderRadius: 4 }}>
                  <div style={{ fontSize: 10, color: "#999", marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Username</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{username || "—"}</div>
                </div>
                <div style={{ marginBottom: 12, padding: "10px 12px", background: "#fafafa", border: "1px solid #eee", borderRadius: 4 }}>
                  <div style={{ fontSize: 10, color: "#999", marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{email || "—"}</div>
                </div>

                {/* API Key */}
                <div style={{ padding: "10px 12px", background: "#fafafa", border: "1px solid #eee", borderRadius: 4, marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "#999", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>API Key (for AI)</div>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={e => { setKey(e.target.value); setSaved(false); }}
                    style={{ width: "100%", padding: "7px 10px", border: "1px solid #ddd", borderRadius: 4, fontSize: 12, boxSizing: "border-box", outline: "none", marginBottom: 6 }}
                  />
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={handleSaveKey} style={{ padding: "7px 16px", fontSize: 11, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease" }}
                      onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; }}
                      onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}>
                      {saved ? "Saved ✓" : "Save key"}
                    </button>
                    {apiKey && <span style={{ fontSize: 11, color: "#bbb" }}>Stored locally</span>}
                  </div>
                </div>

                {/* Logout */}
                <button onClick={() => { setMenuOpen(false); onLogout?.(); }} style={{ width: "100%", padding: "10px", fontSize: 13, border: "1px solid #ddd", borderRadius: 4, background: "transparent", color: "#c00", cursor: "pointer", fontWeight: 500, position: "relative", top: 0, boxShadow: "0 2px 0 #e0e0e0", transition: "all 0.06s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #e0e0e0"; }}
                  onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #e0e0e0"; }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
