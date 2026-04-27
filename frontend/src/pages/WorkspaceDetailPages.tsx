import { useOutletContext } from "react-router-dom";

import type { WorkspacePayload } from "../types/domain";

function useWorkspace() {
  return useOutletContext<{ workspace?: WorkspacePayload }>().workspace;
}

export function CompaniesPage() {
  const workspace = useWorkspace();
  if (!workspace) return <div className="empty-state">Run a scan to see company and product details.</div>;

  return (
    <div className="page-stack">
      <section className="hero-card secondary">
        <div>
          <p className="eyebrow">About this company</p>
          <h3>{workspace.company.name}</h3>
          <p className="hero-copy">{workspace.company.summary}</p>
        </div>
      </section>
      <section className="info-grid">
        {workspace.company.products.map((product) => (
          <article className="info-card" key={product.name}>
            <strong>{product.name}</strong>
            <p>{product.category}</p>
            <span>{product.angle}</span>
          </article>
        ))}
      </section>
      <section className="detail-grid">
        {Object.entries(workspace.researchDetails.companyIntel ?? {}).map(([key, value]) => (
          <article className="detail-card" key={key}>
            <strong>{key}</strong>
            <p>{String(value)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export function SocialIntelPage() {
  const workspace = useWorkspace();
  if (!workspace) return <div className="empty-state">Run a scan to see source and comment details.</div>;

  return (
    <div className="page-stack">
      <section className="detail-grid">
        {(workspace.researchDetails.socialProfiles ?? []).length === 0 ? (
          <article className="detail-card">
            <strong>No official social profiles found on the website</strong>
            <p>The crawler checked website links but did not find public social profile URLs embedded on the site.</p>
          </article>
        ) : null}
        {(workspace.researchDetails.socialProfiles ?? []).map((profile) => (
          <article className="detail-card" key={profile.url}>
            <strong>{profile.platform}</strong>
            <p>{profile.label}</p>
            <a href={profile.url} target="_blank" rel="noreferrer">
              Open profile
            </a>
          </article>
        ))}
      </section>
      <section className="panel">
        <div className="panel__header">
          <h3>Profile previews</h3>
          <span>What we read off public profile pages, with a quick sentiment read</span>
        </div>
        <div className="action-list">
          {(workspace.researchDetails.profileSnapshots ?? []).map((snapshot) => (
            <article className="action-card" key={snapshot.url}>
              <strong>{snapshot.title}</strong>
              <p>{snapshot.description || "No profile description was exposed publicly on the fetched page."}</p>
              <span>{snapshot.platform} · {snapshot.sentiment} · {snapshot.sentimentScore}</span>
              <a href={snapshot.url} target="_blank" rel="noreferrer">
                Open profile
              </a>
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel__header">
          <h3>Mentions with origin links</h3>
          <span>{workspace.researchDetails.analysisMode ?? "From the live crawl and queued external sources"}</span>
        </div>
        <div className="action-list">
          {workspace.signals.map((signal) => (
            <article className="action-card" key={`${signal.platform}-${signal.title}`}>
              <strong>{signal.title}</strong>
              <p>{signal.content}</p>
              <span>{signal.sourceLabel}</span>
              <a href={signal.sourceUrl} target="_blank" rel="noreferrer">
                Open source
              </a>
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel__header">
          <h3>What we couldn't get</h3>
          <span>Things the crawler couldn't reach — listed instead of made up</span>
        </div>
        <div className="action-list">
          {(workspace.researchDetails.limitations ?? []).map((item) => (
            <article className="action-card" key={item}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function GapsPage() {
  const workspace = useWorkspace();
  if (!workspace) return <div className="empty-state">Run a scan to see gap analysis.</div>;

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel__header">
          <h3>Where this company is weak</h3>
          <span>Inferred from the site crawl (0–100, lower means a bigger gap)</span>
        </div>
        <div className="gap-list">
          {workspace.gaps.map((gap) => (
            <div className="gap-row" key={gap.label}>
              <strong>{gap.label}</strong>
              <div className="gap-row__track">
                <div className={`gap-row__fill ${gap.tone === "critical" ? "is-negative" : gap.tone === "positive" ? "is-positive" : "is-warning"}`} style={{ width: `${gap.score}%` }} />
              </div>
              <span>{gap.score}</span>
              <em>{gap.benchmark}</em>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function CompetitorsPage() {
  const workspace = useWorkspace();
  if (!workspace) return <div className="empty-state">Run a scan to see competitor benchmarking.</div>;

  return (
    <div className="page-stack">
      <section className="detail-grid">
        {workspace.competitors.map((competitor) => (
          <article className="detail-card" key={competitor.domain}>
            <strong>{competitor.name}</strong>
            <p>{competitor.domain}</p>
            <span>Benchmark score: {competitor.benchmarkScore}</span>
            <p>{competitor.strengths.join(", ")}</p>
            <span>{competitor.sourceType === "mock-benchmark" ? "Mock benchmark reference" : "Collected competitor"}</span>
          </article>
        ))}
      </section>
    </div>
  );
}

export function PromoPage() {
  const workspace = useWorkspace();
  if (!workspace) return <div className="empty-state">Run a scan to see promo ideas.</div>;

  return (
    <div className="page-stack">
      <section className="action-list">
        {workspace.promoIdeas.map((idea) => (
          <article className="action-card" key={idea.title}>
            <strong>{idea.title}</strong>
            <p>{idea.rationale}</p>
            <span>{idea.priority}</span>
            <p>{idea.openingLine}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export function SourcesPage() {
  const workspace = useWorkspace();
  if (!workspace) return <div className="empty-state">Run a scan to see source vault details.</div>;

  return (
    <div className="page-stack">
      <section className="hero-card secondary">
        <div>
          <p className="eyebrow">Source vault</p>
          <h3>Every link the crawler found on the company site</h3>
          <p className="hero-copy">Limited to pages and official profiles linked from the company's own website — nothing third-party.</p>
        </div>
      </section>
      <section className="detail-grid">
        {workspace.platformLinks.map((link) => (
          <article className="detail-card" key={link.url}>
            <strong>{link.label}</strong>
            <p>{link.note}</p>
            <span>{link.sourceKind}</span>
            <span>{link.signalCount > 0 ? `${link.signalCount} collected source record` : "Queued source target"}</span>
            <a href={link.url} target="_blank" rel="noreferrer">
              Open source target
            </a>
          </article>
        ))}
      </section>
    </div>
  );
}
