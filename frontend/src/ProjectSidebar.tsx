import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projectApi, userApi } from "./api";
import type { ProjectRes, UserRes } from "./api";

interface Props {
  show: boolean;
  onClose: () => void;
  currentProjectId?: number | null;
  onSelectProject: (projectId: number) => void;
  userId: number;
}

export function ProjectSidebar({ show, onClose, currentProjectId, onSelectProject, userId }: Props) {
  const [projects, setProjects] = useState<ProjectRes[]>([]);
  const [users, setUsers] = useState<UserRes[]>([]);
  const [viewMembers, setViewMembers] = useState<ProjectRes | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    if (show) {
      projectApi.list().then(setProjects).catch(() => {});
      userApi.list().then(setUsers).catch(() => {});
    }
  }, [show]);

  return (
    <>
      <AnimatePresence>
        {show && (
          <>
            {/* Backdrop */}
            <motion.div
              key="projects-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={onClose}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 89 }}
            />
            <motion.div
              key="projects-sidebar"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "tween", duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ position: "fixed", top: 8, left: 8, width: 300, height: "calc(100vh - 16px)", borderRadius: 12, overflow: "hidden", background: "#fff", zIndex: 90, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
            >
            <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden", padding: 20, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Projects</h3>
                <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>×</button>
              </div>

              <button onClick={() => setShowNewProject(true)} className="keycap-btn keycap-btn-solid" style={{ width: "100%", fontSize: 13, padding: "8px 0", marginBottom: 16 }}>+ New Project</button>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {projects.length === 0 ? (
                  <p style={{ color: "#999", fontSize: 13 }}>No projects yet.</p>
                ) : (
                  projects.map(p => {
                    const memberUsers = users.filter(u => p.memberIds.includes(u.id));
                    const displayMembers = memberUsers.slice(0, 3);
                    const overflow = memberUsers.length - 3;
                    const isActive = p.id === currentProjectId;
                    return (
                      <div
                        key={p.id}
                        onClick={() => { onClose(); onSelectProject(p.id); }}
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #f0f0f0",
                          cursor: "pointer",
                          borderLeft: isActive ? "3px solid #222" : "3px solid transparent",
                          paddingLeft: isActive ? 9 : 12,
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#fafafa"; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{p.name}</div>
                          <div onClick={e => { e.stopPropagation(); setViewMembers(p); }} style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer", flexShrink: 0 }}>
                            {displayMembers.map((u, i) => (
                              <div key={u.id} style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? "#222" : i === 1 ? "#555" : "#888", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: "bold", marginLeft: i > 0 ? -7 : 0, border: "1px solid #fff" }}>
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {overflow > 0 && (
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#ccc", color: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: "bold", marginLeft: -7, border: "1px solid #fff" }}>
                                +{overflow}
                              </div>
                            )}
                            {memberUsers.length === 0 && <span style={{ fontSize: 11, color: "#bbb" }}>No members</span>}
                          </div>
                        </div>
                        {p.description && <div style={{ fontSize: 12, color: "#888" }}>{p.description}</div>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
        )}
      </AnimatePresence>

      {/* Members modal */}
      {viewMembers && (
        <div onClick={() => setViewMembers(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 32, maxWidth: 400, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0 }}>{viewMembers.name}</h3>
              <button onClick={() => setViewMembers(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>×</button>
            </div>
            <p style={{ margin: "0 0 12px", color: "#666", fontSize: 14 }}>Members ({viewMembers.memberIds.length})</p>
            {users.filter(u => viewMembers.memberIds.includes(u.id)).map(user => (
              <div key={user.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#222", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold" }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{user.email}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#777" }}>
                  {viewMembers.adminIds.includes(user.id) ? "Admin" : "Member"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Project modal */}
      {showNewProject && (
        <div onClick={() => setShowNewProject(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 32, maxWidth: 450, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 16px" }}>New Project</h3>
            <input placeholder="Project name" value={newName} onChange={e => setNewName(e.target.value)} autoFocus style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }} />
            <textarea placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={4} style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowNewProject(false)} className="keycap-btn keycap-btn-ghost">Cancel</button>
              <button onClick={async () => {
                if (!newName.trim()) return;
                try {
                  const p = await projectApi.create({ name: newName, description: newDesc, createdById: userId });
                  setNewName(""); setNewDesc("");
                  setShowNewProject(false);
                  setProjects(prev => [...prev, p]);
                  onClose();
                  onSelectProject(p.id);
                } catch { /* ignore */ }
              }} className="keycap-btn keycap-btn-solid">Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
