import { useEffect, useState } from "react";
import { projectApi } from "./api";
import type { ProjectRes } from "./api";

interface Props {
  userId: number;
  onSelectProject: (projectId: number) => void;
  onLogout: () => void;
}

export function ProjectsPage({ userId, onSelectProject, onLogout }: Props) {
  const [projects, setProjects] = useState<ProjectRes[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => setProjects(await projectApi.list());
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name) return;
    await projectApi.create({ name, description, createdById: userId });
    setName(""); setDescription(""); load();
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Projects</h2>
        <button onClick={onLogout} style={{ padding: "6px 16px", background: "transparent", color: "#999", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>Logout</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input placeholder="Project name" value={name} onChange={e => setName(e.target.value)} style={inp} />
        <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} style={{ ...inp, flex: 1 }} />
        <button onClick={create} style={btn}>Create</button>
      </div>
      {projects.map(p => (
        <div key={p.id} onClick={() => onSelectProject(p.id)} style={{ padding: 16, marginBottom: 8, border: "1px solid #eee", borderRadius: 8, cursor: "pointer", background: "#fafafa" }}>
          <strong>{p.name}</strong>
          {p.description && <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>{p.description}</p>}
        </div>
      ))}
      {projects.length === 0 && <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>No projects yet.</p>}
    </div>
  );
}

const inp: React.CSSProperties = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 15 };
const btn: React.CSSProperties = { padding: "8px 20px", background: "#1677ff", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap" };
