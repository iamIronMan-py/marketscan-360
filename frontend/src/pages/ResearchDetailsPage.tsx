import { useOutletContext } from "react-router-dom";

import type { WorkspacePayload } from "../types/domain";

export function ResearchDetailsPage() {
  const { workspace } = useOutletContext<{ workspace?: WorkspacePayload }>();

  if (!workspace) {
    return <div className="empty-state">Create a company scan to see research details.</div>;
  }

  return (
    <div className="page-stack">
      <section className="hero-card secondary">
        <div>
          <p className="eyebrow">Research depth</p>
          <h3>{workspace.company.name} background R&amp;D</h3>
          <p className="hero-copy">
            This page is focused on what your team can do next with the scraped comments, posts, and source-trace data.
          </p>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-card">
          <strong>Comment provenance</strong>
          <p>Track exactly where feedback came from, which platform produced it, and which post or review URL supports the claim.</p>
        </article>
        <article className="detail-card">
          <strong>AI-assisted analysis</strong>
          <p>Group signals into needs, risk themes, positioning gaps, onboarding friction, proof weakness, and competitor pressure.</p>
        </article>
        <article className="detail-card">
          <strong>What we can do</strong>
          <p>Turn source evidence into an R&D report, pitch narrative, competitor benchmark sheet, and platform-specific improvement plan.</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Research actions</h3>
          <span>Built from live workspace data</span>
        </div>
        <div className="detail-grid">
          {(workspace.researchDetails.pages ?? []).map((page) => (
            <article className="detail-card" key={page.url}>
              <strong>{page.title}</strong>
              <p>{page.metaDescription || "No meta description found."}</p>
              <span>{page.url}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>What we can do</h3>
          <span>Based on crawl-backed R&amp;D</span>
        </div>
        <div className="action-list">
          {(workspace.researchDetails.whatWeCanDo ?? []).map((item) => (
            <article className="action-card" key={item}>
              <strong>{item}</strong>
            </article>
          ))}
          {workspace.signals.map((signal) => (
            <article className="action-card" key={`${signal.platform}-${signal.title}`}>
              <strong>{signal.title}</strong>
              <p>{signal.content}</p>
              <span>{signal.sourceLabel}</span>
              <a href={signal.sourceUrl} rel="noreferrer" target="_blank">
                Open source
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
