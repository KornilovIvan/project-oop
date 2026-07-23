import { useState, useRef, useEffect } from "react";
import { aiGenerateSubtasks, aiImproveDescription, taskApi } from "./api";
import type { TaskRes, UserRes } from "./api";
import { columns } from "./taskConstants";

export function TaskDetailModal({ task, users, onClose, projectId, userId, memberIds, isAdmin }: { task: TaskRes; users: UserRes[]; onClose: () => void; projectId: number; userId: number; memberIds?: number[]; isAdmin?: boolean }) {
  const [descText, setDescText] = useState(task.description || "");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activePopover, setActivePopover] = useState<"ai" | "subtask" | null>(null);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [subtaskItems, setSubtaskItems] = useState<{ id: number; title: string; checked: boolean }[]>([]);
  const [subtaskAssigneeId, setSubtaskAssigneeId] = useState(userId);
  const [editTitle, setEditTitle] = useState(false);
  const [titleText, setTitleText] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePopover) return;
    const close = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setActivePopover(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [activePopover]);

  useEffect(() => {
    if (editTitle && titleRef.current) {
      const range = document.createRange();
      range.selectNodeContents(titleRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editTitle]);

  const handleSaveTitle = async () => {
    const text = titleRef.current?.textContent?.trim() || titleText.trim();
    if (!text) return;
    try {
      const updated = await taskApi.updateTitle(task.id, titleText);
      Object.assign(task, updated);
      setEditTitle(false);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Failed to update title");
    }
  };

  const handleDescChange = (val: string) => {
    setDescText(val);
    if (descTimer.current) clearTimeout(descTimer.current);
    descTimer.current = setTimeout(async () => {
      try {
        const updated = await taskApi.updateDescription(task.id, val);
        Object.assign(task, updated);
      } catch { /* ignore */ }
    }, 600);
  };

  const handleStatusChange = async (status: number) => {
    try {
      const updated = await taskApi.changeStatus(task.id, { status });
      Object.assign(task, updated);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleAssigneeChange = async (assigneeId: number) => {
    try {
      const updated = await taskApi.assign(task.id, assigneeId);
      Object.assign(task, updated);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Failed");
    }
  };

  const canChangeStatus = isAdmin || task.assigneeId === userId;
  const canChangeAssignee = isAdmin === true;

  const handleSubtask = async () => {
    setSubtasksLoading(true);
    setAiError("");
    try {
      const result = await aiGenerateSubtasks(task.title, task.description);
      const items = result
        .split("\n")
        .map(line => line.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean)
        .map((title, i) => ({ id: i, title, checked: true }));
      setSubtaskItems(items);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Failed to generate subtasks");
    } finally {
      setSubtasksLoading(false);
    }
  };

  const toggleSubtask = (id: number) => {
    setSubtaskItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const updateSubtaskTitle = (id: number, title: string) => {
    setSubtaskItems(prev => prev.map(item => item.id === id ? { ...item, title } : item));
  };

  const addSelectedSubtasks = async () => {
    setAiError("");
    const selected = subtaskItems.filter(item => item.checked);
    try {
      for (const item of selected) {
        await taskApi.create({ title: item.title, description: "", projectId, createdById: userId, assigneeId: subtaskAssigneeId });
      }
      setSubtaskItems([]);
      setActivePopover(null);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Failed to create subtasks");
    }
  };

  const handleAIApply = async () => {
    try {
      const result = await aiImproveDescription(task.title, task.description);
      setDescText(result);
      const updated = await taskApi.updateDescription(task.id, result);
      Object.assign(task, updated);
      setActivePopover(null);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "AI error");
    }
  };

  const handleAIRegenerate = async () => {
    if (!feedback.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const result = await aiImproveDescription(task.title, feedback || task.description);
      setDescText(result);
      const updated = await taskApi.updateDescription(task.id, result);
      Object.assign(task, updated);
      setFeedback("");
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "AI error");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
        <h2
          ref={titleRef}
          contentEditable={editTitle}
          suppressContentEditableWarning
          onInput={e => setTitleText(e.currentTarget.textContent || "")}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSaveTitle(); } }}
          onClick={() => { if (!editTitle) { setEditTitle(true); setTitleText(task.title); } }}
          style={{
            margin: 0,
            flex: 1,
            outline: editTitle ? "1px solid #666" : "none",
            outlineOffset: editTitle ? 7 : 0,
            padding: 0,
            borderRadius: 0,
            cursor: editTitle ? "text" : "pointer",
            minHeight: 28,
          }}
        >{task.title}</h2>
        {editTitle && (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={handleSaveTitle} className="keycap-btn keycap-btn-solid" style={{ fontSize: 11, padding: "4px 8px" }}>Save</button>
            <button onClick={() => setEditTitle(false)} className="keycap-btn keycap-btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }}>×</button>
          </div>
        )}
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>×</button>
      </div>

      {/* Description */}
      <textarea
        value={descText}
        onChange={e => handleDescChange(e.target.value)}
        placeholder="Add description..."
        rows={1}
        style={{ width: "100%", padding: 10, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box", resize: "none", fontFamily: "inherit", lineHeight: 1.5, minHeight: 32, overflow: "hidden", fieldSizing: "content" as React.CSSProperties["fieldSizing"] }}
      />

      {/* Metadata */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 13 }}>
        <div>
          <div style={{ color: "#444", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Status</div>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {columns.map((col, i) => (
              <div key={col.key} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <span style={{ color: "#ddd", fontSize: 11, margin: "0 3px" }}>→</span>}
                <span style={{
                  padding: "4px 8px",
                  fontSize: 11,
                  border: `1px solid ${task.status === col.key ? "#222" : "#e0e0e0"}`,
                  borderRadius: 4,
                  background: task.status === col.key ? "#f5f5f5" : "transparent",
                  color: task.status === col.key ? "#222" : "#bbb",
                  fontWeight: task.status === col.key ? 600 : 400,
                }}>
                  {col.title}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#444", minWidth: 70, fontWeight: 500 }}>Assignee</span>
          <span style={{ color: "#ccc" }}>→</span>
          {canChangeAssignee ? (
            <select value={task.assigneeId} onChange={e => handleAssigneeChange(Number(e.target.value))} style={{ flex: 1, padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, cursor: "pointer", background: "#fff" }}>
              {users.filter(u => !memberIds || memberIds.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          ) : (
            <span style={{ flex: 1, padding: "6px 8px" }}>{users.find(u => u.id === task.assigneeId)?.username || "?"}</span>
          )}
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />

      {/* Actions */}
      <div style={{ position: "relative", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setActivePopover(activePopover === "ai" ? null : "ai")} style={{ padding: "8px 14px", fontSize: 12, border: activePopover === "ai" ? "1px solid #222" : "1px solid #ddd", borderRadius: 4, background: activePopover === "ai" ? "#222" : "transparent", color: activePopover === "ai" ? "#fff" : "#555", cursor: "pointer", transition: "all 0.06s ease", fontWeight: 500, position: "relative", top: 0, boxShadow: activePopover === "ai" ? "0 1px 0 #000" : "0 2px 0 #d0d0d0" }}
          onMouseEnter={e => { if (activePopover !== "ai") { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #d0d0d0"; } }}
          onMouseLeave={e => { if (activePopover !== "ai") { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #d0d0d0"; } }}>
          ✨ AI
        </button>
        <button onClick={() => { setActivePopover(activePopover === "subtask" ? null : "subtask"); if (activePopover !== "subtask") setSubtaskItems([]); }} style={{ padding: "8px 14px", fontSize: 12, border: activePopover === "subtask" ? "1px solid #222" : "1px solid #ddd", borderRadius: 4, background: activePopover === "subtask" ? "#222" : "transparent", color: activePopover === "subtask" ? "#fff" : "#555", cursor: "pointer", transition: "all 0.06s ease", fontWeight: 500, position: "relative", top: 0, boxShadow: activePopover === "subtask" ? "0 1px 0 #000" : "0 2px 0 #d0d0d0" }}
          onMouseEnter={e => { if (activePopover !== "subtask") { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #d0d0d0"; } }}
          onMouseLeave={e => { if (activePopover !== "subtask") { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #d0d0d0"; } }}>
          Subtasks
        </button>

        {/* Popover */}
        {activePopover && (
          <div ref={popoverRef} style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 8, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: 14, zIndex: 10 }}>
            {aiError && <p style={{ color: "red", fontSize: 12, margin: "0 0 8px" }}>{aiError}</p>}

            {activePopover === "ai" && (
              <>
                <p style={{ fontSize: 12, color: "#555", margin: "0 0 10px", lineHeight: 1.4 }}>Improve description or give custom feedback.</p>
                <button onClick={handleAIApply} disabled={aiLoading} style={{ width: "100%", padding: "8px 0", fontSize: 12, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease", marginBottom: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; }}
                  onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}>
                  {aiLoading ? "Processing..." : "Auto-improve"}
                </button>
                <div style={{ display: "flex", gap: 6 }}>
                  <input placeholder="Make it shorter, add details..." value={feedback} onChange={e => setFeedback(e.target.value)} style={{ flex: 1, padding: "7px 10px", border: "1px solid #ddd", borderRadius: 4, fontSize: 12, boxSizing: "border-box", outline: "none" }} />
                  <button onClick={handleAIRegenerate} disabled={aiLoading || !feedback.trim()} style={{ padding: "7px 12px", fontSize: 12, border: "1px solid #ddd", borderRadius: 4, background: "transparent", color: "#555", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500, opacity: aiLoading || !feedback.trim() ? 0.5 : 1 }}>
                    Apply
                  </button>
                </div>
              </>
            )}

            {activePopover === "subtask" && (
              <>
                <p style={{ fontSize: 12, color: "#555", margin: "0 0 10px", lineHeight: 1.4 }}>Split into smaller subtasks.</p>
                <button onClick={handleSubtask} disabled={subtasksLoading} style={{ width: "100%", padding: "8px 0", fontSize: 12, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease", marginBottom: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; }}
                  onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}>
                  {subtasksLoading ? "Generating..." : "Generate with AI"}
                </button>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Assignee for subtasks</div>
                  <select value={subtaskAssigneeId} onChange={e => setSubtaskAssigneeId(Number(e.target.value))} style={{ width: "100%", padding: "6px 8px", border: "1px solid #ddd", borderRadius: 4, fontSize: 12, boxSizing: "border-box", background: "#fff" }}>
                    {users.filter(u => !memberIds || memberIds.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>
                {subtaskItems.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {subtaskItems.map(item => (
                      <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                        <input type="checkbox" checked={item.checked} onChange={() => toggleSubtask(item.id)} style={{ accentColor: "#222" }} />
                        <input value={item.title} onChange={e => updateSubtaskTitle(item.id, e.target.value)} style={{ flex: 1, padding: "6px 8px", border: "1px solid #ddd", borderRadius: 4, fontSize: 12, boxSizing: "border-box", outline: "none" }} />
                      </div>
                    ))}
                    <button onClick={addSelectedSubtasks} style={{ width: "100%", padding: "8px 0", fontSize: 12, border: "1px solid #222", borderRadius: 4, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 600, marginTop: 8, position: "relative", top: 0, boxShadow: "0 2px 0 #000", transition: "all 0.06s ease" }}
                      onMouseEnter={e => { e.currentTarget.style.top = "1px"; e.currentTarget.style.boxShadow = "0 1px 0 #000"; }}
                      onMouseLeave={e => { e.currentTarget.style.top = "0"; e.currentTarget.style.boxShadow = "0 2px 0 #000"; }}>
                      Add selected ({subtaskItems.filter(i => i.checked).length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
