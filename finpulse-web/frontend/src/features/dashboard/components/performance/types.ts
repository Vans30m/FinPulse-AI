export type HeatmapAssetFilter =
  | "Entire Portfolio"
  | "Stocks"
  | "ETFs"
  | "Mutual Funds"
  | "Crypto"
  | "International"
  | "Domestic";

export type HeatmapRange = 365 | 180 | 90 | 30;

export interface DayContributor {
  symbol: string;
  contribution: number;
}

export interface DailyPerformancePoint {
  date: string;
  year: number;
  month: number;
  day: number;
  weekday: number;
  assetClass: Exclude<HeatmapAssetFilter, "Entire Portfolio">;
  portfolioReturn: number;
  benchmarkReturn: number;
  differenceVsBenchmark: number;
  portfolioValue: number;
  profitLoss: number;
  realizedProfitLoss: number;
  unrealizedProfitLoss: number;
  tradingVolume: number;
  isTradingDay: boolean;
  topContributor: DayContributor;
  worstPerformer: DayContributor;
  assetsResponsible: string[];
  aiSummary: string;
}

export interface HeatmapSummaryMetrics {
  bestDay: DailyPerformancePoint | null;
  worstDay: DailyPerformancePoint | null;
  avgDailyReturn: number;
  positiveDays: number;
  negativeDays: number;
  winningPercentage: number;
  longestWinningStreak: number;
  longestLosingStreak: number;
}
