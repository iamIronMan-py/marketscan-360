import { useOutletContext } from "react-router-dom";

import type { WorkspacePayload } from "../types/domain";

interface GenericPageProps {
  title: string;
  description: string;
  items: Array<{ title: string; body: string; meta?: string }>;
}

export function GenericPage({ title, description, items }: GenericPageProps) {
  const { workspace } = useOutletContext<{ workspace?: WorkspacePayload }>();

  return (
    <div className="page-stack">
      <section className="hero-card secondary">
        <div>
          <p className="eyebrow">{workspace?.company.name ?? "Workspace"}</p>
          <h3>{title}</h3>
          <p className="hero-copy">{description}</p>
        </div>
      </section>

      <section className="info-grid">
        {items.map((item) => (
          <article className="info-card" key={item.title}>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            {item.meta ? <span>{item.meta}</span> : null}
          </article>
        ))}
      </section>
    </div>
  );
}
