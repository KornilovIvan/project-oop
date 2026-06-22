import { useEffect, useState } from "react";
import { taskApi } from "./api";
import type { TaskRes } from "./api";

interface Props { projectId: number; userId: number; onBack: () => void; onDashboard?: () => void; onProjects?: () => void; onProfile?: () => void; onLogout?: () => void }

const columns = [
  { key: 1, title: "To Do" },
  { key: 2, title: "In Progress" },
  { key: 3, title: "Review" },
  { key: 4, title: "Done" },
];

const priorityLabels: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical" };
const priorityColors: Record<number, string> = { 1: "#d4d4d4", 2: "#c0c0c0", 3: "#a8a8a8", 4: "#888888" };

function TaskModal({ task, onClose }: { task: TaskRes; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 32, maxWidth: 500, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{task.title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>✕</button>
        </div>
        <p style={{ color: "#666", marginBottom: 16, lineHeight: 1.5 }}>{task.description || "— no description —"}</p>
        <div style={{ display: "flex", gap: 12, fontSize: 14, color: "#888" }}>
          <span>Priority: <strong>{priorityLabels[task.priority] || "?"}</strong></span>
          <span>Status: <strong>{columns.find(c => c.key === task.status)?.title || "?"}</strong></span>
        </div>
      </div>
    </div>
  );
}

export function TasksPage({ projectId, userId, onBack, onDashboard, onProjects, onProfile, onLogout }: Props) {
  const [tasks, setTasks] = useState<TaskRes[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [modalTask, setModalTask] = useState<TaskRes | null>(null);
  const [createError, setCreateError] = useState("");
  const [statusError, setStatusError] = useState("");

  const load = () => taskApi.list(projectId).then(setTasks);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title) return;
    try { setCreateError(""); await taskApi.create({ title, description, projectId, createdById: userId, priority }); setTitle(""); setDescription(""); load(); }
    catch (e: unknown) { setCreateError(e instanceof Error ? e.message : "Failed"); }
  };

  const changeStatus = async (taskId: number, status: number) => {
    try {
      setStatusError("");
      await taskApi.changeStatus(taskId, { status, actorId: userId });
      await load();
    } catch (error: unknown) {
      setStatusError(error instanceof Error ? error.message : "Failed to change status");
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: number) => { e.dataTransfer.setData("text/plain", String(taskId)); };
  const onDrop = (e: React.DragEvent, newStatus: number) => {
    e.preventDefault();
    const taskId = Number(e.dataTransfer.getData("text/plain"));
    const task = tasks.find(item => item.id === taskId);
    if (!task || newStatus !== task.status + 1) {
      setStatusError("Tasks can only move to the next status");
      return;
    }
    changeStatus(taskId, newStatus);
  };

  return (
    <div>
      {modalTask && <TaskModal task={modalTask} onClose={() => setModalTask(null)} />}

      {/* Navigation — full width */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {onDashboard && <button onClick={onDashboard} className="keycap-btn keycap-btn-outline">Home</button>}
            {onProjects && <button onClick={onProjects} className="keycap-btn keycap-btn-outline">My Projects</button>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {onProfile && <button onClick={onProfile} className="keycap-btn keycap-btn-outline">Profile</button>}
            {onLogout && <button onClick={onLogout} className="keycap-btn keycap-btn-ghost">Logout</button>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={{ marginBottom: 16, padding: "6px 12px", background: "transparent", color: "#666", border: "1px solid #ccc", fontSize: 14, cursor: "pointer" }}>← Back to Projects</button>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inp, flex: 1, minWidth: 200 }} />
          <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} style={{ ...inp, flex: 1, minWidth: 200 }} />
          <select value={priority} onChange={e => setPriority(Number(e.target.value))} style={inp}>
            <option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option>
          </select>
          <button onClick={create} style={btn}>Create</button>
        </div>
        {createError && <p style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{createError}</p>}
        {statusError && <p style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{statusError}</p>}

        <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
          {columns.map(col => (
            <div key={col.key} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, col.key)} style={{ minWidth: 250, flex: 1, background: "#f5f5f5", padding: 12 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#555" }}>{col.title}</h3>
              {tasks.filter(t => t.status === col.key).map(t => (
                <div key={t.id} draggable onDragStart={e => onDragStart(e, t.id)} onClick={() => setModalTask(t)} style={{ padding: 12, marginBottom: 8, background: "#fff", border: "1px solid #e0e0e0", cursor: "pointer", boxShadow: "0 2px 0 #d0d0d0, 0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 14 }}>{t.title}</strong>
                    <span style={{ fontSize: 11, padding: "2px 6px", background: priorityColors[t.priority] || "#999", color: "#fff" }}>{priorityLabels[t.priority] || "?"}</span>
                  </div>
                  {t.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>{t.description}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { padding: "8px 12px", border: "1px solid #ddd", fontSize: 15 };
const btn: React.CSSProperties = { padding: "8px 20px", background: "#222", color: "#fff", border: "none", fontSize: 15, cursor: "pointer", whiteSpace: "nowrap" };
