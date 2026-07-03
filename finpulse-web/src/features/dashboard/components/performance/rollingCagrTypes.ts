export type CagrTimeframe = "1Y" | "3Y" | "5Y" | "10Y" | "MAX";

export type BenchmarkKey = "nifty50" | "sp500" | "nasdaq" | "gold" | "bitcoin";

export interface RollingCagrPoint {
  period: string;
  portfolio: number;
  nifty50: number;
  sp500: number;
  nasdaq: number;
  gold: number;
  bitcoin: number;
}

export interface CagrKpiMetric {
  id: string;
  label: string;
  value: number;
  previous: number;
  sparkline: number[];
}
