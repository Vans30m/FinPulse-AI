import axios from 'axios';
import NodeCache from 'node-cache';

// ─────────────────────────────────────────────────────────────────────────────
// Binance Public REST API – no API key required
// Rate limit: 1200 requests/minute (weight-based)
// Endpoint docs: https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data
// ─────────────────────────────────────────────────────────────────────────────

const BINANCE_BASE = 'https://api.binance.com';
const BINANCE_US_BASE = 'https://api.binance.us'; // US fallback

// In-memory cache for Binance responses
const binanceCache = new NodeCache({ useClones: false });

// Convert Yahoo-style crypto symbol to Binance pair
// BTC-USD -> BTCUSDT  |  ETH-USD -> ETHUSDT
export function toBinanceSymbol(yahooSymbol: string): string | null {
  const upper = yahooSymbol.toUpperCase();
  if (!upper.endsWith('-USD')) return null;
  const base = upper.replace('-USD', '');
  return `${base}USDT`;
}

// Convert Yahoo interval -> Binance kline interval
const INTERVAL_MAP: Record<string, string> = {
  '1m': '1m', '2m': '3m', '5m': '5m', '15m': '15m', '30m': '30m',
  '60m': '1h', '1h': '1h', '4h': '4h', '1d': '1d', '5d': '1d',
  '1wk': '1w', '1mo': '1M', '3mo': '1M',
};

function toBinanceInterval(yahooInterval: string): string {
  return INTERVAL_MAP[yahooInterval] || '1d';
}

// Convert range string to milliseconds
function rangeToMs(range: string): number {
  const map: Record<string, number> = {
    '1d':  1 * 86400000, '2d': 2 * 86400000, '5d': 5 * 86400000,
    '7d':  7 * 86400000, '10d': 10 * 86400000, '15d': 15 * 86400000,
    '30d': 30 * 86400000, '60d': 60 * 86400000, '90d': 90 * 86400000,
    '1mo': 30 * 86400000, '3mo': 90 * 86400000, '6mo': 180 * 86400000,
    '1y':  365 * 86400000, '2y': 2 * 365 * 86400000, '3y': 3 * 365 * 86400000,
    '5y':  5 * 365 * 86400000, 'max': 10 * 365 * 86400000,
  };
  return map[range] || 365 * 86400000;
}

function getCacheTtl(interval: string): number {
  if (['1m', '3m', '5m', '15m', '30m'].includes(interval)) return 30;
  if (['1h', '4h'].includes(interval)) return 60;
  return 5 * 60;
}

// Paginated kline fetch (Binance returns max 1000 candles per request)
async function fetchKlines(
  binanceSymbol: string,
  interval: string,
  startTime: number,
  endTime: number
): Promise<any[][]> {
  const allKlines: any[][] = [];
  let cursor = startTime;
  const MAX_PAGES = 12;
  let page = 0;

  while (cursor < endTime && page < MAX_PAGES) {
    page++;
    const params = { symbol: binanceSymbol, interval, startTime: cursor, endTime, limit: 1000 };

    let klines: any[][];
    try {
      const res = await axios.get(`${BINANCE_BASE}/api/v3/klines`, { params, timeout: 10000 });
      klines = res.data;
    } catch {
      const res = await axios.get(`${BINANCE_US_BASE}/api/v3/klines`, { params, timeout: 10000 });
      klines = res.data;
    }

    if (!klines || klines.length === 0) break;
    allKlines.push(...klines);
    const lastClose = klines[klines.length - 1][6] as number;
    cursor = lastClose + 1;
    if (klines.length < 1000) break;
  }

  return allKlines;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export – returns data in Yahoo chart shape so the rest of the app works
// ─────────────────────────────────────────────────────────────────────────────
export async function getBinanceCandles(
  yahooSymbol: string,
  range: string,
  yahooInterval: string
): Promise<{ meta: any; quotes: any[] }> {
  const binanceSymbol = toBinanceSymbol(yahooSymbol);
  if (!binanceSymbol) throw new Error(`${yahooSymbol} is not a Binance crypto pair`);

  const binanceInterval = toBinanceInterval(yahooInterval);
  const cacheKey = `binance_${binanceSymbol}_${range}_${binanceInterval}`;
  const ttl = getCacheTtl(binanceInterval);

  const cached = binanceCache.get<{ meta: any; quotes: any[] }>(cacheKey);
  if (cached) {
    console.log(`[Binance] Cache hit: ${cacheKey}`);
    return cached;
  }

  const now = Date.now();
  const startTime = range === 'ytd'
    ? new Date(new Date().getFullYear(), 0, 1).getTime()
    : now - rangeToMs(range);

  console.log(`[Binance] Fetching ${binanceSymbol} ${binanceInterval} from ${new Date(startTime).toISOString()}`);

  const klines = await fetchKlines(binanceSymbol, binanceInterval, startTime, now);
  if (klines.length === 0) throw new Error(`Binance returned no data for ${binanceSymbol}`);

  // Binance kline: [openTime, open, high, low, close, volume, closeTime, ...]
  const quotes = klines.map((k: any[]) => ({
    date: new Date(k[0] as number).toISOString(),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    adjclose: parseFloat(k[4]),
  }));

  const lastClose = quotes[quotes.length - 1]?.close ?? 0;
  const firstClose = quotes[0]?.close ?? lastClose;

  const result = {
    meta: {
      currency: 'USD',
      symbol: yahooSymbol,
      exchangeName: 'Binance',
      instrumentType: 'CRYPTOCURRENCY',
      regularMarketPrice: lastClose,
      chartPreviousClose: firstClose,
      dataGranularity: yahooInterval,
      range,
      source: 'binance',
    },
    quotes,
  };

  binanceCache.set(cacheKey, result, ttl);
  console.log(`[Binance] Cached ${quotes.length} candles for ${binanceSymbol} (ttl=${ttl}s)`);
  return result;
}

// Live 24hr ticker quote from Binance
export async function getBinanceLiveQuote(yahooSymbol: string): Promise<any | null> {
  const binanceSymbol = toBinanceSymbol(yahooSymbol);
  if (!binanceSymbol) return null;

  const cacheKey = `binance_quote_${binanceSymbol}`;
  const cached = binanceCache.get<any>(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(`${BINANCE_BASE}/api/v3/ticker/24hr`, {
      params: { symbol: binanceSymbol },
      timeout: 8000,
    });
    const d = res.data;
    const price = parseFloat(d.lastPrice);
    const prevClose = parseFloat(d.prevClosePrice);

    const result = {
      symbol: yahooSymbol,
      regularMarketPrice: price,
      regularMarketChange: price - prevClose,
      regularMarketChangePercent: parseFloat(d.priceChangePercent),
      regularMarketVolume: parseFloat(d.volume),
      regularMarketDayHigh: parseFloat(d.highPrice),
      regularMarketDayLow: parseFloat(d.lowPrice),
      regularMarketOpen: parseFloat(d.openPrice),
      regularMarketPreviousClose: prevClose,
      currency: 'USD',
      marketState: 'REGULAR',
      longName: `${yahooSymbol.replace('-USD', '')} USD`,
      shortName: yahooSymbol.replace('-USD', ''),
      quoteType: 'CRYPTOCURRENCY',
    };

    binanceCache.set(cacheKey, result, 15); // 15s live price cache
    return result;
  } catch (err: any) {
    console.warn(`[Binance] Live quote failed for ${binanceSymbol}: ${err.message}`);
    return null;
  }
}

// Helper: is this symbol a crypto pair handled by Binance?
export function isBinanceCrypto(symbol: string): boolean {
  return symbol.toUpperCase().endsWith('-USD');
}
