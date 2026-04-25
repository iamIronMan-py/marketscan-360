import { useOutletContext } from "react-router-dom";

import { GapsAndIdeas, HeroCard, PlatformGrid, SignalFeed, StatsGrid, WorkflowStrip } from "../components/DashboardPanels";
import type { WorkspacePayload } from "../types/domain";

export function DashboardPage() {
  const { workspace } = useOutletContext<{ workspace?: WorkspacePayload }>();

  if (!workspace) {
    return <div className="empty-state">No company loaded yet. Go to New scan and enter a company or domain to build the research workspace.</div>;
  }

  return (
    <div className="page-stack">
      <WorkflowStrip workflow={workspace.workflow} />
      <HeroCard workspace={workspace} />
      <StatsGrid workspace={workspace} />
      <div className="split-grid">
        <PlatformGrid workspace={workspace} />
        <SignalFeed workspace={workspace} />
      </div>
      <GapsAndIdeas workspace={workspace} />
    </div>
  );
}
