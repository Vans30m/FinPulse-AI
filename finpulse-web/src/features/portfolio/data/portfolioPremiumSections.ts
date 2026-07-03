export type WatchlistSnapshotItem = {
  id: string;
  company: string;
  symbol: string;
  price: number;
  dailyChangePercent: number;
  sentiment: "Bullish" | "Neutral" | "Bearish";
  alertLabel?: string;
  sparkline: number[];
  logoInitials: string;
  logoTone: "blue" | "emerald" | "amber" | "rose" | "purple";
};

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

export const watchlistSnapshotItems: WatchlistSnapshotItem[] = [
  {
    id: "nvda-top-gainer",
    company: "NVIDIA",
    symbol: "NVDA",
    price: 875.12,
    dailyChangePercent: 4.28,
    sentiment: "Bullish",
    alertLabel: "Earnings alert",
    sparkline: [842, 846, 850, 861, 858, 867, 872, 875],
    logoInitials: "NV",
    logoTone: "emerald",
  },
  {
    id: "tsla-top-loser",
    company: "Tesla",
    symbol: "TSLA",
    price: 208.43,
    dailyChangePercent: -3.18,
    sentiment: "Bearish",
    sparkline: [221, 219, 216, 214, 211, 209, 207, 208],
    logoInitials: "TS",
    logoTone: "rose",
  },
  {
    id: "aapl-most-watched",
    company: "Apple",
    symbol: "AAPL",
    price: 235.61,
    dailyChangePercent: 1.42,
    sentiment: "Neutral",
    sparkline: [229, 230, 232, 231, 233, 234, 235, 236],
    logoInitials: "AP",
    logoTone: "blue",
  },
  {
    id: "reliance-alert-triggered",
    company: "Reliance Industries",
    symbol: "RELIANCE",
    price: 2870.5,
    dailyChangePercent: 2.06,
    sentiment: "Bullish",
    alertLabel: "Price target hit",
    sparkline: [2755, 2768, 2791, 2810, 2845, 2858, 2864, 2871],
    logoInitials: "RI",
    logoTone: "amber",
  },
];

export const upcomingPortfolioEvents: UpcomingPortfolioEvent[] = [
  {
    id: "apple-earnings",
    company: "Apple",
    symbol: "AAPL",
    eventType: "Earnings",
    eventDate: "Jul 26, 2026",
    countdown: "2 Days Left",
    impact: "High",
    description: "Quarterly release expected to focus on services growth and iPhone demand trends.",
    logoInitials: "AP",
    logoTone: "blue",
  },
  {
    id: "microsoft-dividend",
    company: "Microsoft",
    symbol: "MSFT",
    eventType: "Dividend",
    eventDate: "Jul 30, 2026",
    countdown: "6 Days Left",
    impact: "Low",
    description: "Upcoming dividend confirmation for long-term income holders.",
    logoInitials: "MS",
    logoTone: "emerald",
  },
  {
    id: "tesla-split",
    company: "Tesla",
    symbol: "TSLA",
    eventType: "Stock Split",
    eventDate: "Aug 02, 2026",
    countdown: "9 Days Left",
    impact: "Medium",
    description: "Split discussion is drawing attention from momentum traders and options desks.",
    logoInitials: "TS",
    logoTone: "rose",
  },
  {
    id: "reliance-agm",
    company: "Reliance Industries",
    symbol: "RELIANCE",
    eventType: "AGM",
    eventDate: "Aug 14, 2026",
    countdown: "21 Days Left",
    impact: "High",
    description: "Annual meeting could provide guidance on retail, energy, and digital expansion.",
    logoInitials: "RI",
    logoTone: "amber",
  },
  {
    id: "nvidia-earnings",
    company: "NVIDIA",
    symbol: "NVDA",
    eventType: "Earnings",
    eventDate: "Aug 21, 2026",
    countdown: "28 Days Left",
    impact: "High",
    description: "AI infrastructure demand and guidance will likely set the tone for semis.",
    logoInitials: "NV",
    logoTone: "emerald",
  },
  {
    id: "bitcoin-etf-decision",
    company: "Bitcoin ETF",
    symbol: "BTC",
    eventType: "IPO",
    eventDate: "Aug 28, 2026",
    countdown: "35 Days Left",
    impact: "Medium",
    description: "Decision window for another spot ETF product remains a catalyst for digital assets.",
    logoInitials: "BT",
    logoTone: "purple",
  },
];

export const portfolioAdvisorSnapshot: PortfolioAdvisorSnapshot = {
  score: 84,
  status: "Excellent Portfolio",
  ringLabel: "AI Health Score",
  diversificationScore: 78,
  sectorExposure: "Technology 34%",
  suggestedAllocation: "Increase Healthcare allocation by 8%.",
  diversificationConfidence: 91,
  currentRisk: "Moderate",
  riskLevel: "Balanced",
  riskAction: "Reduce Crypto exposure by 5%.",
  riskConfidence: 88,
  bestOpportunity: "NVIDIA",
  opportunityPrice: 875.12,
  opportunityUpside: 18,
  opportunityConfidence: 92,
  opportunityRating: "Buy",
  strengths: ["US growth exposure", "Strong cash flow positions", "Positive AI momentum"],
  weaknesses: ["Crypto concentration", "Limited healthcare exposure"],
  outlook: "Long-term outlook remains constructive with disciplined rebalancing.",
  healthProgress: 84,
  actions: [
    { id: "rebalance-portfolio", label: "Rebalance Portfolio", icon: "rebalance" },
    { id: "generate-report", label: "Generate AI Report", icon: "report" },
    { id: "view-analysis", label: "View Full Analysis", icon: "analysis" },
    { id: "export-insights", label: "Export AI Insights", icon: "export" },
  ],
};