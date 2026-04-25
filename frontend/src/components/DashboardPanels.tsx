import type { WorkspacePayload } from "../types/domain";

function scoreClass(tone: string) {
  if (tone === "negative" || tone === "critical") return "is-negative";
  if (tone === "positive") return "is-positive";
  return "is-warning";
}

export function WorkflowStrip({ workflow }: { workflow: WorkspacePayload["workflow"] }) {
  return (
    <section className="workflow-strip">
      {workflow.map((step, index) => (
        <article key={step.id} className={`workflow-step workflow-step--${step.status}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{step.label}</strong>
        </article>
      ))}
    </section>
  );
}

export function HeroCard({ workspace }: { workspace: WorkspacePayload }) {
  return (
    <section className="hero-card aurora-frame">
      <div>
        <p className="eyebrow">Signal command profile</p>
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
        <div>
          <small>Opportunity score</small>
          <strong>{workspace.company.opportunityScore}</strong>
        </div>
        <div>
          <small>Health score</small>
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
        <h3>Source links discovered</h3>
        <span>Crawled pages and official profiles found on the website</span>
      </div>
      <div className="platform-grid">
        {workspace.platformLinks.map((item) => (
          <a href={item.url} key={item.platform} className="platform-card" target="_blank" rel="noreferrer">
            <div>
              <strong>{item.label}</strong>
              <span>{item.signalCount} extracted headings</span>
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
        <h3>Comment origin trail</h3>
        <span>Website-derived findings and discovered social handles</span>
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
          <h3>Product gap matrix</h3>
          <span>Benchmark-aware score view</span>
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
          <h3>AI pitch angles</h3>
          <span>Pitch-ready recommendations</span>
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
