import { useState, useRef, useEffect } from "react";
import { NotificationBell } from "./NotificationBell";

interface Props {
  page: "dashboard" | "projects" | "tasks" | "profile";
  username?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onDashboard?: () => void;
  onProjects?: () => void;
  onSelectProject?: (projectId: number) => void;
  onProfile?: () => void;
  onLogout?: () => void;
  style?: React.CSSProperties;
}

const tabs = [
  { key: "dashboard", label: "Home" },
  { key: "projects", label: "My Projects" },
] as const;

export function NavBar({ page, username, searchQuery, onSearchChange, onDashboard, onProjects, onSelectProject, onProfile, onLogout, style }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const nav = (key: string) => {
    if (key === "dashboard" && onDashboard) onDashboard();
    else if (key === "projects" && onProjects) onProjects();
  };

  return (
    <div style={{ padding: "0 24px", borderBottom: "1px solid #eee", background: "#fff", position: "sticky", top: 0, zIndex: 50, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 56 }}>
        {/* Left: nav tabs */}
        <div style={{ display: "flex", gap: 0, height: "100%" }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={page === tab.key ? undefined : () => nav(tab.key)}
              style={{
                background: "none",
                border: "none",
                borderBottom: page === tab.key ? "2px solid #222" : "2px solid transparent",
                padding: "0 16px",
                fontSize: 14,
                fontWeight: page === tab.key ? 600 : 400,
                color: page === tab.key ? "#222" : "#888",
                cursor: page === tab.key ? "default" : "pointer",
                transition: "border-color 0.15s ease, color 0.15s ease",
                height: "100%",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
                position: "absolute", right: 0, top: "100%", marginTop: 6,
                background: "#fff", border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                minWidth: 160, zIndex: 2000, padding: 4,
              }}>
                <div style={{ padding: "8px 12px", fontSize: 13, color: "#555", borderBottom: "1px solid #eee", marginBottom: 4 }}>
                  {username || "User"}
                </div>
                <button onClick={() => { setMenuOpen(false); onProfile?.(); }} style={{ width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, textAlign: "left", cursor: "pointer", borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  Profile
                </button>
                <button onClick={() => { setMenuOpen(false); onLogout?.(); }} style={{ width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, textAlign: "left", cursor: "pointer", borderRadius: 4, color: "#c00" }} onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
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
