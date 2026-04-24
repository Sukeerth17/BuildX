import type { Finding, Summary, TrendPoint, FrameworkScores } from "../store/useStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("compliance_token");
}

async function parseError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return response.statusText;
    try {
      const json = JSON.parse(text);
      return json?.detail ?? text;
    } catch {
      return text;
    }
  } catch {
    return response.statusText;
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}, withAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (withAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const detail = await parseError(response);
    throw new Error(`Request failed (${response.status}): ${detail}`);
  }

  return response.json() as Promise<T>;
}

export const login = async (username: string, _password: string) => {
  return apiRequest<{ access_token: string; token_type: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password: _password }),
  });
};

export const getFindings = async (filters?: {
  severity?: string;
  status?: string;
  repo?: string;
  framework?: string;
}): Promise<Finding[]> => {
  const params = new URLSearchParams();
  if (filters?.severity) params.set("severity", filters.severity);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.repo) params.set("repo", filters.repo);
  if (filters?.framework) params.set("framework", filters.framework);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<Finding[]>(`/api/v1/findings${query}`);
};

export const getSummary = async (): Promise<Summary> => {
  return apiRequest<Summary>("/api/v1/findings/summary");
};

export const getTrend = async (): Promise<TrendPoint[]> => {
  return apiRequest<TrendPoint[]>("/api/v1/findings/trend");
};

export const getFrameworks = async (): Promise<FrameworkScores> => {
  return apiRequest<FrameworkScores>("/api/v1/frameworks");
};

export const getSnapshots = async () => {
  return apiRequest<any[]>("/api/v1/frameworks/snapshots");
};

export const updateFindingStatus = async (id: number, status: string) => {
  return apiRequest<Finding>(
    `/api/v1/findings/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
    true,
  );
};

export const generateAuditReport = async (_startDate: string, _endDate: string) => {
  const response = await fetch(`${API_BASE}/api/v1/audit/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ start_date: _startDate, end_date: _endDate }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to generate report (${response.status}): ${body || response.statusText}`);
  }

  return response.blob();
};

export const streamAIChat = async function* (message: string) {
  const response = await fetch(`${API_BASE}/api/v1/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const detail = await parseError(response);
    throw new Error(`AI chat failed (${response.status}): ${detail}`);
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      yield decoder.decode(value, { stream: true });
    }
  }
};
