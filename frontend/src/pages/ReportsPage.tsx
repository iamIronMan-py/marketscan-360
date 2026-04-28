import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import { API_BASE, buildApiHeaders } from "../lib/api";
import type { WorkspacePayload } from "../types/domain";

async function exportFile(slug: string, kind: "json" | "csv" | "report" | "report-html") {
  const response = await fetch(`${API_BASE}/companies/${slug}/exports/${kind}`, {
    method: "POST",
    headers: buildApiHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Unable to export ${kind}`);
  }
  return response.json();
}

export function ReportsPage() {
  const { workspace, activeSlug } = useOutletContext<{ workspace?: WorkspacePayload; activeSlug: string }>();
  const [message, setMessage] = useState("No export triggered yet.");

  if (!workspace) {
    return <div className="empty-state">Loading report workspace...</div>;
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
        <button
          onClick={() =>
            exportFile(activeSlug, "report")
              .then((item) => setMessage(`Saved report: ${item.filePath}`))
              .catch((error: Error) => setMessage(error.message))
          }
          type="button"
        >
          Save PDF report
        </button>
        <button
          onClick={() =>
            exportFile(activeSlug, "report-html")
              .then((item) => setMessage(`Saved HTML report: ${item.filePath}`))
              .catch((error: Error) => setMessage(error.message))
          }
          type="button"
        >
          Save HTML report
        </button>
        <button
          onClick={() =>
            exportFile(activeSlug, "json")
              .then((item) => setMessage(`Saved JSON: ${item.filePath}`))
              .catch((error: Error) => setMessage(error.message))
          }
          type="button"
        >
          Save JSON
        </button>
        <button
          onClick={() =>
            exportFile(activeSlug, "csv")
              .then((item) => setMessage(`Saved CSV: ${item.filePath}`))
              .catch((error: Error) => setMessage(error.message))
          }
          type="button"
        >
          Save CSV
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
