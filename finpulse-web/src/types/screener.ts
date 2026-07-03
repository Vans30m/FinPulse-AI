// src/types/screener.ts

export interface MacdData {
  line: number;
  signal: number;
  histogram: number;
}

export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TrendData {
  year: number;
  value: number;
}

/**
 * Core model representing a single equity in the data universe with 50+ indicators
 */
export interface StockRecord {
  ticker: string;
  name: string;
  logo: string;
  sector: string;
  industry: string;
  exchange: string;
  country: string;
  currency: string;
  
  // Price & Market
  price: number;
  changePercent: number;
  volume: number;
  relativeVolume: number;
  beta: number;
  marketCap: number; // In Millions (e.g. 2900000 for $2.9T)
  marketCapCategory: 'Mega' | 'Large' | 'Mid' | 'Small' | 'Micro';

  // Valuation
  peRatio: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  pbRatio: number | null;
  psRatio: number | null;
  evEbitda: number | null;

  // Growth & Profitability
  revenueGrowth: number; // YoY %
  epsGrowth: number; // YoY %
  profitMargin: number; // %
  operatingMargin: number; // %
  roe: number | null; // Return on Equity %
  roa: number | null; // Return on Assets %
  roce: number | null; // Return on Capital Employed %

  // Financial Health
  debtToEquity: number | null;
  currentRatio: number | null;
  dividendYield: number | null; // %
  payoutRatio: number | null; // %

  // Technicals
  rsi: number;
  macd: MacdData | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema20: number | null;
  ema50: number | null;
  sma20Dist: number; // % distance
  sma50Dist: number; // % distance
  sma200Dist: number; // % distance
  atr: number | null;
  adx: number | null;
  high52WeekDist: number; // % distance from 52w high
  low52WeekDist: number; // % distance from 52w low

  // AI Insights
  aiScore: number; // 1-100
  aiSignal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  aiSummary: string;
  riskScore: number; // 1-100
  fairValue: number;
  newsSentiment: number; // -1.0 to +1.0
  momentumScore: number; // 1-100
  qualityScore: number; // 1-100
  valuationScore: number; // 1-100
  growthScore: number; // 1-100

  // Sparkline chart data points (e.g. 10 latest closing prices for sparkline preview)
  sparkline: number[];

  // Detailed datasets for drawer
  candlesticks?: CandlestickData[];
  revenueTrend?: TrendData[];
  epsTrend?: TrendData[];
  dividendHistory?: TrendData[];
  peers?: string[];
}

/**
 * Min/Max boundary interface for range sliders
 */
export interface RangeFilter {
  min: number | null;
  max: number | null;
}

/**
 * Global active filter criteria object state
 */
export interface ScreenerFilterState {
  search: string;
  
  // Categorical Filters
  sectors: string[];
  industries: string[];
  exchanges: string[];
  countries: string[];
  marketCapCategories: string[];
  currencies: string[];
  aiSignals: string[];

  // Fundamental Range Filters
  marketCap: RangeFilter;
  price: RangeFilter;
  peRatio: RangeFilter;
  forwardPE: RangeFilter;
  pegRatio: RangeFilter;
  pbRatio: RangeFilter;
  psRatio: RangeFilter;
  evEbitda: RangeFilter;
  revenueGrowth: RangeFilter;
  epsGrowth: RangeFilter;
  profitMargin: RangeFilter;
  operatingMargin: RangeFilter;
  roe: RangeFilter;
  roa: RangeFilter;
  roce: RangeFilter;
  debtToEquity: RangeFilter;
  currentRatio: RangeFilter;
  dividendYield: RangeFilter;
  payoutRatio: RangeFilter;

  // Technical Range Filters
  rsi: RangeFilter;
  volume: RangeFilter;
  relativeVolume: RangeFilter;
  beta: RangeFilter;
  atr: RangeFilter;
  adx: RangeFilter;
  sma20Dist: RangeFilter;
  sma50Dist: RangeFilter;
  sma200Dist: RangeFilter;
  high52WeekDist: RangeFilter;
  low52WeekDist: RangeFilter;

  // AI Range Filters
  aiScore: RangeFilter;
  riskScore: RangeFilter;
  newsSentiment: RangeFilter;
  momentumScore: RangeFilter;
  qualityScore: RangeFilter;
  valuationScore: RangeFilter;
  growthScore: RangeFilter;
}

/**
 * Database schema structure for saving custom user screens
 */
export interface SavedScreenSchema {
  id: string;
  name: string;
  description?: string;
  filters: ScreenerFilterState;
  createdAt: string;
}

/**
 * Integrated internal state for the master Screener Reducer
 */
export interface ScreenerState {
  filters: ScreenerFilterState;
  sortBy: keyof StockRecord;
  sortOrder: 'asc' | 'desc';
}