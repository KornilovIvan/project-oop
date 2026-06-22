interface Props { userId: number; username: string; email: string; onBack: () => void; onLogout: () => void; onDashboard?: () => void; onProjects?: () => void }

export function ProfilePage({ username, email, onBack, onLogout, onDashboard, onProjects }: Props) {
  return (
    <div>
      {/* Navigation — full width */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {onDashboard && <button onClick={onDashboard} style={{ padding: "6px 16px", background: "transparent", color: "#1677ff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>Home</button>}
            {onProjects && <button onClick={onProjects} style={{ padding: "6px 16px", background: "transparent", color: "#1677ff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>My Projects</button>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => {}} style={{ padding: "6px 16px", background: "#1677ff", color: "#fff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: "bold" }}>Profile</button>
            <button onClick={onLogout} style={{ padding: "6px 16px", background: "transparent", color: "#999", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>Logout</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        <div style={{ maxWidth: 500, margin: "40px auto", padding: 32, border: "1px solid #eee", borderRadius: 12, background: "#fafafa" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#1677ff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: "bold", margin: "0 auto 24px" }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ textAlign: "center", margin: "0 0 24px" }}>{username}</h2>
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fff", borderRadius: 8, border: "1px solid #eee" }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>USERNAME</div>
            <div style={{ fontSize: 16 }}>{username}</div>
          </div>
          <div style={{ marginBottom: 24, padding: "12px 16px", background: "#fff", borderRadius: 8, border: "1px solid #eee" }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>EMAIL</div>
            <div style={{ fontSize: 16 }}>{email}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onBack} style={{ flex: 1, padding: "10px 0", background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 6, fontSize: 15, cursor: "pointer" }}>← Back</button>
            <button onClick={onLogout} style={{ flex: 1, padding: "10px 0", background: "#ff4d4f", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, cursor: "pointer" }}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
}
