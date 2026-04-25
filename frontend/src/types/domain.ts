export type Tone = "positive" | "negative" | "neutral" | "warning" | "critical" | "mixed";

export interface Company {
  name: string;
  slug: string;
  domain: string;
  industry: string;
  headquarters: string;
  foundedYear: number;
  summary: string;
  opportunityScore: number;
  healthScore: number;
  tags: string[];
  products: Array<{ name: string; category: string; angle: string }>;
  updatedAt?: string;
}

export interface WorkflowStep {
  id: string;
  label: string;
  status: "done" | "active" | "idle";
}

export interface PlatformLink {
  platform: string;
  label: string;
  url: string;
  sourceKind: string;
  note: string;
  signalCount: number;
  sentimentScore: number;
}

export interface Signal {
  platform: string;
  sourceLabel: string;
  sourceUrl: string;
  signalType: string;
  sentiment: Tone;
  sentimentScore: number;
  authorHandle: string;
  title: string;
  content: string;
  engagementCount: number;
  tags: string[];
  publishedLabel: string;
}

export interface GapItem {
  label: string;
  score: number;
  benchmark: string;
  tone: Tone;
}

export interface PromoIdea {
  title: string;
  priority: string;
  rationale: string;
  openingLine: string;
}

export interface Competitor {
  name: string;
  domain: string;
  benchmarkScore: number;
  strengths: string[];
  sourceType?: string;
}

export interface WorkspacePayload {
  company: Company;
  workflow: WorkflowStep[];
  summary: {
    stats: Array<{ label: string; value: string; delta: string; tone: Tone }>;
    hashtags: string[];
    last_updated: string;
    platform_summary: PlatformLink[];
  };
  platformLinks: PlatformLink[];
  signals: Signal[];
  gaps: GapItem[];
  promoIdeas: PromoIdea[];
  competitors: Competitor[];
  researchDetails: {
    pages?: Array<{
      title: string;
      url: string;
      metaDescription: string;
      headings: string[];
      ctas: string[];
      socialLinks?: Array<{ platform: string; label: string; url: string }>;
    }>;
    opportunities?: string[];
    whatWeCanDo?: string[];
    companyIntel?: Record<string, string | number | boolean>;
    socialProfiles?: Array<{ platform: string; label: string; url: string }>;
    profileSnapshots?: Array<{
      platform: string;
      url: string;
      title: string;
      description: string;
      snippets: string[];
      sentiment: Tone;
      sentimentScore: number;
    }>;
    analysisMode?: string;
    limitations?: string[];
  };
}
