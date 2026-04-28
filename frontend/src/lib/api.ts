import { getAuthToken } from "../hooks/useAuthStore";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

function buildBaseHeaders(): HeadersInit {
  return {
    "ngrok-skip-browser-warning": "true",
  };
}

export function buildApiHeaders(extraHeaders?: HeadersInit): HeadersInit {
  const token = getAuthToken();
  return {
    ...buildBaseHeaders(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders ?? {}),
  };
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: buildApiHeaders(init?.headers),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      throw new Error(data.detail ?? "Request failed");
    }
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
