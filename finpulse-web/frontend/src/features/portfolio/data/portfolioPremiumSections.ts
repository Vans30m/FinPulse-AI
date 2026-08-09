

export type UpcomingPortfolioEvent = {
  id: string;
  company: string;
  symbol: string;
  eventType: "Earnings" | "Dividend" | "Stock Split" | "AGM" | "IPO";
  eventDate: string;
  countdown: string;
  impact: "High" | "Medium" | "Low";
  description: string;
  logoInitials: string;
  logoTone: "blue" | "emerald" | "amber" | "rose" | "purple";
};

export type PortfolioAdvisorAction = {
  id: string;
  label: string;
  icon: "rebalance" | "report" | "analysis" | "export";
};

export type PortfolioAdvisorSnapshot = {
  score: number;
  status: string;
  ringLabel: string;
  diversificationScore: number;
  sectorExposure: string;
  suggestedAllocation: string;
  diversificationConfidence: number;
  currentRisk: string;
  riskLevel: string;
  riskAction: string;
  riskConfidence: number;
  bestOpportunity: string;
  opportunityPrice: number;
  opportunityUpside: number;
  opportunityConfidence: number;
  opportunityRating: string;
  strengths: string[];
  weaknesses: string[];
  outlook: string;
  healthProgress: number;
  actions: PortfolioAdvisorAction[];
};


export const upcomingPortfolioEvents: UpcomingPortfolioEvent[] = [];
export const portfolioAdvisorSnapshot: PortfolioAdvisorSnapshot = {
  score: 0,
  status: 'Loading',
  ringLabel: '—',
  diversificationScore: 0,
  sectorExposure: 'Loading...',
  suggestedAllocation: 'Loading...',
  diversificationConfidence: 0,
  currentRisk: 'Loading...',
  riskLevel: 'Loading...',
  riskAction: 'Loading...',
  riskConfidence: 0,
  bestOpportunity: 'Loading...',
  opportunityPrice: 0,
  opportunityUpside: 0,
  opportunityConfidence: 0,
  opportunityRating: 'Loading...',
  strengths: [],
  weaknesses: [],
  outlook: 'Loading...',
  healthProgress: 0,
  actions: []
};