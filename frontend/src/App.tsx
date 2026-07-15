import { useState } from "react";
import { LoginPage } from "./LoginPage";
import { DashboardPage } from "./DashboardPage";
import { ProjectsPage } from "./ProjectsPage";
import { TasksPage } from "./TasksPage";
import { ProfilePage } from "./ProfilePage";
import { ProjectSidebar } from "./ProjectSidebar";

type Page =
  | { name: "login" }
  | { name: "dashboard"; userId: number; username: string }
  | { name: "projects"; userId: number; username: string }
  | { name: "tasks"; projectId: number; userId: number; username: string }
  | { name: "profile"; userId: number; username: string; email: string };

function getSession(): { userId: number; username: string; email: string } | null {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return {
      userId: Number(p.nameid || p.sub || 0),
      username: p.unique_name || p.name || "",
      email: p.email || "",
    };
  } catch { localStorage.removeItem("accessToken"); return null; }
}

function initPage(): Page {
  const s = getSession();
  if (!s) return { name: "login" };
  const saved = localStorage.getItem("page");
  if (saved === "tasks") { const pid = localStorage.getItem("projectId"); if (pid) return { name: "tasks", projectId: Number(pid), userId: s.userId, username: s.username }; }
  return { name: "dashboard", userId: s.userId, username: s.username };
}

const nav = (setPage: React.Dispatch<React.SetStateAction<Page>>, p: Page) => {
  setPage(p);
  if (p.name === "tasks") { localStorage.setItem("page", "tasks"); localStorage.setItem("projectId", String(p.projectId)); }
  else if (p.name === "projects") localStorage.setItem("page", "projects");
  else localStorage.removeItem("page");
};

function App() {
  const [page, setPage] = useState<Page>(initPage);
  const [showProjects, setShowProjects] = useState(false);

  const s = (): NonNullable<ReturnType<typeof getSession>> => {
    const session = getSession();
    if (!session) { localStorage.clear(); setPage({ name: "login" }); throw new Error("Session expired"); }
    return session;
  };

  const currentProjectId = page.name === "tasks" ? page.projectId : null;

  const toggleProjects = () => setShowProjects(prev => !prev);

  const handleSelectProject = (pid: number) => {
    setShowProjects(false);
    nav(setPage, { name: "tasks", projectId: pid, userId: s().userId, username: s().username });
  };

  if (page.name === "login") return <LoginPage onLogin={() => { const session = s(); nav(setPage, { name: "dashboard", userId: session.userId, username: session.username }); }} />;

  return (
    <>
      {page.name === "tasks" && (
        <TasksPage projectId={page.projectId} userId={page.userId} username={page.username} onBack={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} onDashboard={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} onProjects={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} onProfile={() => nav(setPage, { name: "profile", userId: s().userId, username: s().username, email: s().email })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} onMenuToggle={toggleProjects} />
      )}
      {page.name === "profile" && (
        <ProfilePage username={page.username} email={page.email} onBack={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} onDashboard={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} onProjects={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} onMenuToggle={toggleProjects} />
      )}
      {page.name === "projects" && (
        <ProjectsPage userId={page.userId} username={page.username} onSelectProject={pid => nav(setPage, { name: "tasks", projectId: pid, userId: page.userId, username: s().username })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} onProfile={() => nav(setPage, { name: "profile", userId: s().userId, username: s().username, email: s().email })} onDashboard={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} onMenuToggle={toggleProjects} />
      )}
      {page.name === "dashboard" && (
        <DashboardPage userId={page.userId} username={page.username} onSelectProject={handleSelectProject} onProfile={() => nav(setPage, { name: "profile", userId: s().userId, username: s().username, email: s().email })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} onMenuToggle={toggleProjects} />
      )}

      {page.name === "dashboard" || page.name === "tasks" || page.name === "profile" || page.name === "projects" ? (
        <ProjectSidebar
          show={showProjects}
          onClose={() => setShowProjects(false)}
          currentProjectId={currentProjectId}
          onSelectProject={handleSelectProject}
          userId={page.userId}
        />
      ) : null}
    </>
  );
}

export default App;
