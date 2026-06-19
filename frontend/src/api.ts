const BASE = "http://localhost:5010/api";

async function req<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(BASE + url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || r.statusText);
  }
  return r.json();
}

export type UserRes = { id: number; username: string; email: string; role: number }
export type ProjectRes = { id: number; name: string; description: string; createdById: number }
export type TaskRes = { id: number; title: string; description: string; projectId: number; assigneeId: number; status: number; priority: number; createdById: number }

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
