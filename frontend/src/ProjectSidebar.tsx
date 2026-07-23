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
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; project: ProjectRes } | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<ProjectRes | null>(null);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [ctxMenu]);

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
              exit={{ opacity: 0, transition: { duration: 0 } }}
              transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
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

              <button onClick={() => setShowNewProject(true)} style={{ width: "100%", padding: "8px 0", fontSize: 13, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease", marginBottom: 16 }}
                onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; }}
                onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}>+ New Project</button>

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
                        onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, project: p }); }}
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #f0f0f0",
                          cursor: "pointer",
                          borderLeft: isActive ? "3px solid #222" : "3px solid transparent",
                          paddingLeft: isActive ? 9 : 12,
                          userSelect: "none",
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#fafafa"; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          {editingProjectId === p.id ? (
                            <input value={editValue} onChange={e => setEditValue(e.target.value)}
                              autoFocus
                              onClick={e => e.stopPropagation()}
                              onBlur={async () => {
                                if (editValue.trim() && editValue !== p.name) {
                                  try { const updated = await projectApi.update(p.id, { name: editValue }); setProjects(prev => prev.map(pr => pr.id === updated.id ? updated : pr)); } catch {}
                                }
                                setEditingProjectId(null);
                              }}
                              onKeyDown={async e => {
                                if (e.key === "Enter") { e.currentTarget.blur(); }
                                if (e.key === "Escape") { setEditingProjectId(null); }
                              }}
                              style={{ width: "100%", padding: "4px 6px", fontSize: 14, fontWeight: 600, border: "1px solid #222", borderRadius: 4, outline: "none", boxSizing: "border-box" }}
                            />
                          ) : (
                            <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{p.name}</div>
                          )}
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
              <button onClick={() => setShowNewProject(false)} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #ddd", borderRadius: 4, background: "transparent", color: "#555", cursor: "pointer", fontWeight: 500, position: "relative", top: 0, boxShadow: "0 2px 0 #d0d0d0", transition: "all 0.06s ease" }}
                onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #d0d0d0"; }}
                onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #d0d0d0"; }}>Cancel</button>
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
              }} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease" }}
                onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; }}
                onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 2000, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", minWidth: 140, padding: 4 }}>
          <button onClick={() => { setEditingProjectId(ctxMenu.project.id); setEditValue(ctxMenu.project.name); setCtxMenu(null); }} style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: "none", background: "none", cursor: "pointer", textAlign: "left", borderRadius: 4, color: "#333" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>Rename</button>
          <button onClick={() => { setDeleteConfirm(ctxMenu.project); setCtxMenu(null); }} style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: "none", background: "none", cursor: "pointer", textAlign: "left", borderRadius: 4, color: "#c00" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>Delete</button>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 24, maxWidth: 360, width: "90%", borderRadius: 8, boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Delete project?</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888", lineHeight: 1.4 }}>This will permanently delete <strong>{deleteConfirm.name}</strong> and all its tasks.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #ddd", borderRadius: 4, background: "transparent", color: "#555", cursor: "pointer", fontWeight: 500, position: "relative", top: 0, boxShadow: "0 2px 0 #d0d0d0", transition: "all 0.06s ease" }}
                onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #d0d0d0"; }}
                onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #d0d0d0"; }}>Cancel</button>
              <button onClick={async () => {
                try {
                  await projectApi.delete(deleteConfirm.id);
                  setProjects(prev => prev.filter(p => p.id !== deleteConfirm.id));
                  setDeleteConfirm(null);
                } catch { /* ignore */ }
              }} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #c00", borderRadius: 4, background: "#c00", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #a00", transition: "all 0.06s ease" }}
                onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #a00"; }}
                onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #a00"; }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
