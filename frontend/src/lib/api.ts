const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface Risk {
  id: string;
  risk_type: string;
  severity: "critical" | "high" | "medium" | "low";
  score: number;
  description: string;
  predicted_at: string;
  resolved: boolean;
  evidence_node_ids?: string[];
}

export interface Alert {
  alert_id: string;
  severity: "critical" | "high" | "medium" | "low";
  alert_type: string;
  explanation: string;
  timestamp: string;
  acknowledged?: boolean;
}

export interface GraphNode {
  id: string;
  label?: string;
  node_type: string;
  title?: string;
  name?: string;
  description?: string;
  created_at?: string;
  outcome?: string;
  decision_type?: string;
  role?: string;
  team?: string;
  expertise_domains?: string[];
  severity?: string;
  score?: number;
}

export interface AgentStatus {
  agent_id: string;
  name: string;
  status: "running" | "stopped" | "error";
  last_heartbeat?: string;
}

export interface SimulationRequest {
  scenario_name: string;
  decision_node_ids: string[];
  parameters: {
    architecture_complexity: "low" | "medium" | "high";
    team_size: number;
  };
}

export interface SimulationResult {
  job_id: string;
  status: "queued" | "running" | "completed" | "failed";
  scenario_name?: string;
  outcomes?: Record<string, unknown>;
  confidence_interval?: number;
  error?: string;
}

export interface SearchResult {
  id: string;
  node_type: string;
  title?: string;
  name?: string;
  score?: number;
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function getRisks(
  params?: { severity?: string; resolved?: boolean },
  token?: string,
): Promise<Risk[]> {
  return apiFetch<Risk[]>(`/api/risks${buildQuery(params)}`, undefined, token);
}

export function getAlerts(
  params?: { severity?: string; acknowledged?: boolean },
  token?: string,
): Promise<Alert[]> {
  return apiFetch<Alert[]>(`/api/alerts${buildQuery(params)}`, undefined, token);
}

export function acknowledgeAlert(id: string, token?: string): Promise<void> {
  return apiFetch<void>(`/api/alerts/${id}/acknowledge`, { method: "POST" }, token);
}

export function getGraphNodes(
  params?: { node_type?: string; limit?: number; offset?: number },
  token?: string,
): Promise<{ nodes: GraphNode[]; total: number }> {
  return apiFetch<{ nodes: GraphNode[]; total: number }>(
    `/api/graph/nodes${buildQuery(params)}`,
    undefined,
    token,
  );
}

export function searchGraph(query: string, token?: string): Promise<SearchResult[]> {
  return apiFetch<SearchResult[]>(`/api/graph/search${buildQuery({ query })}`, undefined, token);
}

export function getAgentStatus(token?: string): Promise<AgentStatus[]> {
  return apiFetch<AgentStatus[]>("/api/agents/status", undefined, token);
}

export function startSimulation(body: SimulationRequest, token?: string): Promise<{ job_id: string }> {
  return apiFetch<{ job_id: string }>("/api/simulate", {
    method: "POST",
    body: JSON.stringify(body),
  }, token);
}

export function getSimulation(jobId: string, token?: string): Promise<SimulationResult> {
  return apiFetch<SimulationResult>(`/api/simulate/${jobId}`, undefined, token);
}
