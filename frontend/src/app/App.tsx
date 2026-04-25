import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppShell } from "../components/AppShell";
import { useAuthStore } from "../hooks/useAuthStore";
import { AccountPage } from "../pages/AccountPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NewScanPage } from "../pages/NewScanPage";
import { ResearchDetailsPage } from "../pages/ResearchDetailsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { CompaniesPage, CompetitorsPage, GapsPage, PromoPage, SocialIntelPage, SourcesPage } from "../pages/WorkspaceDetailPages";
import { useThemeStore } from "../hooks/useThemeStore";

const queryClient = new QueryClient();
const ACTIVE_SCAN_STORAGE_KEY = "marketscan360.activeSlug";

function RoutedApp() {
  const [activeSlug, setActiveSlug] = useState(() => window.localStorage.getItem(ACTIVE_SCAN_STORAGE_KEY) ?? "");
  const [isReady, setIsReady] = useState(false);
  const hydrate = useThemeStore((state) => state.hydrate);
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    hydrate();
    hydrateAuth();
    setIsReady(true);
  }, [hydrate, hydrateAuth]);

  useEffect(() => {
    if (activeSlug) {
      window.localStorage.setItem(ACTIVE_SCAN_STORAGE_KEY, activeSlug);
      return;
    }
    window.localStorage.removeItem(ACTIVE_SCAN_STORAGE_KEY);
  }, [activeSlug]);

  if (!isReady) {
    return null;
  }

  if (!token) {
    return <LoginPage onLoggedIn={() => setIsReady(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell activeSlug={activeSlug} onSelectCompany={setActiveSlug} />}>
          <Route index element={<DashboardPage />} />
          <Route path="scan" element={<NewScanPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="social" element={<SocialIntelPage />} />
          <Route path="gaps" element={<GapsPage />} />
          <Route path="competitors" element={<CompetitorsPage />} />
          <Route path="promo" element={<PromoPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="research" element={<ResearchDetailsPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="exports" element={<ReportsPage />} />
          <Route path="sources" element={<SourcesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RoutedApp />
    </QueryClientProvider>
  );
}
