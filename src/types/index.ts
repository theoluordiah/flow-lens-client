export interface User {
  _id: string;
  githubId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepoLite {
  id: string;
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  private: boolean;
  htmlUrl: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  hasNextPage: boolean;
}

export interface ListReposResponse {
  repos: RepoLite[];
  pagination: Pagination;
}

export interface Stats {
  commits: number;
  pullRequests: number;
  issues: number;
  contributors: number;
  languages: Record<string, number>;
  weeklyActivity: number[];
  stars: number;
  forks: number;
  openIssues: number;
}

export interface AccountStats extends Stats {
  repoCount: number;
  followers: number;
  languageRepos: Record<string, number>;
}

export interface ReportScores {
  consistency: number;
  codeQuality: number;
  collaboration: number;
  projectActivity: number;
  overall: number;
}

export type ReportTone = "mentor" | "roast" | "hype";

export type ScoreKey = Exclude<keyof ReportScores, "overall">;

export interface Report {
  scores: ReportScores;
  /** How each score was computed from the raw stats. */
  breakdown?: Partial<Record<ScoreKey, string>>;
  /** One-line verdict, used on the share card. */
  headline?: string;
  strengths: string[];
  improvements: string[];
  summary: string;
  /** Plain-language explanation of the weakest area and where to start. */
  focus?: string;
  /** Concrete next steps, each measured against the scoring formula. */
  growthPlan?: GrowthPlan;
}

export interface GrowthStep {
  id: string;
  area: ScoreKey;
  action: string;
  detail: string;
  overallFrom: number;
  overallTo: number;
  changes: { key: ScoreKey; from: number; to: number }[];
}

export interface GrowthPlan {
  weakest: { key: ScoreKey; score: number };
  steps: GrowthStep[];
  combinedOverall: number;
}

export interface GetAnalysisResponse {
  report: Report;
  repoStats: Stats;
  tone: ReportTone;
  createdAt: string;
}

export interface PostAnalysisResponse {
  report: Report;
  repoStats: Stats;
  tone: ReportTone;
  cached: boolean;
}

export interface ShareResponse {
  slug: string;
  cardUrl: string;
  apiUrl: string;
  imageUrl: string;
}

export interface PublicCard {
  user: {
    username: string;
    displayName: string;
    avatarUrl: string;
    profileUrl: string;
  } | null;
  repoFullName: string;
  tone: ReportTone;
  scores: ReportScores;
  breakdown?: Partial<Record<ScoreKey, string>>;
  headline: string;
  strengths: string[];
  improvements: string[];
  topLanguage: string | null;
  weeklyActivity: number[];
  createdAt: string;
}

export interface DashboardResponse {
  developer: User;
  selectedRepository: RepoLite | null;
  stats: Stats;
  report: Report | null;
  reportCreatedAt: string | null;
}

export interface ChatResponse {
  answer: string;
}

export interface ChatRepoContext {
  full_name: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  updatedAt: string;
}

export interface ChatContext {
  owner: string;
  repo: string;
  commits: number;
  pullRequests: number;
  issues: number;
  contributors: number;
  weeklyActivity: number[];
  languageSummary: string;
  repositories: ChatRepoContext[];
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface RepositoryStatsResponse {
  stats: Stats;
}
