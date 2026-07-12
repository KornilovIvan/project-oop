import { NotificationBell } from "./NotificationBell";

interface Props {
  page: "dashboard" | "projects" | "tasks" | "profile";
  onDashboard?: () => void;
  onProjects?: () => void;
  onSelectProject?: (projectId: number) => void;
  onProfile?: () => void;
  onLogout?: () => void;
  style?: React.CSSProperties;
}

export function NavBar({ page, onDashboard, onProjects, onSelectProject, onProfile, onLogout, style }: Props) {
  return (
    <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee", ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onDashboard} className={`keycap-btn ${(!onDashboard || page === "dashboard") ? "keycap-btn-solid" : "keycap-btn-outline"}`} style={{ cursor: (!onDashboard || page === "dashboard") ? "default" : "pointer" }}>
            Home
          </button>
          <button onClick={onProjects} className={`keycap-btn ${(!onProjects || page === "projects") ? "keycap-btn-solid" : "keycap-btn-outline"}`} style={{ cursor: (!onProjects || page === "projects") ? "default" : "pointer" }}>
            My Projects
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onSelectProject && <NotificationBell onAccept={onSelectProject} />}
          <button onClick={onProfile} className={`keycap-btn ${(!onProfile || page === "profile") ? "keycap-btn-solid" : "keycap-btn-outline"}`} style={{ cursor: (!onProfile || page === "profile") ? "default" : "pointer" }}>
            Profile
          </button>
          <button onClick={onLogout} className="keycap-btn keycap-btn-ghost">Logout</button>
        </div>
      </div>
    </div>
  );
}
