import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateAIDescription, projectApi, taskApi, userApi } from "./api";
import { NavBar } from "./NavBar";
import type { ProjectRes, TaskRes, UserRes } from "./api";
import { columns, userName } from "./taskConstants";
import { TaskDetailModal } from "./TaskDetailPanel";

const userPalette = [
  { bg: "#f5ecec", border: "#dbb5b5" },
  { bg: "#ecf0f5", border: "#b5c8db" },
  { bg: "#f5f0ec", border: "#dbc9b5" },
  { bg: "#eef5ec", border: "#bcdbb5" },
  { bg: "#f5ecf3", border: "#dbb5cf" },
  { bg: "#ecf5f5", border: "#b5d4db" },
  { bg: "#f5f0ec", border: "#dbceb5" },
  { bg: "#f2ecf5", border: "#c8b5db" },
  { bg: "#f5ecec", border: "#dbbfc5" },
  { bg: "#ecf5f0", border: "#b5dbc8" },
];

interface Props { projectId: number; userId: number; username?: string; email?: string; onBack: () => void; onDashboard?: () => void; onLogout?: () => void; onMenuToggle?: () => void }

function CreateTaskModal({
  users,
  project,
  canAssign,
  currentUserId,
  onClose,
  onCreate,
}: {
  users: UserRes[];
  project: ProjectRes | null;
  canAssign: boolean;
  currentUserId: number;
  onClose: () => void;
  onCreate: (title: string, description: string, priority: number, assigneeId: number) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [assigneeId, setAssigneeId] = useState(currentUserId);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const memberUsers = users.filter(user => project?.memberIds.includes(user.id));

  const handleCreate = async () => {
    if (!title) { setError("Title is required"); return; }
    try { setError(""); await onCreate(title, description, priority, assigneeId); onClose(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to create task"); }
  };

  const handleAiGenerate = async () => {
    if (!title.trim()) { setError("Enter a title first"); return; }
    setAiLoading(true);
    setError("");
    try {
      const desc = await generateAIDescription(title);
      setDescription(desc);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 32, maxWidth: 450, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>New Task</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>x</button>
        </div>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} autoFocus style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} style={{ flex: 1, padding: "10px 12px", border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }} />
          <button onClick={handleAiGenerate} disabled={aiLoading} style={{ padding: "10px 14px", whiteSpace: "nowrap", fontSize: 12, border: "1px solid #ddd", borderRadius: 4, background: "transparent", color: "#555", cursor: "pointer", fontWeight: 500, opacity: aiLoading ? 0.5 : 1, position: "relative", top: 0, boxShadow: "0 2px 0 #d0d0d0", transition: "all 0.06s ease" }}
            onMouseEnter={e => { if (!aiLoading) { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #d0d0d0"; } }}
            onMouseLeave={e => { if (!aiLoading) { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #d0d0d0"; } }}>
            {aiLoading ? "..." : "✨ Generate"}
          </button>
        </div>
        <select value={priority} onChange={e => setPriority(Number(e.target.value))} style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}>
          <option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option>
        </select>
        {canAssign && (
          <select value={assigneeId} onChange={e => setAssigneeId(Number(e.target.value))} style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}>
            {memberUsers.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
          </select>
        )}
        {error && <p style={{ color: "red", fontSize: 14, marginBottom: 8 }}>{error}</p>}
        <button onClick={handleCreate} style={{ width: "100%", padding: 10, fontSize: 14, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 3px 0 #000", transition: "all 0.06s ease" }}
          onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}
          onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 3px 0 #000"; }}>Create</button>
      </div>
    </div>
  );
}

export function TasksPage({ projectId, userId, username, email, onBack, onDashboard, onLogout, onMenuToggle }: Props) {
  const [tasks, setTasks] = useState<TaskRes[]>([]);
  const [project, setProject] = useState<ProjectRes | null>(null);
  const [users, setUsers] = useState<UserRes[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskRes | null>(null);
  const [statusError, setStatusError] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; task: TaskRes } | null>(null);
  const [membersProject, setMembersProject] = useState<ProjectRes | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isProjectAdmin = project?.adminIds.includes(userId) ?? false;

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [ctxMenu]);

  const load = () => taskApi.list(projectId).then(setTasks);
  const loadProject = async () => {
    const loadedProject = await projectApi.get(projectId);
    setProject(loadedProject);
    return loadedProject;
  };
  useEffect(() => { load(); loadProject().catch(() => null); }, [projectId]);
  useEffect(() => {
    userApi.list().then(setUsers).catch(e => setStatusError(e instanceof Error ? e.message : "Failed to load users"));
  }, []);

  const handleCreate = async (title: string, description: string, priority: number, assigneeId: number) => {
    await taskApi.create({ title, description, projectId, createdById: userId, priority, assigneeId });
    await load();
  };

  const assignTask = async (taskId: number, assigneeId: number) => {
    try {
      setStatusError("");
      await taskApi.assign(taskId, assigneeId);
      await load();
    } catch (error: unknown) {
      setStatusError(error instanceof Error ? error.message : "Failed to assign task");
    }
  };

  const changeStatus = async (taskId: number, status: number) => {
    try {
      setStatusError("");
      await taskApi.changeStatus(taskId, { status });
      await load();
    } catch (error: unknown) {
      setStatusError(error instanceof Error ? error.message : "Failed to change status");
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("text/plain", String(taskId));
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).classList.add("dragging");
  };
  const onDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove("dragging");
    document.querySelectorAll(".column-drop-zone").forEach(el => el.classList.remove("drag-over"));
  };
  const onDrop = (e: React.DragEvent, newStatus: number) => {
    e.preventDefault();
    document.querySelectorAll(".column-drop-zone").forEach(el => el.classList.remove("drag-over"));
    const taskId = Number(e.dataTransfer.getData("text/plain"));
    changeStatus(taskId, newStatus);
  };

  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      {/* Content wrapper */}
      <div style={{
        height: "100vh",
        overflow: "clip",
        display: "flex",
        flexDirection: "column",
      }}>
      {showCreate && (
        <CreateTaskModal
          users={users}
          project={project}
          canAssign={isProjectAdmin}
          currentUserId={userId}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      <NavBar username={username} email={email} onSelectProject={onDashboard ?? undefined} onLogout={onLogout} onMenuToggle={onMenuToggle} style={{ paddingRight: detailTask ? 444 : 24, transition: "padding-right 0.15s ease" }} />

      {/* Members modal */}
      {membersProject && (
        <div onClick={() => setMembersProject(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 24, maxWidth: 440, width: "92%", borderRadius: 10, boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Invite members</h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>{membersProject.name}</p>
              </div>
              <button onClick={() => setMembersProject(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999", padding: "0 4px" }}>×</button>
            </div>

            {/* Search */}
            <input placeholder="Search by username or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }} />

            {/* Scrollable list */}
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {/* Members section */}
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 12, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Members</h4>
                {users.filter(u => membersProject.memberIds.includes(u.id)).map(user => (
                  <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#222", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{user.username}</div>
                        <div style={{ fontSize: 11, color: "#999" }}>{membersProject.adminIds.includes(user.id) ? "Admin" : "Executor"}</div>
                      </div>
                    </div>
                    {!membersProject.adminIds.includes(user.id) && (
                      <button onClick={async () => {
                        try {
                          await projectApi.removeMember(membersProject.id, user.id);
                          const updated = await projectApi.get(membersProject.id);
                          setMembersProject(updated);
                          setProject(updated);
                          await load();
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Failed");
                        }
                      }} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid #ddd", borderRadius: 4, background: "transparent", color: "#999", cursor: "pointer", transition: "all 0.06s ease", position: "relative", top: 0, boxShadow: "0 2px 0 #e0e0e0" }}
                        onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #e0e0e0"; }}
                        onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #e0e0e0"; }}>Remove</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Pending invitations */}
              {membersProject.invitedUserIds.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 12, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Pending</h4>
                  {users.filter(u => membersProject.invitedUserIds.includes(u.id)).map(user => (
                    <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ddd", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#888" }}>{user.username}</div>
                          <div style={{ fontSize: 11, color: "#bbb" }}>{user.email}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: "#bbb" }}>Invited</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Search results */}
              {searchQuery.trim() && (
                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 12, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Results</h4>
                  {users.filter(u => !membersProject.memberIds.includes(u.id) && !membersProject.invitedUserIds.includes(u.id) && (u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))).map(user => (
                    <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#eee", color: "#555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{user.username}</div>
                          <div style={{ fontSize: 11, color: "#999" }}>{user.email}</div>
                        </div>
                      </div>
                      <button onClick={async () => {
                        try {
                          await projectApi.inviteMember(membersProject.id, user.id);
                          const updated = await projectApi.get(membersProject.id);
                          setMembersProject(updated);
                          if (project?.id === updated.id) setProject(updated);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Failed");
                        }
                      }} style={{ padding: "4px 12px", fontSize: 11, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease" }}
                        onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; }}
                        onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}>Invite</button>
                    </div>
                  ))}
                  {users.filter(u => !membersProject.memberIds.includes(u.id) && !membersProject.invitedUserIds.includes(u.id) && (u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                    <p style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No users found</p>
                  )}
                </div>
              )}

              {!searchQuery.trim() && membersProject.memberIds.length === 0 && membersProject.invitedUserIds.length === 0 && (
                <p style={{ color: "#ccc", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No members yet. Search to invite.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 2000, background: "#fff", border: "1px solid #222", boxShadow: "0 3px 0 #000, 0 4px 12px rgba(0,0,0,0.12)", minWidth: 160 }}>
          <button
            onClick={async () => {
              const t = ctxMenu.task;
              setCtxMenu(null);
              try { await taskApi.delete(t.id); load(); }
              catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
            }}
            className="keycap-btn keycap-btn-outline"
            style={{ width: "100%", padding: "8px 16px", fontSize: 13, textAlign: "left" }}
          >
            Delete task
          </button>
        </div>
      )}

      {/* Back / Invite / New Task */}
      <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: detailTask ? 444 : 24 }}>
        <button onClick={onBack} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #ddd", borderRadius: 4, background: "transparent", color: "#555", cursor: "pointer", fontWeight: 500, position: "relative", top: 0, boxShadow: "0 2px 0 #d0d0d0", transition: "all 0.06s ease" }}
          onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #d0d0d0"; }}
          onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #d0d0d0"; }}>
          ← Back to Dashboard
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {project?.adminIds.includes(userId) && (
            <button onClick={() => setMembersProject(project)} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #ddd", borderRadius: 4, background: "transparent", color: "#555", cursor: "pointer", fontWeight: 500, position: "relative", top: 0, boxShadow: "0 2px 0 #d0d0d0", transition: "all 0.06s ease" }}
              onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #d0d0d0"; }}
              onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #d0d0d0"; }}>
              + Invite
            </button>
          )}
          <button onClick={() => setShowCreate(true)} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease" }}
            onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; }}
            onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}>
            + New Task
          </button>
        </div>
      </div>

      {statusError && <p style={{ color: "red", fontSize: 14, marginBottom: 12, padding: "0 24px" }}>{statusError}</p>}

      {/* Columns area — scales when panel opens */}
      <div style={{ flex: 1, minHeight: 0, overflow: detailTask ? "hidden" : "", padding: "0 24px 32px" }}>
      <div style={{
        height: detailTask ? "calc(100% / 0.72)" : "100%",
        display: "flex",
        flexDirection: "column",
        maxWidth: detailTask ? "calc((100vw - 420px) / 0.755)" : "100%",
        transform: detailTask ? "scale(0.72)" : "scale(1)",
        transformOrigin: "left top",
        transition: "transform 0.15s ease, max-width 0.15s ease",
      }}>
        {(() => {
          const allAssigneeIds = [...new Set(tasks.map(t => t.assigneeId))];
          const globalColorMap = new Map<number, (typeof userPalette)[number]>();
          allAssigneeIds.forEach((id, i) => globalColorMap.set(id, userPalette[i % userPalette.length]));
          return (
        <div style={{ display: "flex", gap: 16, overflowX: "auto", flex: 1, minHeight: 0 }}>
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            const groups = new Map<number, TaskRes[]>();
            colTasks.forEach(t => {
              const g = groups.get(t.assigneeId) || [];
              g.push(t);
              groups.set(t.assigneeId, g);
            });
            const assigneeIds = [...groups.keys()];
            const colorMap = new Map<number, (typeof userPalette)[number]>();
            allAssigneeIds.forEach(id => {
              if (groups.has(id)) colorMap.set(id, globalColorMap.get(id)!);
            });
            return (
              <div key={col.key} className="column-drop-zone" onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }} onDragLeave={e => e.currentTarget.classList.remove("drag-over")} onDrop={e => onDrop(e, col.key)}>
                <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#000", flexShrink: 0 }}>{col.title} ({colTasks.length})</h3>
                <div style={{ overflowY: "auto", flex: 1, paddingBottom: 32 }}>
                {assigneeIds.map(aid => {
                  const color = colorMap.get(aid)!;
                  return (
                    <div key={aid} style={{ marginBottom: 12, background: color.bg, borderLeft: `4px solid ${color.border}`, padding: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: "bold", color: "#111", marginBottom: 6, padding: "0 4px" }}>
                        {userName(users, aid)} ({groups.get(aid)!.length})
                      </div>
                      {groups.get(aid)!.map(t => (
                        <div key={t.id} draggable onDragStart={e => onDragStart(e, t.id)} onDragEnd={onDragEnd} onClick={() => setDetailTask(detailTask?.id === t.id ? null : t)} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, task: t }); }} className="task-card">
                          <strong style={{ fontSize: 14 }}>{t.title}</strong>
                          {t.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#999", lineHeight: 1.4 }}>{t.description}</p>}
                          <div className="task-card-footer">
                            <div className="avatar-circle">{userName(users, t.assigneeId).charAt(0).toUpperCase()}</div>
                            <span>{userName(users, t.assigneeId)}</span>
                          </div>
                          {isProjectAdmin && (
                            <select
                              value={t.assigneeId}
                              onClick={e => e.stopPropagation()}
                              onChange={e => assignTask(t.id, Number(e.target.value))}
                              style={{ width: "100%", marginTop: 8, padding: "6px 8px", border: "1px solid #ddd", fontSize: 13 }}
                            >
                              {users.filter(user => project?.memberIds.includes(user.id)).map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
                </div>
              </div>
            );
          })}
        </div>
          );
        })()}
      </div>
      </div>
      </div>

      {/* Side panel for task details — animated with Framer Motion */}
      <AnimatePresence>
        {detailTask && (
          <motion.div
            key="task-panel"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ position: "fixed", top: 0, right: 0, width: 420, height: "100vh", borderLeft: "1px solid #e0e0e0", overflowY: "auto", background: "#fff", zIndex: 100, boxShadow: "-4px 0 12px rgba(0,0,0,0.06)" }}
          >
            <TaskDetailModal task={detailTask} users={users} projectId={projectId} userId={userId} memberIds={project?.memberIds} isAdmin={isProjectAdmin} onClose={() => setDetailTask(null)} />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
  );
}
