export interface UpcomingEarning {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  currency: string;
  marketCap: number;
  price: number;
  change: number;
  changePercent: number;
  earningsDate: string | null;
  estimatedEPS: number | null;
  logo: string;
  summary: string;
  weekHigh52: number;
  weekLow52: number;
  dividendYield?: number;
  peRatio?: number;
  eps?: number;
  website?: string;
  previousEPS?: number | null;
  revenue?: number;
  country: string;
}
