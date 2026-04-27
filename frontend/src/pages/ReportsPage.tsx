import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import { getAuthToken } from "../hooks/useAuthStore";
import { useSnackbarStore } from "../hooks/useSnackbarStore";
import type { WorkspacePayload } from "../types/domain";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

async function exportFile(slug: string, kind: "json" | "csv" | "report" | "report-html") {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/companies/${slug}/exports/${kind}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Unable to export ${kind}`);
  }
  return response.json();
}

export function ReportsPage() {
  const { workspace, activeSlug } = useOutletContext<{ workspace?: WorkspacePayload; activeSlug: string }>();
  const [message, setMessage] = useState("No export triggered yet.");
  const [busy, setBusy] = useState<string | null>(null);
  const showSnack = useSnackbarStore((state) => state.show);

  if (!workspace) {
    return <div className="empty-state">Loading report workspace...</div>;
  }

  async function handleExport(kind: "json" | "csv" | "report" | "report-html", label: string) {
    setBusy(kind);
    showSnack(`Generating ${label}…`, "info", { sticky: true });
    try {
      const item = await exportFile(activeSlug, kind);
      const successMessage = `Saved ${label}: ${item.filePath}`;
      setMessage(successMessage);
      showSnack(successMessage, "success");
    } catch (error) {
      const text = error instanceof Error ? error.message : `Unable to save ${label}.`;
      setMessage(text);
      showSnack(text, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-card secondary">
        <div>
          <p className="eyebrow">Local document output</p>
          <h3>Reports and exports</h3>
          <p className="hero-copy">
            Save structured intelligence locally. Files are written by the backend into the workspace storage folders.
          </p>
        </div>
      </section>

      <section className="export-bar">
        <button onClick={() => handleExport("report", "PDF report")} disabled={busy !== null} type="button">
          {busy === "report" ? "Saving…" : "Save PDF report"}
        </button>
        <button onClick={() => handleExport("report-html", "HTML report")} disabled={busy !== null} type="button">
          {busy === "report-html" ? "Saving…" : "Save HTML report"}
        </button>
        <button onClick={() => handleExport("json", "JSON")} disabled={busy !== null} type="button">
          {busy === "json" ? "Saving…" : "Save JSON"}
        </button>
        <button onClick={() => handleExport("csv", "CSV")} disabled={busy !== null} type="button">
          {busy === "csv" ? "Saving…" : "Save CSV"}
        </button>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Export status</h3>
          <span>Local-first storage</span>
        </div>
        <p className="hero-copy">{message}</p>
      </section>
    </div>
  );
}
