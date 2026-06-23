import { useEffect, useState } from "react";
import { projectApi, userApi } from "./api";
import type { ProjectRes, UserRes } from "./api";

interface Props { userId: number; userRole: string; onSelectProject: (projectId: number) => void; onLogout: () => void; onProfile: () => void; onDashboard: () => void }

const canManageProjects = (role: string) => role === "Admin" || role === "Manager";
const roleLabels: Record<number, string> = { 1: "Admin", 2: "Manager", 3: "Executor", 4: "Observer" };

function MembersModal({
  project,
  users,
  onClose,
  onAdd,
  onRemove,
}: {
  project: ProjectRes;
  users: UserRes[];
  onClose: () => void;
  onAdd: (userId: number) => Promise<void>;
  onRemove: (userId: number) => Promise<void>;
}) {
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const members = users.filter(user => project.memberIds.includes(user.id));
  const available = users.filter(user => !project.memberIds.includes(user.id));

  const run = async (userId: number, action: (userId: number) => Promise<void>) => {
    setBusyUserId(userId);
    try { await action(userId); }
    finally { setBusyUserId(null); }
  };

  return (
    <div onClick={onClose} className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} className="modal-content" style={{ background: "#fff", padding: 32, maxWidth: 620, width: "92%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Project members</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>x</button>
        </div>
        <p style={{ margin: "0 0 16px", color: "#666", fontSize: 14 }}>{project.name}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#666" }}>Members</h4>
            {members.map(user => (
              <div key={user.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{roleLabels[user.role] || "User"} · {user.email}</div>
                </div>
                <button disabled={busyUserId === user.id} onClick={() => run(user.id, onRemove)} className="keycap-btn keycap-btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Remove</button>
              </div>
            ))}
            {members.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>No members yet.</p>}
          </div>

          <div>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#666" }}>Available users</h4>
            {available.map(user => (
              <div key={user.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{roleLabels[user.role] || "User"} · {user.email}</div>
                </div>
                <button disabled={busyUserId === user.id} onClick={() => run(user.id, onAdd)} className="keycap-btn keycap-btn-outline" style={{ padding: "4px 10px", fontSize: 12 }}>Add</button>
              </div>
            ))}
            {available.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Everyone is already added.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectsPage({ userId, userRole, onSelectProject, onLogout, onProfile, onDashboard }: Props) {
  const [projects, setProjects] = useState<ProjectRes[]>([]);
  const [users, setUsers] = useState<UserRes[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [membersProject, setMembersProject] = useState<ProjectRes | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const canManage = canManageProjects(userRole);

  const load = async () => {
    const loadedProjects = await projectApi.list();
    setProjects(loadedProjects);
    if (membersProject) {
      setMembersProject(loadedProjects.find(project => project.id === membersProject.id) || null);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!canManage) return;
    userApi.list().then(setUsers).catch(e => setError(e instanceof Error ? e.message : "Failed to load users"));
  }, [canManage]);

  const create = async () => {
    if (!name) return;
    await projectApi.create({ name, description, createdById: userId });
    setName(""); setDescription(""); setShowModal(false); load();
  };

  const addMember = async (projectId: number, memberId: number) => {
    const updated = await projectApi.addMember(projectId, memberId);
    setProjects(prev => prev.map(project => project.id === updated.id ? updated : project));
    setMembersProject(updated);
  };

  const removeMember = async (projectId: number, memberId: number) => {
    await projectApi.removeMember(projectId, memberId);
    const updated = await projectApi.get(projectId);
    setProjects(prev => prev.map(project => project.id === updated.id ? updated : project));
    setMembersProject(updated);
  };

  return (
    <div>
      {membersProject && (
        <MembersModal
          project={membersProject}
          users={users}
          onClose={() => setMembersProject(null)}
          onAdd={memberId => addMember(membersProject.id, memberId)}
          onRemove={memberId => removeMember(membersProject.id, memberId)}
        />
      )}
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

      {/* Navigation — full width */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onDashboard} className="keycap-btn keycap-btn-outline">Home</button>
            <button onClick={() => {}} className="keycap-btn keycap-btn-solid">My Projects</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onProfile} className="keycap-btn keycap-btn-outline">Profile</button>
            <button onClick={onLogout} className="keycap-btn keycap-btn-ghost">Logout</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 24px 24px" }}>
        {canManage && <button onClick={() => setShowModal(true)} className="keycap-btn keycap-btn-solid" style={{ marginBottom: 16 }}>+ New Project</button>}
        {error && <p style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{error}</p>}

        {projects.map(p => (
          <div key={p.id} onClick={() => onSelectProject(p.id)} className="keycap-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
              <div>
                <strong>{p.name}</strong>
                <div style={{ marginTop: 4, color: "#999", fontSize: 12 }}>{p.memberIds.length} member{p.memberIds.length === 1 ? "" : "s"}</div>
              </div>
              {canManage && (
                <button
                  onClick={e => { e.stopPropagation(); setMembersProject(p); }}
                  className="keycap-btn keycap-btn-outline"
                  style={{ padding: "4px 10px", fontSize: 12 }}
                >
                  Members
                </button>
              )}
            </div>
            {p.description && <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>{p.description}</p>}
          </div>
        ))}
        {projects.length === 0 && <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>No projects yet.</p>}
      </div>
    </div>
  );
}
