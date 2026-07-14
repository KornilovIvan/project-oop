import { useEffect, useState } from "react";
import { projectApi, userApi } from "./api";
import type { ProjectRes, UserRes } from "./api";
import { NavBar } from "./NavBar";

interface Props { userId: number; username?: string; onSelectProject: (projectId: number) => void; onLogout: () => void; onProfile: () => void; onDashboard: () => void }

export function ProjectsPage({ userId, username, onSelectProject, onLogout, onProfile, onDashboard }: Props) {
  const [projects, setProjects] = useState<ProjectRes[]>([]);
  const [users, setUsers] = useState<UserRes[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const loadedProjects = await projectApi.list();
    setProjects(loadedProjects);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    userApi.list().then(setUsers).catch(e => setError(e instanceof Error ? e.message : "Failed to load users"));
  }, []);

  const create = async () => {
    if (!name) return;
    const p = await projectApi.create({ name, description, createdById: userId });
    setName(""); setDescription(""); setShowModal(false); load();
    setSelectedId(p.id);
  };

  const selectedProject = projects.find(p => p.id === selectedId) || null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <NavBar username={username} onSelectProject={onSelectProject} onProfile={onProfile} onLogout={onLogout} onMenuToggle={onDashboard} />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left sidebar */}
        <div style={{ width: 240, borderRight: "1px solid #eee", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px 12px 8px" }}>
            <button onClick={() => setShowModal(true)} className="keycap-btn keycap-btn-solid" style={{ width: "100%", fontSize: 13, padding: "8px 0" }}>+ New Project</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
            {projects.map(p => {
              const memberUsers = users.filter(u => p.memberIds.includes(u.id));
              const displayMembers = memberUsers.slice(0, 2);
              const overflow = memberUsers.length - 2;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: selectedId === p.id ? "#f0f0f0" : "transparent",
                    marginBottom: 2,
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={e => { if (selectedId !== p.id) e.currentTarget.style.background = "#f5f5f5"; }}
                  onMouseLeave={e => { if (selectedId !== p.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 4 }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 12, color: "#888", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {displayMembers.map((u, i) => (
                      <div key={u.id} style={{ width: 20, height: 20, borderRadius: "50%", background: i === 0 ? "#222" : "#555", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: "bold", marginLeft: i > 0 ? -6 : 0, border: "1px solid #fff" }}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {overflow > 0 && <span style={{ fontSize: 10, color: "#999", marginLeft: 2 }}>+{overflow}</span>}
                    {memberUsers.length === 0 && <span style={{ fontSize: 11, color: "#bbb" }}>No members</span>}
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && <p style={{ color: "#999", fontSize: 13, textAlign: "center", marginTop: 24 }}>No projects yet.</p>}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          {error && <p style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{error}</p>}

          {!selectedProject && projects.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 80, color: "#999" }}>
              <p style={{ fontSize: 15 }}>Select a project from the sidebar</p>
            </div>
          )}

          {!selectedProject && projects.length === 0 && (
            <div style={{ textAlign: "center", marginTop: 80, color: "#999" }}>
              <p style={{ fontSize: 15, marginBottom: 16 }}>No projects yet</p>
              <button onClick={() => setShowModal(true)} className="keycap-btn keycap-btn-solid" style={{ fontSize: 14, padding: "10px 24px" }}>+ Create your first project</button>
            </div>
          )}

          {selectedProject && (
            <div style={{ maxWidth: 600 }}>
              <h2 style={{ margin: "0 0 4px" }}>{selectedProject.name}</h2>
              <p style={{ color: "#666", fontSize: 14, margin: "0 0 24px", lineHeight: 1.5 }}>{selectedProject.description || "No description"}</p>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#666" }}>Members ({selectedProject.memberIds.length})</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {users.filter(u => selectedProject.memberIds.includes(u.id)).map(user => (
                    <div key={user.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#222", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold" }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{user.username}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{user.email}</div>
                      </div>
                      <span style={{ marginLeft: "auto", fontSize: 12, color: "#777" }}>
                        {selectedProject.adminIds.includes(user.id) ? "Admin" : "Member"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => onSelectProject(selectedProject.id)} className="keycap-btn keycap-btn-solid" style={{ fontSize: 14, padding: "10px 24px" }}>
                Open project →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Project modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 32, maxWidth: 450, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 16px" }}>New Project</h3>
            <input placeholder="Project name" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }} />
            <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} className="keycap-btn keycap-btn-ghost">Cancel</button>
              <button onClick={create} className="keycap-btn keycap-btn-solid">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
