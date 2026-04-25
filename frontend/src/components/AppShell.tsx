import { NavLink, Outlet } from "react-router-dom";
import { useEffect } from "react";

import { useAuthStore } from "../hooks/useAuthStore";
import { navGroups } from "../data/navigation";
import { useCompaniesQuery, useWorkspaceQuery } from "../hooks/useWorkspaceQuery";
import { useThemeStore } from "../hooks/useThemeStore";

interface AppShellProps {
  activeSlug: string;
  onSelectCompany: (slug: string) => void;
}

export function AppShell({ activeSlug, onSelectCompany }: AppShellProps) {
  const { mode, toggle } = useThemeStore();
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);
  const { data: companies = [] } = useCompaniesQuery();
  const { data: workspace } = useWorkspaceQuery(activeSlug);
  const navClassName = ({ isActive }: { isActive: boolean }) => `sidebar__item${isActive ? " active" : ""}`;
  const orderedCompanies = [...companies].sort((left, right) => {
    const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0;
    const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0;
    return rightTime - leftTime;
  });

  useEffect(() => {
    if (!activeSlug && orderedCompanies.length > 0) {
      onSelectCompany(orderedCompanies[0].slug);
      return;
    }
    if (activeSlug && orderedCompanies.length > 0 && !orderedCompanies.some((company) => company.slug === activeSlug)) {
      onSelectCompany(orderedCompanies[0].slug);
    }
  }, [activeSlug, onSelectCompany, orderedCompanies]);

  return (
    <div className={`app-shell ${mode}`}>
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="brand-mark">M3</div>
          <p className="eyebrow">Signal workspace</p>
          <h1>MarketScan 360</h1>
          <span>Background R&amp;D, source mapping, crawl-backed findings, heuristic scoring.</span>
        </div>

        {navGroups.map((group) => (
          <div className="sidebar__group" key={group.label}>
            <div className="sidebar__label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink key={item.path} to={item.path} className={navClassName} end={item.path === "/"}>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar__group">
          <div className="sidebar__label">Recent scans</div>
          <div className="company-list">
            {orderedCompanies.length === 0 ? <div className="empty-mini">No scans yet. Start with New scan.</div> : null}
            {orderedCompanies.map((company) => (
              <button
                key={company.slug}
                className={`company-pill ${company.slug === activeSlug ? "is-active" : ""}`}
                onClick={() => onSelectCompany(company.slug)}
                type="button"
              >
                <div>
                  <strong>{company.name}</strong>
                  <span>{company.domain.replace(/\s+/g, "")}</span>
                </div>
                <em>{company.opportunityScore}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar__footer">
          <div className="sidebar__account">
            <small>{user?.email}</small>
            <span>{user?.fullName}</span>
          </div>
          <div className="sidebar__footer-actions">
            <NavLink to="/account" className="sidebar__ghost">
              Account
            </NavLink>
            <button className="sidebar__ghost" onClick={toggle} type="button">
              {mode === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button className="sidebar__logout" onClick={clearSession} type="button">
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace__topbar">
          <div>
            <p className="eyebrow">Active profile</p>
            <h2>{workspace?.company.name ?? "Create a new company scan"}</h2>
          </div>
          <div className="workspace__meta">
            {workspace ? (
              <>
                <span>{workspace.company.domain}</span>
                <span>{workspace.company.industry}</span>
                <span>{workspace.company.headquarters}</span>
              </>
            ) : (
              <span>No background R&amp;D workspace selected yet.</span>
            )}
          </div>
        </header>

        <Outlet context={{ workspace, activeSlug, onSelectCompany }} />
      </main>
    </div>
  );
}
