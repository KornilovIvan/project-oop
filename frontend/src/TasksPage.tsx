import { useEffect, useState } from "react";
import { taskApi } from "./api";
import type { TaskRes } from "./api";

interface Props {
  projectId: number;
  userId: number;
  onBack: () => void;
}

const priorityLabels: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical" };
const statusLabels: Record<number, string> = { 1: "To Do", 2: "In Progress", 3: "Review", 4: "Done" };

export function TasksPage({ projectId, userId, onBack }: Props) {
  const [tasks, setTasks] = useState<TaskRes[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);

  const load = async () => setTasks(await taskApi.list(projectId));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title) return;
    await taskApi.create({ title, description, projectId, createdById: userId, priority });
    setTitle(""); setDescription(""); load();
  };

  const changeStatus = (taskId: number, status: number) =>
    taskApi.changeStatus(taskId, { status, actorId: userId }).then(load);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ padding: "6px 12px", background: "transparent", color: "#1677ff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>← Back</button>
        <h2 style={{ margin: 0 }}>Tasks</h2>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inp, flex: 1, minWidth: 200 }} />
        <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} style={{ ...inp, flex: 1, minWidth: 200 }} />
        <select value={priority} onChange={e => setPriority(Number(e.target.value))} style={inp}>
          <option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option>
        </select>
        <button onClick={create} style={btn}>Create</button>
      </div>
      {tasks.map(t => (
        <div key={t.id} style={{ padding: 16, marginBottom: 8, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{t.title}</strong>
            <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: t.priority === 4 ? "#ff4d4f" : t.priority === 3 ? "#ffa940" : t.priority === 2 ? "#1677ff" : "#999", color: "#fff" }}>
              {priorityLabels[t.priority] || "?"}
            </span>
          </div>
          {t.description && <p style={{ margin: "4px 0", color: "#666", fontSize: 14 }}>{t.description}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 13, color: "#888" }}>{statusLabels[t.status] || "?"}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {t.status === 1 && <button style={sb} onClick={() => changeStatus(t.id, 2)}>Start</button>}
              {t.status === 2 && <button style={sb} onClick={() => changeStatus(t.id, 3)}>Review</button>}
              {t.status === 3 && <button style={sb} onClick={() => changeStatus(t.id, 4)}>Done</button>}
            </div>
          </div>
        </div>
      ))}
      {tasks.length === 0 && <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>No tasks yet.</p>}
    </div>
  );
}

const inp: React.CSSProperties = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 15 };
const btn: React.CSSProperties = { padding: "8px 20px", background: "#1677ff", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap" };
const sb: React.CSSProperties = { padding: "4px 12px", background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 4, fontSize: 13, cursor: "pointer" };
