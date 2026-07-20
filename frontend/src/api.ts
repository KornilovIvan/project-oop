const BASE = "http://localhost:5010/api";

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
}

export function getApiKey(): string {
  return localStorage.getItem("apiKey") || "";
}

export function setApiKey(key: string) {
  if (key) localStorage.setItem("apiKey", key);
  else localStorage.removeItem("apiKey");
}

async function callDeepSeek(prompt: string, maxTokens = 300): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("API key not set. Add it in Profile.");

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export function generateAIDescription(title: string) {
  return callDeepSeek(`Напиши короткое описание задачи (2-3 предложения) на русском языке для: "${title}". Ответь только описанием, без лишнего текста.`, 150);
}

export function aiGenerateSubtasks(title: string, description: string) {
  return callDeepSeek(`Разбей задачу на подзадачи. Название: "${title}". Описание: "${description}". Напиши список из 3-5 пунктов, каждый с новой строки, начиная с "- ". Без лишнего текста.`, 500);
}

export function aiImproveDescription(title: string, description: string) {
  return callDeepSeek(`Улучши описание задачи. Название: "${title}". Текущее описание: "${description || "(пусто)"}". Напиши улучшенное описание на русском (2-3 предложения). Только описание, без лишнего текста.`);
}

export function aiRegenerateWithFeedback(title: string, description: string, feedback: string) {
  return callDeepSeek(`Задача: "${title}". Текущее описание: "${description || "(пусто)"}". Пользователь хочет: "${feedback}". Напиши улучшенное описание на русском (2-3 предложения). Только описание, без лишнего текста.`);
}

async function req<T>(url: string, body?: unknown, method?: string): Promise<T> {
  const requestMethod = method || (body ? "POST" : "GET");
  const r = await fetch(BASE + url, {
    method: requestMethod,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(localStorage.getItem("accessToken")
        ? { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401) {
    const hadToken = !!localStorage.getItem("accessToken");
    localStorage.clear();
    if (hadToken) {
      window.location.reload();
    }
    throw new Error("Session expired");
  }
  if (!r.ok) {
    const response = await r.json().catch(() => null) as { error?: string } | null;
    throw new Error(response?.error || r.statusText);
  }
  if (r.status === 204) return undefined as T;
  return r.json();
}

export type UserRes = { id: number; username: string; email: string }
export type ProjectRes = {
  id: number;
  name: string;
  description: string;
  createdById: number;
  memberIds: number[];
  adminIds: number[];
  invitedUserIds: number[];
}
export type TaskRes = { id: number; title: string; description: string; projectId: number; assigneeId: number; status: number; priority: number; createdById: number }

export type TaskWithProject = TaskRes & { projectName: string }

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    req<UserRes>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    req<{ token: string; user: UserRes }>("/auth/login", data),
};

export const userApi = {
  list: () => req<UserRes[]>("/users"),
};

export type InvitationRes = {
  id: number;
  projectId: number;
  projectName: string;
  invitedById: number;
  invitedByUsername: string;
  createdAt: string;
}

export const projectApi = {
  list: () => req<ProjectRes[]>("/projects"),
  create: (data: { name: string; description: string; createdById: number }) =>
    req<ProjectRes>("/projects", data),
  get: async (projectId: number) => {
    const projects = await req<ProjectRes[]>("/projects");
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error("Project not found");
    return project;
  },
  addMember: (projectId: number, userId: number) =>
    req<ProjectRes>(`/projects/${projectId}/members/${userId}`, {}),
  removeMember: (projectId: number, userId: number) =>
    req<void>(`/projects/${projectId}/members/${userId}`, undefined, "DELETE"),
  delete: (projectId: number) =>
    req<void>(`/projects/${projectId}`, undefined, "DELETE"),
  inviteMember: (projectId: number, userId: number) =>
    req<InvitationRes>(`/projects/${projectId}/invitations`, { userId }),
  listInvitations: () => req<InvitationRes[]>("/invitations"),
  listProjectInvitations: (projectId: number) => req<number[]>(`/projects/${projectId}/invitations`),
  acceptInvitation: (invitationId: number) =>
    req<ProjectRes>(`/invitations/${invitationId}/accept`, {}),
  rejectInvitation: (invitationId: number) =>
    req<void>(`/invitations/${invitationId}/reject`, undefined, "POST"),
};

export const taskApi = {
  list: (projectId: number) => req<TaskRes[]>(`/projects/${projectId}/tasks`),
  create: (data: { title: string; description: string; projectId: number; createdById: number; priority: number; assigneeId?: number }) =>
    req<TaskRes>("/tasks", data),
  assign: (taskId: number, assigneeId: number) =>
    req<TaskRes>(`/tasks/${taskId}/assignee`, { assigneeId }),
  changeStatus: (taskId: number, data: { status: number }) =>
    req<TaskRes>(`/tasks/${taskId}/status`, data),
  delete: (taskId: number) =>
    req<void>(`/tasks/${taskId}`, undefined, "DELETE"),
  updateTitle: (taskId: number, title: string) =>
    req<TaskRes>(`/tasks/${taskId}/title`, { title }),
  updateDescription: (taskId: number, description: string) =>
    req<TaskRes>(`/tasks/${taskId}/description`, { description }),
  updatePriority: (taskId: number, priority: number) =>
    req<TaskRes>(`/tasks/${taskId}/priority`, { priority }),
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
