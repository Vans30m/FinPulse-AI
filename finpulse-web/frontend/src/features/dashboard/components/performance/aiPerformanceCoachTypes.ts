export type CoachRating = "Excellent" | "Good" | "Average" | "Needs Improvement";

export interface CoachScoreBreakdown {
  consistency: number;
  riskAdjustedReturn: number;
  diversification: number;
  growth: number;
}

export interface CoachBenchmarkRow {
  index: string;
  benchmarkReturn: number;
  portfolioReturn: number;
  difference: number;
  outperform: boolean;
}

export interface CoachForecastItem {
  horizon: "Short-term (1M)" | "Medium-term (6M)" | "Long-term (1Y)";
  expectedReturn: number;
  confidence: number;
  bias: "Bullish" | "Neutral" | "Cautious";
}

export interface CoachInsightBucket {
  title: "Performance Strengths" | "Risk Analysis" | "Improvement Suggestions" | "Future Outlook";
  points: string[];
}

export interface AiPerformanceCoachData {
  performanceScore: number;
  rating: CoachRating;
  scoreBreakdown: CoachScoreBreakdown;
  benchmarkRows: CoachBenchmarkRow[];
  topContributors: string[];
  weaknesses: string[];
  missedOpportunities: string[];
  concentrationRisk: string;
  riskObservation: string;
  insights: CoachInsightBucket[];
  forecast: CoachForecastItem[];
}
