import API_BASE_URL from "../config/api";

export interface FundamentalData {
  symbol?: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  open?: number;
  previousClose?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume?: number;
  averageVolume?: number;
  marketCap?: number;
  circulatingSupply?: number;
  currency?: string;
  marketState?: string;
  peRatio?: number;
  eps?: number;
  performance?: any;
}

export const TIMEFRAME_MAPPS: Record<string, { range: string; interval: string }> = {
  "1m": { range: "1d", interval: "1m" },
  "5m": { range: "5d", interval: "5m" },
  "15m": { range: "5d", interval: "15m" },
  "30m": { range: "5d", interval: "30m" },
  "1h": { range: "1mo", interval: "1h" },
  "4h": { range: "3mo", interval: "1h" },
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "15m" },
  "1M": { range: "30d", interval: "1d" },
  "3M": { range: "90d", interval: "1d" },
  "6M": { range: "180d", interval: "1d" },
  "YTD": { range: "ytd", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "3Y": { range: "3y", interval: "1wk" },
  "5Y": { range: "5y", interval: "1wk" },
  "MAX": { range: "max", interval: "1mo" }
};

export interface AdvancedTimeframeConfig {
  interval: string;
  range: string;
  aggregateType?: "index" | "monthly";
  aggregateFactor?: number;
}

export const ADVANCED_TIMEFRAME_MAPPS: Record<string, AdvancedTimeframeConfig> = {
  "1 min": { interval: "1m", range: "1d" },
  "5 mins": { interval: "5m", range: "5d" },
  "15 mins": { interval: "15m", range: "5d" },
  "30 mins": { interval: "30m", range: "5d" },
  "1 hour": { interval: "1h", range: "3mo" },
  "4 hours": { interval: "1h", range: "6mo", aggregateType: "index", aggregateFactor: 4 },
  "1 day": { interval: "1d", range: "5y" },
  "1 week": { interval: "1wk", range: "max" },
  "1 month": { interval: "1wk", range: "max", aggregateType: "monthly", aggregateFactor: 1 },
  "3 months": { interval: "1wk", range: "max", aggregateType: "monthly", aggregateFactor: 3 }
};

const advancedChartCache = new Map<string, any>();

export function aggregateToMonthly(quotes: any[], monthsPerCandle: number = 1): any[] {
  if (!quotes || !Array.isArray(quotes) || quotes.length === 0) return [];

  const groups = new Map<string, any[]>();
  const groupKeys: string[] = [];

  quotes.forEach((q) => {
    if (!q || !q.date) return;
    const date = new Date(q.date);
    if (isNaN(date.getTime())) return;

    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    
    // Group keys depending on monthsPerCandle
    const periodIndex = Math.floor(month / monthsPerCandle);
    const key = `${year}-${periodIndex}`;

    if (!groups.has(key)) {
      groups.set(key, []);
      groupKeys.push(key);
    }
    groups.get(key)!.push(q);
  });

  const result: any[] = [];
  groupKeys.forEach((key) => {
    const chunk = groups.get(key)!;
    if (chunk.length === 0) return;

    // Sort chunk chronologically just in case
    chunk.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const first = chunk[0];
    const last = chunk[chunk.length - 1];

    let high = -Infinity;
    let low = Infinity;
    let volume = 0;

    chunk.forEach((item) => {
      if (item.high != null && item.high > high) high = item.high;
      if (item.low != null && item.low < low) low = item.low;
      if (item.volume != null) volume += item.volume;
    });

    result.push({
      date: first.date, // Represent the candle at the start of the month/period
      open: first.open,
      high: high === -Infinity ? first.high : high,
      low: low === Infinity ? first.low : low,
      close: last.close,
      volume: volume
    });
  });

  return result;
}

export function aggregateCandles(quotes: any[], factor: number): any[] {
  if (!quotes || !Array.isArray(quotes) || quotes.length === 0) return [];
  if (factor <= 1) return quotes;

  const result: any[] = [];
  for (let i = 0; i < quotes.length; i += factor) {
    const chunk = quotes.slice(i, i + factor);
    if (chunk.length === 0) continue;

    const first = chunk[0];
    const last = chunk[chunk.length - 1];

    let high = -Infinity;
    let low = Infinity;
    let volume = 0;

    chunk.forEach((item) => {
      if (item.high != null && item.high > high) high = item.high;
      if (item.low != null && item.low < low) low = item.low;
      if (item.volume != null) volume += item.volume;
    });

    result.push({
      date: first.date,
      open: first.open,
      high: high === -Infinity ? first.high : high,
      low: low === Infinity ? first.low : low,
      close: last.close,
      volume: volume
    });
  }

  return result;
}

