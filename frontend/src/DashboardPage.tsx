import { useEffect, useState } from "react";
import { getAllTasks, taskApi } from "./api";
import type { TaskWithProject } from "./api";

interface Props {
  userId: number;
  onSelectProject: (projectId: number) => void;
  onProjects: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

const columns = [
  { key: 1, title: "To Do" },
  { key: 2, title: "In Progress" },
  { key: 3, title: "Review" },
  { key: 4, title: "Done" },
];

const priorityLabels: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical" };
const priorityColors: Record<number, string> = { 1: "#999", 2: "#1677ff", 3: "#ffa940", 4: "#ff4d4f" };

const projectPalette = [
  { bg: "#e8f4f8", border: "#4a90d9", text: "#2c5f8a" },
  { bg: "#f0e6f6", border: "#9b59b6", text: "#6c3483" },
  { bg: "#fef9e7", border: "#f39c12", text: "#b7950b" },
  { bg: "#fdedec", border: "#e74c3c", text: "#922b21" },
  { bg: "#e8f8f5", border: "#1abc9c", text: "#148f77" },
  { bg: "#f5eef8", border: "#8e44ad", text: "#6c3483" },
  { bg: "#ebf5fb", border: "#2e86c1", text: "#1a5276" },
  { bg: "#fdf2e9", border: "#e67e22", text: "#ca6f1e" },
  { bg: "#eafaf1", border: "#27ae60", text: "#1e8449" },
  { bg: "#f4ecf7", border: "#7d3c98", text: "#5b2c6f" },
];

function TaskModal({ task, onClose, onProjectClick }: { task: TaskWithProject; onClose: () => void; onProjectClick: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 32, maxWidth: 500, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{task.title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>✕</button>
        </div>
        <p style={{ color: "#666", marginBottom: 16, lineHeight: 1.5 }}>{task.description || "— no description —"}</p>
        <div style={{ display: "flex", gap: 12, fontSize: 14, color: "#888" }}>
          <span>Priority: <strong>{priorityLabels[task.priority] || "?"}</strong></span>
          <span>Status: <strong>{columns.find(c => c.key === task.status)?.title || "?"}</strong></span>
        </div>
        <div style={{ marginTop: 12, fontSize: 14 }}>
          Project:{" "}
          <a href="#" onClick={e => { e.preventDefault(); onProjectClick(); }} style={{ color: "#1677ff", textDecoration: "none" }}>
            {task.projectName}
          </a>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage({ userId, onSelectProject, onProjects, onProfile, onLogout }: Props) {
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTask, setModalTask] = useState<TaskWithProject | null>(null);
  const [statusError, setStatusError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const all = await getAllTasks();
      setTasks(all);
    } catch (e: unknown) {
      setStatusError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onProjectClick={() => { setModalTask(null); onSelectProject(modalTask.projectId); }}
        />
      )}

      {/* Navigation — full width */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => {}} style={{ padding: "6px 16px", background: "#1677ff", color: "#fff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: "bold" }}>Home</button>
            <button onClick={onProjects} style={{ padding: "6px 16px", background: "transparent", color: "#1677ff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>My Projects</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onProfile} style={{ padding: "6px 16px", background: "transparent", color: "#1677ff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>Profile</button>
            <button onClick={onLogout} style={{ padding: "6px 16px", background: "transparent", color: "#999", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>Logout</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: "0 0 4px" }}>Dashboard</h2>
        <p style={{ margin: "0 0 16px", color: "#999", fontSize: 14 }}>All tasks across all projects</p>

        {statusError && <p style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{statusError}</p>}

        {loading ? (
          <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>No tasks yet. Create one in a project.</p>
        ) : (
          <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
            {(() => {
              // Assign a fixed color to each project globally (same color across all columns)
              const allProjectNames = [...new Set(tasks.map(t => t.projectName))];
              const projectColorMap = new Map<string, (typeof projectPalette)[number]>();
              allProjectNames.forEach((name, i) => {
                projectColorMap.set(name, projectPalette[i % projectPalette.length]);
              });

              return columns.map(col => {
                const colTasks = tasks.filter(t => t.status === col.key);
                const groups = new Map<string, TaskWithProject[]>();
                colTasks.forEach(t => {
                  const g = groups.get(t.projectName) || [];
                  g.push(t);
                  groups.set(t.projectName, g);
                });
                const projectNames = [...groups.keys()];
                return (
                  <div key={col.key} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, col.key)} style={{ minWidth: 280, flex: 1, background: "#f5f5f5", borderRadius: 8, padding: 12 }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#555" }}>{col.title} ({colTasks.length})</h3>
                    {projectNames.map(pname => {
                      const color = projectColorMap.get(pname)!;
                      return (
                        <div key={pname} style={{ marginBottom: 12, background: color.bg, borderRadius: 8, borderLeft: `4px solid ${color.border}`, padding: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: "bold", color: color.text, marginBottom: 6, padding: "0 4px" }}>{pname}</div>
                          {groups.get(pname)!.map(t => (
                            <div key={t.id} draggable onDragStart={e => onDragStart(e, t.id)} onClick={() => setModalTask(t)} style={{ padding: 10, marginBottom: 6, background: "#fff", borderRadius: 6, border: "1px solid #eee", cursor: "pointer" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong style={{ fontSize: 14 }}>{t.title}</strong>
                                <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, background: priorityColors[t.priority] || "#999", color: "#fff" }}>{priorityLabels[t.priority] || "?"}</span>
                              </div>
                              {t.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>{t.description}</p>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {projectNames.length === 0 && <p style={{ color: "#ccc", textAlign: "center", fontSize: 13 }}>—</p>}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
