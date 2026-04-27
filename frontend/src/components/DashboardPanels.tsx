import type { WorkspacePayload } from "../types/domain";

function scoreClass(tone: string) {
  if (tone === "negative" || tone === "critical") return "is-negative";
  if (tone === "positive") return "is-positive";
  return "is-warning";
}

const STEP_DESCRIPTIONS: Record<string, string> = {
  "company-intel": "Pulls firmographics, products, and positioning from the company site.",
  "web-social-crawl": "Crawls the public site and linked social profiles for raw signal.",
  "website-crawl": "Crawls the public site and linked social profiles for raw signal.",
  "review-aggregation": "Queues third-party reviews, comments, and forum mentions for ingestion.",
  "external-source-queue": "Queues third-party reviews, comments, and forum mentions for ingestion.",
  "gap-analysis": "Compares discovered features and copy to flag missing capabilities.",
  "competitor-bench": "Benchmarks the company against named competitors on score and posture.",
  "promo-generation": "Drafts angle/promo copy from the strongest signals found.",
  "pdf-report": "Compiles the full background R&D into an exportable PDF.",
};

const STATUS_COPY: Record<string, string> = {
  done: "Complete",
  active: "In progress",
  idle: "Queued",
};

export function WorkflowStrip({ workflow }: { workflow: WorkspacePayload["workflow"] }) {
  return (
    <section className="workflow-strip" aria-label="Background R&D pipeline">
      {workflow.map((step, index) => {
        const description = STEP_DESCRIPTIONS[step.id] ?? "";
        const statusLabel = STATUS_COPY[step.status] ?? step.status;
        return (
          <article
            key={step.id}
            className={`workflow-step workflow-step--${step.status}`}
            title={description ? `${step.label} — ${statusLabel}. ${description}` : `${step.label} — ${statusLabel}`}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.label}</strong>
            {description ? <small className="workflow-step__desc">{description}</small> : null}
            <em className="workflow-step__status">{statusLabel}</em>
          </article>
        );
      })}
    </section>
  );
}

export function HeroCard({ workspace }: { workspace: WorkspacePayload }) {
  return (
    <section className="hero-card aurora-frame">
      <div>
        <p className="eyebrow">About this company</p>
        <h3>{workspace.company.name}</h3>
        <p className="hero-copy">{workspace.company.summary}</p>
        <div className="tag-row">
          {workspace.company.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="score-orbit">
        <div title="How worth pursuing this lead looks (0–100, higher is better).">
          <small>Opportunity (0–100)</small>
          <strong>{workspace.company.opportunityScore}</strong>
        </div>
        <div title="Overall signal health: site, sources, and sentiment combined (0–100, higher is better).">
          <small>Health (0–100)</small>
          <strong>{workspace.company.healthScore}</strong>
        </div>
      </div>
    </section>
  );
}

export function StatsGrid({ workspace }: { workspace: WorkspacePayload }) {
  return (
    <section className="stats-grid">
      {workspace.summary.stats.map((stat) => (
        <article key={stat.label} className="stat-card">
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
          <em className={scoreClass(stat.tone)}>{stat.delta}</em>
        </article>
      ))}
    </section>
  );
}

export function PlatformGrid({ workspace }: { workspace: WorkspacePayload }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>Sources we found</h3>
        <span>Public pages and social profiles linked from the company site</span>
      </div>
      <div className="platform-grid">
        {workspace.platformLinks.map((item) => (
          <a href={item.url} key={item.platform} className="platform-card" target="_blank" rel="noreferrer">
            <div>
              <strong>{item.label}</strong>
              <span>{item.signalCount} headings extracted</span>
            </div>
            <p>{item.note}</p>
            <em>{item.sourceKind}</em>
          </a>
        ))}
      </div>
    </section>
  );
}

export function SignalFeed({ workspace }: { workspace: WorkspacePayload }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>Recent mentions</h3>
        <span>Comments, reviews, and posts we picked up — each links back to its origin</span>
      </div>
      <div className="signal-feed">
        {workspace.signals.map((signal) => (
          <article key={`${signal.platform}-${signal.title}`} className="signal-card">
            <div className="signal-card__top">
              <strong>{signal.title}</strong>
              <span className={scoreClass(signal.sentiment)}>{signal.sentiment}</span>
            </div>
            <p>{signal.content}</p>
            <div className="signal-card__meta">
              <span>{signal.sourceLabel}</span>
              <span>{signal.authorHandle}</span>
              <span>{signal.engagementCount} engagements</span>
              <span>{signal.publishedLabel}</span>
              <a href={signal.sourceUrl} target="_blank" rel="noreferrer">
                Source
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GapsAndIdeas({ workspace }: { workspace: WorkspacePayload }) {
  return (
    <section className="split-grid">
      <div className="panel">
        <div className="panel__header">
          <h3>Where this company is weak</h3>
          <span>Areas where competitors look stronger (0–100, lower means a bigger gap)</span>
        </div>
        <div className="gap-list">
          {workspace.gaps.map((gap) => (
            <div className="gap-row" key={gap.label}>
              <strong>{gap.label}</strong>
              <div className="gap-row__track">
                <div className={`gap-row__fill ${scoreClass(gap.tone)}`} style={{ width: `${gap.score}%` }} />
              </div>
              <span>{gap.score}</span>
              <em>{gap.benchmark}</em>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Outreach angles</h3>
          <span>Suggested pitches based on what we found, ranked by priority</span>
        </div>
        <div className="idea-list">
          {workspace.promoIdeas.map((idea) => (
            <article key={idea.title} className="idea-card">
              <strong>{idea.title}</strong>
              <span>{idea.priority}</span>
              <p>{idea.rationale}</p>
              <em>{idea.openingLine}</em>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
