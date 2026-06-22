import { useEffect, useState } from "react";
import { projectApi } from "./api";
import type { ProjectRes } from "./api";

interface Props { userId: number; onSelectProject: (projectId: number) => void; onLogout: () => void; onProfile: () => void; onDashboard: () => void }

export function ProjectsPage({ userId, onSelectProject, onLogout, onProfile, onDashboard }: Props) {
  const [projects, setProjects] = useState<ProjectRes[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = () => projectApi.list().then(setProjects);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name) return;
    await projectApi.create({ name, description, createdById: userId });
    setName(""); setDescription(""); setShowModal(false); load();
  };

  return (
    <div>
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 32, maxWidth: 450, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 16px" }}>New Project</h3>
            <input placeholder="Project name" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", borderRadius: 6, fontSize: 15, boxSizing: "border-box" }} />
            <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid #ddd", borderRadius: 6, fontSize: 15, boxSizing: "border-box", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 6, fontSize: 15, cursor: "pointer" }}>Cancel</button>
              <button onClick={create} style={{ padding: "8px 20px", background: "#1677ff", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, cursor: "pointer" }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation — full width */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onDashboard} style={{ padding: "6px 16px", background: "transparent", color: "#1677ff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>Home</button>
            <button onClick={() => {}} style={{ padding: "6px 16px", background: "#1677ff", color: "#fff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: "bold" }}>My Projects</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onProfile} style={{ padding: "6px 16px", background: "transparent", color: "#1677ff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>Profile</button>
            <button onClick={onLogout} style={{ padding: "6px 16px", background: "transparent", color: "#999", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>Logout</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 24px 24px" }}>
        <button onClick={() => setShowModal(true)} style={{ marginBottom: 16, padding: "8px 20px", background: "#1677ff", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, cursor: "pointer" }}>+ New Project</button>

        {projects.map(p => (
          <div key={p.id} onClick={() => onSelectProject(p.id)} style={{ padding: 16, marginBottom: 8, border: "1px solid #eee", borderRadius: 8, cursor: "pointer", background: "#fafafa" }}>
            <strong>{p.name}</strong>
            {p.description && <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>{p.description}</p>}
          </div>
        ))}
        {projects.length === 0 && <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>No projects yet.</p>}
      </div>
    </div>
  );
}
