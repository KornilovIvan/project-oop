const BASE = "http://localhost:5010/api";

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
}

async function req<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(BASE + url, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(localStorage.getItem("accessToken")
        ? { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const response = await r.json().catch(() => null) as { error?: string } | null;
    throw new Error(response?.error || r.statusText);
  }
  return r.json();
}

export type UserRes = { id: number; username: string; email: string; role: number }
export type ProjectRes = { id: number; name: string; description: string; createdById: number }
export type TaskRes = { id: number; title: string; description: string; projectId: number; assigneeId: number; status: number; priority: number; createdById: number }

export type TaskWithProject = TaskRes & { projectName: string }

export const authApi = {
  register: (data: { username: string; email: string; password: string; role: number }) =>
    req<UserRes>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    req<{ token: string; user: UserRes }>("/auth/login", data),
};

export const projectApi = {
  list: () => req<ProjectRes[]>("/projects"),
  create: (data: { name: string; description: string; createdById: number }) =>
    req<ProjectRes>("/projects", data),
};

export const taskApi = {
  list: (projectId: number) => req<TaskRes[]>(`/projects/${projectId}/tasks`),
  create: (data: { title: string; description: string; projectId: number; createdById: number; priority: number }) =>
    req<TaskRes>("/tasks", data),
  changeStatus: (taskId: number, data: { status: number; actorId: number }) =>
    req<TaskRes>(`/tasks/${taskId}/status`, data),
};

export async function getAllTasks(): Promise<TaskWithProject[]> {
  const projects = await projectApi.list();
  const all = await Promise.all(
    projects.map(async p => {
      const tasks = await taskApi.list(p.id);
      return tasks.map(t => ({ ...t, projectName: p.name }));
    })
  );
  return all.flat();
}
