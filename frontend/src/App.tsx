import { useState } from "react";
import { LoginPage } from "./LoginPage";
import { DashboardPage } from "./DashboardPage";
import { TasksPage } from "./TasksPage";
import { ProjectSidebar } from "./ProjectSidebar";

type Page =
  | { name: "login" }
  | { name: "dashboard"; userId: number; username: string }
  | { name: "tasks"; projectId: number; userId: number; username: string };

function getSession(): { userId: number; username: string } | null {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return { userId: Number(p.nameid || p.sub || 0), username: p.unique_name || p.name || "" };
  } catch { localStorage.removeItem("accessToken"); return null; }
}

function initPage(): Page {
  const s = getSession();
  if (!s) return { name: "login" };
  const saved = localStorage.getItem("page");
  if (saved === "tasks") { const pid = localStorage.getItem("projectId"); if (pid) return { name: "tasks", projectId: Number(pid), userId: s.userId, username: s.username }; }
  return { name: "dashboard", userId: s.userId, username: s.username };
}

function getSafeSession(setPage: React.Dispatch<React.SetStateAction<Page>>) {
  const session = getSession();
  if (!session) { localStorage.clear(); setPage({ name: "login" }); return null; }
  return session;
}

const nav = (setPage: React.Dispatch<React.SetStateAction<Page>>, p: Page) => {
  setPage(p);
  if (p.name === "tasks") { localStorage.setItem("page", "tasks"); localStorage.setItem("projectId", String(p.projectId)); }
  else localStorage.removeItem("page");
};

function App() {
  const [page, setPage] = useState<Page>(initPage);
  const [showProjects, setShowProjects] = useState(false);

  const s = () => getSafeSession(setPage);
  const currentProjectId = page.name === "tasks" ? page.projectId : null;

  const toggleProjects = () => setShowProjects(prev => !prev);

  const handleSelectProject = (pid: number) => {
    setShowProjects(false);
    const session = s();
    if (session) nav(setPage, { name: "tasks", projectId: pid, userId: session.userId, username: session.username });
  };

  const handleLogin = () => {
    const session = s();
    if (session) nav(setPage, { name: "dashboard", userId: session.userId, username: session.username });
  };

  const handleLogout = () => { localStorage.clear(); setPage({ name: "login" }); };

  if (page.name === "login") return <LoginPage onLogin={handleLogin} />;

  return (
    <>
      {page.name === "tasks" && (
        <TasksPage projectId={page.projectId} userId={page.userId} username={page.username} onBack={() => { const s2 = s(); if (s2) nav(setPage, { name: "dashboard", userId: s2.userId, username: s2.username }); }} onDashboard={() => { const s2 = s(); if (s2) nav(setPage, { name: "dashboard", userId: s2.userId, username: s2.username }); }} onLogout={handleLogout} onMenuToggle={toggleProjects} />
      )}
      {page.name === "dashboard" && (
        <DashboardPage userId={page.userId} username={page.username} onSelectProject={handleSelectProject} onLogout={handleLogout} onMenuToggle={toggleProjects} />
      )}

      {page.name === "dashboard" || page.name === "tasks" ? (
        <ProjectSidebar show={showProjects} onClose={() => setShowProjects(false)} currentProjectId={currentProjectId} onSelectProject={handleSelectProject} userId={page.userId} />
      ) : null}
    </>
  );
}

export default App;
