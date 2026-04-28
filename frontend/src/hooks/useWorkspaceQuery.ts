import { useQuery } from "@tanstack/react-query";

import { API_BASE, fetchJson } from "../lib/api";
import type { Company, WorkspacePayload } from "../types/domain";

export function useCompaniesQuery() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: () => fetchJson<Company[]>(`${API_BASE}/companies`),
    retry: false,
  });
}

export function useWorkspaceQuery(slug: string) {
  return useQuery({
    queryKey: ["workspace", slug],
    queryFn: () => fetchJson<WorkspacePayload>(`${API_BASE}/companies/${slug}/workspace`),
    enabled: Boolean(slug),
    retry: false,
  });
}
