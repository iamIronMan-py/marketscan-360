import { FormEvent, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { getAuthToken } from "../hooks/useAuthStore";
import { useSnackbarStore } from "../hooks/useSnackbarStore";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

export function NewScanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSelectCompany } = useOutletContext<{ onSelectCompany: (slug: string) => void }>();
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const showSnack = useSnackbarStore((state) => state.show);
  const note = "Enter a company name or domain to generate a new background R&D workspace.";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) {
      showSnack("Enter a company name or domain first.", "error");
      return;
    }
    setSubmitting(true);
    showSnack(`Generating workspace for ${query.trim()}…`, "info", { sticky: true });
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/scans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      if (!response.ok) {
        showSnack(data.detail ?? "Unable to create scan.", "error");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      await queryClient.invalidateQueries({ queryKey: ["workspace", data.companySlug] });
      onSelectCompany(data.companySlug);
      showSnack(`Workspace ready for ${data.companySlug}.`, "success");
      navigate("/");
    } catch (error) {
      showSnack(error instanceof Error ? error.message : "Unable to reach scan API.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-card secondary">
        <div>
          <p className="eyebrow">Background R&D</p>
          <h3>New scan</h3>
          <p className="hero-copy">
            Create a fresh company workspace from a name or domain. This builds the crawl-backed research shell: sources, gaps, competitor posture, and export-ready findings.
          </p>
        </div>
      </section>

      <section className="scan-studio">
        <form className="scan-form" onSubmit={handleSubmit}>
          <label>
            Company or domain
            <input
              type="text"
              placeholder="example.com or Example Company"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Generating…" : "Generate research workspace"}
          </button>
        </form>

        <div className="scan-note">{note}</div>
      </section>
    </div>
  );
}