export async function getAdvancedStockCandles(symbol: string, timeframeLabel: string) {
  const config = ADVANCED_TIMEFRAME_MAPPS[timeframeLabel] || { interval: "1d", range: "5y" };
  const cacheKey = `${symbol}-${config.interval}-${config.range}`;

  let rawData: any;
  if (advancedChartCache.has(cacheKey)) {
    rawData = advancedChartCache.get(cacheKey);
  } else {
    const response = await fetch(
      `${API_BASE_URL}/api/charts/${symbol}?range=${config.range}&interval=${config.interval}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chart data: ${response.status}`);
    }

    rawData = await response.json();
    advancedChartCache.set(cacheKey, rawData);
  }

  if (config.aggregateType === "monthly" && rawData?.quotes) {
    return {
      ...rawData,
      quotes: aggregateToMonthly(rawData.quotes, config.aggregateFactor || 1)
    };
  } else if (config.aggregateType === "index" && config.aggregateFactor && rawData?.quotes) {
    return {
      ...rawData,
      quotes: aggregateCandles(rawData.quotes, config.aggregateFactor)
    };
  }

  return rawData;
}

export async function getStockCandles(symbol: string, timeframe: string) {
  // Graceful configuration extraction with fallback safety
  const config = TIMEFRAME_MAPPS[timeframe] || { range: "1y", interval: "1d" };

  const response = await fetch(
    `${API_BASE_URL}/api/charts/${symbol}?range=${config.range}&interval=${config.interval}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch chart data: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch historical close prices for a benchmark symbol.
 * Uses the existing /api/charts/:symbol endpoint.
 * Supports AbortController for request cancellation.
 */
export async function getBenchmarkHistory(
  symbol: string,
  range: string,
  interval: string,
  signal?: AbortSignal
): Promise<{ time: number; close: number }[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/charts/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch benchmark history for ${symbol}: ${response.status}`);
  }

  const data = await response.json();

  // Normalise the response — backend returns {time, open, high, low, close} or {time, value}
  const raw: any[] = Array.isArray(data) ? data : (data.candles ?? data.data ?? []);

  return raw
    .filter((bar: any) => bar && (bar.close !== undefined || bar.value !== undefined))
    .map((bar: any) => ({
      time: typeof bar.time === 'string' ? Math.floor(new Date(bar.time).getTime() / 1000) : Number(bar.time),
      close: bar.close ?? bar.value ?? 0,
    }))
    .filter((bar) => bar.close > 0);
}

// Preserve all previous workspace interfaces untouched
export async function getFundamentals(symbol: string): Promise<FundamentalData> {
  const response = await fetch(`${API_BASE_URL}/api/fundamentals/${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch fundamentals");
  return response.json();
}

export async function getUnifiedAssetDetails(symbol: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/asset-details/${encodeURIComponent(symbol)}`);
  if (!response.ok) throw new Error("Failed to fetch asset details");
  return response.json();
}

export async function searchAssets(query: string) {
  if (!query.trim()) return [];
  const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);
  return response.json();
}

export interface AIMarketBriefData {
  marketMood: "Bullish" | "Neutral" | "Bearish";
  confidence: number;
  riskLevel: "Low" | "Medium" | "High";
  insights: string[];
  sectorStrength: {
    sector: string;
    score: number;
    reason: string;
  }[];
  todayRisk: string;
  summary: string;
  generatedAt: string;
}

export interface AIMarketDriversData {
  question: string;
  analysis: string[];
  macroEvent: {
    title: string;
    impact: "High" | "Medium" | "Low";
    description: string;
  };
  bullishFactors: string[];
  bearishFactors: string[];
  watchNext: string[];
  summary: string;
  generatedAt: string;
}

export async function getAIMarketBrief(): Promise<AIMarketBriefData> {
  const response = await fetch(`${API_BASE_URL}/api/ai/market-brief`);
  if (!response.ok) throw new Error("Failed to fetch AI market brief");
  return response.json();
}

export async function getAIMarketDrivers(): Promise<AIMarketDriversData> {
  const response = await fetch(`${API_BASE_URL}/api/ai/market-drivers`);
  if (!response.ok) throw new Error("Failed to fetch AI market drivers");
  return response.json();
}

export interface AIGlobalMarketPulseData {
  sentiment: "Bullish" | "Neutral" | "Bearish";
  summary: string;
  insights: string[];
  generatedAt: string;
}

export async function getAIGlobalMarketPulse(): Promise<AIGlobalMarketPulseData> {
  const response = await fetch(`${API_BASE_URL}/api/ai/global-market-pulse`);
  if (!response.ok) throw new Error("Failed to fetch AI global market pulse");
  return response.json();
}

export interface AIFearGreedData {
  score: number;
  sentiment: string;
  description: string;
  investorTakeaways: string[];
  risk: string;
  opportunity: string;
  yesterday: number;
  lastWeek: number;
  lastMonth: number;
  generatedAt: string;
}

export async function getAIFearGreed(): Promise<AIFearGreedData> {
  const response = await fetch(`${API_BASE_URL}/api/ai/fear-greed`);
  if (!response.ok) throw new Error("Failed to fetch AI fear and greed index");
  return response.json();
}

export interface AIPickOfTheDayData {
  symbol: string;
  company: string;
  recommendation: string;
  confidence: number;
  aiScore: number;
  currentPrice: number;
  target: number;
  stopLoss: number;
  holdingPeriod: string;
  risk: string;
  summary: string;
  bullishReasons: string[];
  risks: string[];
  generatedAt: string;
}

