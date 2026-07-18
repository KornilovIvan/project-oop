import { useState, useRef, useEffect } from "react";
import { aiGenerateSubtasks, aiImproveDescription, taskApi } from "./api";
import type { TaskRes, UserRes } from "./api";
import { columns, priorityLabels } from "./taskConstants";

export function TaskDetailModal({ task, users, onClose, projectId, userId, memberIds, isAdmin }: { task: TaskRes; users: UserRes[]; onClose: () => void; projectId: number; userId: number; memberIds?: number[]; isAdmin?: boolean }) {
  const [descText, setDescText] = useState(task.description || "");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showAi, setShowAi] = useState(false);
  const [showSubtask, setShowSubtask] = useState(false);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [subtaskItems, setSubtaskItems] = useState<{ id: number; title: string; checked: boolean }[]>([]);
  const [editTitle, setEditTitle] = useState(false);
  const [titleText, setTitleText] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descTimer = useRef<ReturnType<typeof setTimeout>>(null);

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

  const handlePriorityChange = async (priority: number) => {
    try {
      const updated = await taskApi.updatePriority(task.id, priority);
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
        await taskApi.create({ title: item.title, description: "", projectId, createdById: userId, priority: 2 });
      }
      setSubtaskItems([]);
      setShowSubtask(false);
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
      setShowAi(false);
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
        rows={4}
        style={{ width: "100%", padding: 10, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
      />

      {/* Labels separator */}
      <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />

      {/* Metadata */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#444", minWidth: 70, fontWeight: 500 }}>Status</span>
          <span style={{ color: "#ccc" }}>→</span>
          {canChangeStatus ? (
            <select value={task.status} onChange={e => handleStatusChange(Number(e.target.value))} style={{ flex: 1, padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, cursor: "pointer", background: "#fff" }}>
              {columns.map(col => <option key={col.key} value={col.key}>{col.title}</option>)}
            </select>
          ) : (
            <span style={{ flex: 1, padding: "6px 8px" }}>{columns.find(c => c.key === task.status)?.title || "?"}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#444", minWidth: 70, fontWeight: 500 }}>Priority</span>
          <span style={{ color: "#ccc" }}>→</span>
          {canChangeStatus ? (
            <select value={task.priority} onChange={e => handlePriorityChange(Number(e.target.value))} style={{ flex: 1, padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, cursor: "pointer", background: "#fff" }}>
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
              <option value={4}>Critical</option>
            </select>
          ) : (
            <span style={{ flex: 1, padding: "6px 8px" }}>{priorityLabels[task.priority] || "?"}</span>
          )}
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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => { setShowAi(!showAi); }} style={{ padding: "8px 14px", fontSize: 12, border: showAi ? "1px solid #222" : "1px solid #ddd", borderRadius: 8, background: showAi ? "#222" : "transparent", color: showAi ? "#fff" : "#555", cursor: "pointer", transition: "all 0.1s ease", fontWeight: 500 }}>
          ✨ AI
        </button>
        <button onClick={() => { setShowSubtask(!showSubtask); if (!showSubtask) setSubtaskItems([]); }} style={{ padding: "8px 14px", fontSize: 12, border: showSubtask ? "1px solid #222" : "1px solid #ddd", borderRadius: 8, background: showSubtask ? "#222" : "transparent", color: showSubtask ? "#fff" : "#555", cursor: "pointer", transition: "all 0.1s ease", fontWeight: 500 }}>
          Subtasks
        </button>
      </div>

      {aiError && <p style={{ color: "red", fontSize: 13, margin: 0 }}>{aiError}</p>}

      {/* AI panel */}
      {showAi && (
        <div style={{ padding: 16, background: "#f7f7f7", border: "1px solid #e0e0e0", borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: "#333", margin: "0 0 12px", lineHeight: 1.5 }}>Improve description with AI or give custom feedback.</p>
          <button onClick={handleAIApply} disabled={aiLoading} style={{ padding: "8px 16px", fontSize: 12, border: "1px solid #222", borderRadius: 8, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 500, marginBottom: 10, width: "100%" }}>
            {aiLoading ? "Processing..." : "Auto-improve description"}
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              placeholder="Make it shorter, add details..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              style={{ flex: 1, padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
            />
            <button onClick={handleAIRegenerate} disabled={aiLoading || !feedback.trim()} style={{ padding: "8px 14px", fontSize: 12, border: "1px solid #ddd", borderRadius: 8, background: "transparent", color: "#555", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500, opacity: aiLoading || !feedback.trim() ? 0.5 : 1 }}>
              {aiLoading ? "..." : "Apply"}
            </button>
          </div>
        </div>
      )}

      {/* Subtasks */}
      {showSubtask && (
        <div style={{ padding: 16, background: "#f7f7f7", border: "1px solid #e0e0e0", borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: "#333", margin: "0 0 12px", lineHeight: 1.5 }}>
            AI will split this task into 3-5 smaller subtasks. Select which ones to add.
          </p>
          <button onClick={handleSubtask} disabled={subtasksLoading} style={{ padding: "8px 16px", fontSize: 12, border: "1px solid #222", borderRadius: 8, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 500, width: "100%" }}>
            {subtasksLoading ? "Generating..." : "Generate with AI"}
          </button>
          {subtaskItems.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {subtaskItems.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e0e0e0" }}>
                  <input type="checkbox" checked={item.checked} onChange={() => toggleSubtask(item.id)} style={{ accentColor: "#222" }} />
                  <input
                    value={item.title}
                    onChange={e => updateSubtaskTitle(item.id, e.target.value)}
                    style={{ flex: 1, padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <button onClick={addSelectedSubtasks} style={{ padding: "8px 16px", fontSize: 12, border: "1px solid #222", borderRadius: 8, background: "#222", color: "#fff", cursor: "pointer", fontWeight: 500, marginTop: 10, width: "100%" }}>
                Add selected ({subtaskItems.filter(i => i.checked).length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
