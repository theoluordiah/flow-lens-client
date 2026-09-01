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

export interface Report {
  scores: ReportScores;
  strengths: string[];
  improvements: string[];
  summary: string;
}

export interface GetAnalysisResponse {
  report: Report;
  repoStats: Stats;
  createdAt: string;
}

export interface PostAnalysisResponse {
  report: Report;
  repoStats: Stats;
  cached: boolean;
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
