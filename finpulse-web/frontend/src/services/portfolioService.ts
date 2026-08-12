import API_BASE_URL from "../config/api";
// src/services/portfolioService.ts

export interface BenchmarkComparisonResponse {
  series: {
    date: string;
    portfolioReturn: number;
    benchmarkReturn: number;
  }[];
  stats: {
    alpha: number;
    beta: number;
    correlation: number;
    trackingError: number;
    sharpeRatio: number;
    informationRatio: number;
    maxDrawdown: number;
    volatility: number;
    portfolioReturn: number;
    benchmarkReturn: number;
  };
  constituents: any[];
}

// In-memory cache for API requests
const benchmarkCache = new Map<string, { timestamp: number; data: BenchmarkComparisonResponse }>();
const CACHE_TTL_MS = 60 * 1000; // Cache for 1 minute

export async function getBenchmarkComparison(
  symbol: string,
  timeframe: string,
  signal?: AbortSignal
): Promise<BenchmarkComparisonResponse> {
  const cacheKey = `${symbol}_${timeframe}`;
  const cached = benchmarkCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
  const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
  const userId = storedUser.id;
  const headers: Record<string, string> = {};
  if (userId) headers['X-User-Id'] = userId;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(
    `${API_BASE_URL}/api/portfolio/benchmark-comparison?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`,
    { headers, signal }
  );

  if (!res.ok) {
    throw new Error("Unable to load benchmark comparison data");
  }

  const data = await res.json();
  benchmarkCache.set(cacheKey, { timestamp: Date.now(), data });
  return data;
}

export interface VirtualState {
  balance: number;
  holdings: any[];
  transactions: any[];
}

export async function getVirtualState(): Promise<VirtualState> {
  const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
  const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
  const userId = storedUser.id;
  const headers: Record<string, string> = {};
  if (userId) headers['X-User-Id'] = userId;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/portfolio/virtual`, { headers });
  if (!res.ok) {
    throw new Error("Unable to load virtual portfolio state");
  }
  const data = await res.json();
  
  // Keep local storage in sync as local cache
  localStorage.setItem('finpulse_virtual_balance', data.balance.toString());
  localStorage.setItem('finpulse_virtual_holdings', JSON.stringify(data.holdings));
  localStorage.setItem('finpulse_virtual_transactions', JSON.stringify(data.transactions));
  
  return data;
}

export async function syncVirtualState(state: VirtualState): Promise<void> {
  const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
  const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
  const userId = storedUser.id;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (userId) headers['X-User-Id'] = userId;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Update local storage instantly
  localStorage.setItem('finpulse_virtual_balance', state.balance.toString());
  localStorage.setItem('finpulse_virtual_holdings', JSON.stringify(state.holdings));
  localStorage.setItem('finpulse_virtual_transactions', JSON.stringify(state.transactions));

  // Trigger storage event so other mounted views update in real-time
  window.dispatchEvent(new Event('storage'));

  const res = await fetch(`${API_BASE_URL}/api/portfolio/virtual/sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify(state)
  });
  if (!res.ok) {
    throw new Error("Failed to sync virtual portfolio state to database");
  }
}

