import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllTasks, taskApi, userApi } from "./api";
import type { TaskWithProject, UserRes } from "./api";
import { columns } from "./taskConstants";
import { TaskDetailModal } from "./TaskDetailPanel";
import { NavBar } from "./NavBar";

const projectPalette = [
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

interface Props {
  userId: number;
  username: string;
  email?: string;
  onSelectProject: (projectId: number) => void;
  onLogout: () => void;
  onMenuToggle?: () => void;
}

export function DashboardPage({ userId, username, email, onSelectProject, onLogout, onMenuToggle }: Props) {
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [detailTask, setDetailTask] = useState<TaskWithProject | null>(null);
  const [users, setUsers] = useState<UserRes[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const all = await getAllTasks();
      setTasks(all.filter(t => t.assigneeId === userId));
    } catch (e: unknown) {
      setStatusError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      const all = await getAllTasks();
      setTasks(all.filter(t => t.assigneeId === userId));
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    userApi.list().then(setUsers).catch(e => setStatusError(e instanceof Error ? e.message : "Failed to load users"));
  }, []);

  const changeStatus = async (taskId: number, status: number) => {
    try {
      setStatusError("");
      await taskApi.changeStatus(taskId, { status });
      await refresh();
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <NavBar username={username} email={email} onSelectProject={onSelectProject} onLogout={onLogout} onMenuToggle={onMenuToggle} style={{ paddingRight: detailTask ? 444 : 24, transition: "padding-right 0.15s ease" }} />

      {/* Header */}
      <div style={{ padding: "16px 24px 0" }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <p style={{ margin: "4px 0 0", color: "#999", fontSize: 14 }}>My tasks across all projects</p>
        {statusError && <p style={{ color: "red", fontSize: 14, marginTop: 8 }}>{statusError}</p>}
      </div>

      {/* Columns area */}
      {loading ? (
        <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>No tasks assigned to you yet.</p>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflow: detailTask ? "hidden" : "", padding: "16px 24px 32px" }}>
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
          const allProjectNames = [...new Set(tasks.map(t => t.projectName))];
          const globalColorMap = new Map<string, (typeof projectPalette)[number]>();
          allProjectNames.forEach((name, i) => globalColorMap.set(name, projectPalette[i % projectPalette.length]));
          return (
        <div style={{ display: "flex", gap: 16, overflowX: "auto", flex: 1, minHeight: 0 }}>
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            const groups = new Map<string, TaskWithProject[]>();
            colTasks.forEach(t => {
              const g = groups.get(t.projectName) || [];
              g.push(t);
              groups.set(t.projectName, g);
            });
            const projectNames = [...groups.keys()];
            const colorMap = new Map<string, (typeof projectPalette)[number]>();
            allProjectNames.forEach(name => {
              if (groups.has(name)) colorMap.set(name, globalColorMap.get(name)!);
            });
            return (
              <div key={col.key} className="column-drop-zone" onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }} onDragLeave={e => e.currentTarget.classList.remove("drag-over")} onDrop={e => onDrop(e, col.key)}>
                <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#000", flexShrink: 0 }}>{col.title} ({colTasks.length})</h3>
                <div style={{ overflowY: "auto", flex: 1, paddingBottom: 32 }}>
                {projectNames.map(pname => {
                  const color = colorMap.get(pname)!;
                  return (
                    <div key={pname} style={{ marginBottom: 12, background: color.bg, borderLeft: `4px solid ${color.border}`, padding: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: "bold", color: "#111", marginBottom: 6, padding: "0 4px" }}>
                        {pname} ({groups.get(pname)!.length})
                      </div>
                      {groups.get(pname)!.map(t => (
                        <div key={t.id} draggable onDragStart={e => onDragStart(e, t.id)} onDragEnd={onDragEnd} onClick={() => setDetailTask(detailTask?.id === t.id ? null : t)} className="task-card">
                          <strong style={{ fontSize: 14 }}>{t.title}</strong>
                          {t.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#999", lineHeight: 1.4 }}>{t.description}</p>}
                          <div className="task-card-footer">
                            <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); onSelectProject(t.projectId); }} style={{ color: "#555", textDecoration: "none" }}>
                              {t.projectName}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
                </div>
                {projectNames.length === 0 && <p style={{ color: "#ccc", textAlign: "center", fontSize: 13 }}>-</p>}
              </div>
            );
          })}
        </div>
          );
        })()}
        </div>
        </div>
      )}

      {/* Task detail panel */}
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
            <TaskDetailModal task={detailTask} users={users} projectId={detailTask.projectId} userId={userId} onClose={() => setDetailTask(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
