import { useQuery } from "@tanstack/react-query";

import { getAuthToken } from "./useAuthStore";
import type { Company, WorkspacePayload } from "../types/domain";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

async function getJson<T>(url: string): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }
  return response.json() as Promise<T>;
}

export function useCompaniesQuery() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: () => getJson<Company[]>(`${API_BASE}/companies`),
    retry: false,
  });
}

export function useWorkspaceQuery(slug: string) {
  return useQuery({
    queryKey: ["workspace", slug],
    queryFn: () => getJson<WorkspacePayload>(`${API_BASE}/companies/${slug}/workspace`),
    enabled: Boolean(slug),
    retry: false,
  });
}