export async function getAIPickOfTheDay(): Promise<AIPickOfTheDayData> {
  const response = await fetch(`${API_BASE_URL}/api/ai/pick-of-the-day`);
  if (!response.ok) throw new Error("Failed to fetch AI Pick of the Day");
  return response.json();
}

export interface AISectorMomentumData {
  topRally: {
    sector: string;
    days: number;
    momentumScore: number;
    reason: string;
  }[];
  topDecline: {
    sector: string;
    days: number;
    momentumScore: number;
    reason: string;
  }[];
  generatedAt: string;
}

export async function getAISectorMomentum(): Promise<AISectorMomentumData> {
  const response = await fetch(`${API_BASE_URL}/api/ai/sector-momentum`);
  if (!response.ok) throw new Error("Failed to fetch AI sector momentum");
  return response.json();
}

export async function getAISentiment() {
  const response = await fetch(`${API_BASE_URL}/api/news-sentiment/sentiment`);
  return response.json();
}

export async function getMarketExplanation() {
  const response = await fetch(`${API_BASE_URL}/api/market-explanation`);
  return response.json();
}

export async function getStockSentiment(symbol: string) {
  const response = await fetch(`${API_BASE_URL}/api/stock-sentiment/${symbol}`);
  return response.json();
}

export async function getFinancialHealth(symbol: string) {
  const response = await fetch(`${API_BASE_URL}/api/financial-health/${symbol}`);
  return response.json();
}

export async function getTechnicals(symbol: string) {
  const response = await fetch(`${API_BASE_URL}/api/technical/${symbol}`);
  return response.json();
}

export async function getAnalystConsensus(symbol: string) {
  const response = await fetch(`${API_BASE_URL}/api/analyst/${symbol}`);
  return response.json();
}

export async function getCompanyNews(symbol: string) {
  const response = await fetch(`${API_BASE_URL}/api/company-news/${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch company news");
  return response.json();
}

export async function getNewsSentiment(symbol: string) {
  const response = await fetch(`${API_BASE_URL}/api/news-sentiment/${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch news sentiment");
  return response.json();
}

export async function getAIScore(symbol: string) {
  const response = await fetch(`${API_BASE_URL}/api/ai-score/${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch AI score");
  return response.json();
}

export async function fetchGlobalMarkets() {
  const response = await fetch(`${API_BASE_URL}/api/global-markets`);
  return response.json();
}

export async function getMarketHistory(symbol: string, range: string = "1mo") {
  const response = await fetch(`${API_BASE_URL}/api/global-markets/history/${encodeURIComponent(symbol)}?range=${range}`);
  if (!response.ok) throw new Error("Failed to fetch market history");
  return response.json();
}

export async function getMarketScreener(market: string, type: string) {
  const endpoint = market === "india" ? `/api/screener/india?type=${type}` : `/api/screener?market=us&type=${type}`;
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) throw new Error("Failed to fetch screener");
  return response.json();
}

export async function getDomesticScreener(type: string) {
  const response = await fetch(`${API_BASE_URL}/api/screener/india?type=${type}`);
  if (!response.ok) throw new Error("Failed to fetch screener");
  return response.json();
}

export async function getIndexSummary(symbol: string) {
  const response = await fetch(`${API_BASE_URL}/api/index-summary/${encodeURIComponent(symbol)}`);
  if (!response.ok) throw new Error("Failed to fetch index summary");
  return response.json();
}

export async function getUpcomingEarnings(market: string) {
  const response = await fetch(`${API_BASE_URL}/api/earnings/calendar/${encodeURIComponent(market)}`);
  if (!response.ok) throw new Error(`Failed to fetch upcoming earnings: ${response.status}`);
  return response.json();
}

export async function getAssetEvents(symbol: string) {
  const response = await fetch(`${API_BASE_URL}/api/events/${encodeURIComponent(symbol)}`);
  if (!response.ok) throw new Error("Failed to fetch asset events");
  return response.json();
}

// Add these helper methods to your existing marketService.ts file:

/**
 * Calculates the simple moving average of volume directly from the candle array
 */
export function calculateAvgVolume(candles: any[], period: number = 20): number {
  if (!candles || candles.length === 0) return 0;
  const count = Math.min(candles.length, period);
  const sum = candles.slice(-count).reduce((acc, bar) => acc + (bar.volume || 0), 0);
  return Math.round(sum / count);
}

/**
 * Transforms standard candle arrays and fundamental payloads into a clean metric snapshot
 */
export function mergeDailyMetrics(candles: any[], fundamentals: FundamentalData): DailyMarketMetrics {
  const latestBar = candles[candles.length - 1] || {};

  return {
    currentPrice: fundamentals.price,
    previousClose: fundamentals.previousClose ?? latestBar.close ?? 0,
    dayHigh: fundamentals.dayHigh ?? latestBar.high ?? 0,
    dayLow: fundamentals.dayLow ?? latestBar.low ?? 0,
    currentVolume: fundamentals.volume ?? latestBar.volume ?? 0,
    avgVolume: calculateAvgVolume(candles)
  };
}

export interface DailyMarketMetrics {
  currentPrice: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  currentVolume: number;
  avgVolume: number;
}