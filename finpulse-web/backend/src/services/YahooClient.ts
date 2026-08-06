import { yahooFinance } from '../yahooFinance.js';
import NodeCache from 'node-cache';

interface CacheEntry<T = any> {
  data: T;
  freshUntil: number; // TTL for freshness
}

class YahooMetrics {
  cacheHits = 0;
  cacheMisses = 0;
  yahooCalls = 0;
  rateLimit429Count = 0;
  duplicateRequestCount = 0;
  totalResponseTime = 0;

  logStats() {
    const avg = this.yahooCalls > 0 ? (this.totalResponseTime / this.yahooCalls).toFixed(2) : '0';
    console.log(`[YahooClient Metrics] Hits: ${this.cacheHits} | Misses: ${this.cacheMisses} | Calls: ${this.yahooCalls} | 429s: ${this.rateLimit429Count} | Deduped: ${this.duplicateRequestCount} | Avg Latency: ${avg}ms`);
  }
}

export const metrics = new YahooMetrics();
setInterval(() => metrics.logStats(), 60000);

class SequentialQueue {
  private queue: (() => Promise<any>)[] = [];
  private active = false;
  private minDelay = 1500; // sequential throttler (max 1 request per 1.5 seconds)
  private lastCallTime = 0;

  get size() {
    return this.queue.length;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.active || this.queue.length === 0) return;
    this.active = true;

    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    const wait = Math.max(0, this.minDelay - elapsed);

    if (wait > 0) {
      await new Promise(r => setTimeout(r, wait));
    }

    const task = this.queue.shift();
    if (task) {
      this.lastCallTime = Date.now();
      try {
        await task();
      } catch (err) {
        // Error is propagated to the promise resolver
      }
    }

    this.active = false;
    setTimeout(() => this.process(), 50);
  }
}

function isUsStock(symbol: string): boolean {
  const sym = symbol.toUpperCase();
  return !sym.includes('.') && !sym.includes('=X') && !sym.startsWith('^') && !sym.endsWith('-USD');
}

class CentralYahooClient {
  private cache = new NodeCache({ stdTTL: 86400, useClones: false });
  private inflight = new Map<string, Promise<any>>();
  private queue = new SequentialQueue();

  public normalizeRegion(region: string): string {
    const clean = region.toLowerCase().trim().replace(/\s+/g, '');
    if (clean === 'us' || clean === 'nasdaq' || clean === 'nyse') return 'usa';
    if (clean === 'india' || clean === 'nse' || clean === 'bse') return 'india';
    if (clean === 'japan' || clean === 'tokyo') return 'japan';
    if (clean === 'hongkong') return 'hongkong';
    if (clean === 'uk' || clean === 'london') return 'uk';
    if (clean === 'germany' || clean === 'frankfurt') return 'germany';
    return clean;
  }

  private async executeQuery<T>(
    cacheKey: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get<CacheEntry<T>>(cacheKey);

    // 1. Fresh Cache Hit
    if (cached && now < cached.freshUntil) {
      metrics.cacheHits++;
      return cached.data;
    }

    // 2. Stale-While-Revalidate (SWR): serve cached data immediately, trigger update in bg
    if (cached) {
      metrics.cacheHits++;
      // Trigger background update if not already running
      if (!this.inflight.has(cacheKey)) {
        const bgPromise = this.queue.add(async () => {
          const startTime = Date.now();
          metrics.yahooCalls++;
          try {
            const freshData = await fetchFn();
            metrics.totalResponseTime += (Date.now() - startTime);
            this.cache.set(cacheKey, {
              data: freshData,
              freshUntil: Date.now() + ttlSeconds * 1000
            });
          } catch (err: any) {
            console.warn(`[YahooClient SWR Background Fetch Failed] Key: ${cacheKey}, Error: ${err.message}`);
            // Push freshness slightly to prevent spamming background retries immediately
            this.cache.set(cacheKey, {
              data: cached.data,
              freshUntil: Date.now() + 30 * 1000 // try again in 30s
            });
          }
        }).finally(() => {
          this.inflight.delete(cacheKey);
        });
        this.inflight.set(cacheKey, bgPromise);
      }
      return cached.data;
    }

    // 3. Cache Miss - await fresh data synchronously (deduplicated)
    if (this.inflight.has(cacheKey)) {
      metrics.duplicateRequestCount++;
      return this.inflight.get(cacheKey)!;
    }

    metrics.cacheMisses++;
    const fetchPromise = this.queue.add(async () => {
      const startTime = Date.now();
      metrics.yahooCalls++;
      try {
        const result = await fetchFn();
        metrics.totalResponseTime += (Date.now() - startTime);
        this.cache.set(cacheKey, {
          data: result,
          freshUntil: Date.now() + ttlSeconds * 1000
        });
        return result;
      } catch (err: any) {
        metrics.totalResponseTime += (Date.now() - startTime);
        const status = err.response?.status;
        const isRateLimit = status === 429 || err.message?.includes('429');
        if (isRateLimit) {
          console.warn(`[YahooClient Rate Limited] Key: ${cacheKey} (Served Fallback gracefully)`);
        } else {
          console.error(`[YahooClient Miss Fetch Failed] Key: ${cacheKey}, Error: ${err.message}`);
        }
        // Return fallback quotes/data instead of throwing to prevent crashing the response
        return this.getFallbackValue(cacheKey);
      }
    }).finally(() => {
      this.inflight.delete(cacheKey);
    });

    this.inflight.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  private getFallbackValue(cacheKey: string): any {
    if (cacheKey.startsWith('quote_')) {
      const symbols = cacheKey.replace('quote_', '').split(',');
      return symbols.map(s => this.getDeterministicMockQuote(s));
    }
    if (cacheKey.startsWith('chart_')) {
      const parts = cacheKey.split('_');
      const symbol = parts[1] || 'UNKNOWN';
      const range = parts[2] || '1y';
      const interval = parts[3] || '1d';
      
      const quotes: any[] = [];
      // End mock candles 5 minutes in the past to prevent timestamp collisions with active client ticking
      const now = Date.now() - 5 * 60 * 1000;
      
      let step = 24 * 60 * 60 * 1000; // default 1d
      if (interval.includes('m') || interval.includes('min')) {
        step = 60 * 1000;
      } else if (interval.includes('h')) {
        step = 60 * 60 * 1000;
      }
      
      let basePrice = 150.0;
      if (symbol.endsWith('-USD')) basePrice = 64000.0;
      else if (symbol === 'GC=F') basePrice = 2400.0;

      for (let i = 100; i >= 0; i--) {
        const time = now - i * step;
        const change = (Math.random() - 0.5) * (basePrice * 0.005);
        const open = basePrice;
        const close = basePrice + change;
        const high = Math.max(open, close) + Math.random() * (basePrice * 0.002);
        const low = Math.min(open, close) - Math.random() * (basePrice * 0.002);
        basePrice = close;

        quotes.push({
          date: new Date(time).toISOString(),
          open,
          high,
          low,
          close,
          volume: Math.floor(Math.random() * 500000) + 100000,
          adjclose: close
        });
      }

      return {
        meta: {
          currency: 'USD',
          symbol: symbol,
          exchangeName: 'GLOBAL',
          instrumentType: 'EQUITY',
          regularMarketPrice: basePrice,
          chartPreviousClose: basePrice,
          dataGranularity: interval,
          range: range
        },
        quotes
      };
    }
    if (cacheKey.startsWith('summary_')) {
      return {};
    }
    if (cacheKey.startsWith('fundamentals_')) {
      return [];
    }
    if (cacheKey.startsWith('search_')) {
      const query = cacheKey.split('_')[1] || '';
      const mockAssets = [
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'EQUITY' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'EQUITY' },
        { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
        { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', exchange: 'NSE', type: 'EQUITY' },
        { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', exchange: 'NSE', type: 'EQUITY' },
        { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', type: 'EQUITY' },
        { symbol: 'BTC-USD', name: 'Bitcoin USD', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'ETH-USD', name: 'Ethereum USD', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'SOL-USD', name: 'Solana USD', exchange: 'CCC', type: 'CRYPTOCURRENCY' },
        { symbol: 'EURUSD=X', name: 'EUR/USD', exchange: 'CCY', type: 'CURRENCY' },
        { symbol: 'GBPUSD=X', name: 'GBP/USD', exchange: 'CCY', type: 'CURRENCY' },
      ];

      const filtered = mockAssets.filter(asset =>
        asset.symbol.toLowerCase().includes(query.toLowerCase()) ||
        asset.name.toLowerCase().includes(query.toLowerCase())
      ).map(item => ({
        symbol: item.symbol,
        shortname: item.name,
        longname: item.name,
        exchDisp: item.exchange,
        quoteType: item.type,
      }));

      return { quotes: filtered, news: [] };
    }
    return null;
  }

  private getDeterministicMockQuote(symbol: string) {
    const cleanSym = symbol.toUpperCase();
    return {
      symbol: cleanSym,
      regularMarketPrice: null,
      regularMarketChange: null,
      regularMarketChangePercent: null,
      shortName: cleanSym.split('.')[0] + ' Inc.',
      longName: cleanSym.split('.')[0] + ' Corporation',
      currency: cleanSym.endsWith('.NS') || cleanSym.endsWith('.BO') ? 'INR' : 'USD'
    };
  }

  // --- PUBLIC API WRAPPERS ---

  async quote(symbols: string | string[], options?: any): Promise<any> {
    const symbolList = Array.isArray(symbols) ? symbols : [symbols];
    if (symbolList.length === 0) return Array.isArray(symbols) ? [] : null;

    const usIndices = new Set(["^GSPC", "^IXIC", "^DJI", "^RUT", "^NDX", "^VIX", "^DJT", "^DJU", "^NYA", "^TNX"]);
    const cryptos = new Set([
      "BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "DOGE-USD", "ADA-USD", "AVAX-USD",
      "DOT-USD", "LINK-USD", "TRX-USD", "LTC-USD", "XLM-USD", "HBAR-USD", "SHIB-USD",
      "ATOM-USD", "ETC-USD"
    ]);
    const forexPairs = new Set([
      "EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCHF=X", "USDCAD=X", "AUDUSD=X",
      "NZDUSD=X", "USDHKD=X", "USDCNY=X", "EURGBP=X", "EURJPY=X", "GBPJPY=X", "AUDJPY=X"
    ]);

    const results: any[] = [];
    const yahooSymbols = [...symbolList];
    const sortedKey = [...yahooSymbols].map(s => s.toUpperCase()).sort().join(',');
    const cacheKey = `quote_${sortedKey}`;
    const yahooResults = await this.executeQuery(cacheKey, 60, async () => {
      const res = await yahooFinance.quote(yahooSymbols, options);
      const list = Array.isArray(res) ? res : [res];
      const isInvalid = list.every(q => !q || q.regularMarketPrice === 0 || q.regularMarketPrice === undefined || q.regularMarketPrice === null);
      if (isInvalid) {
        throw new Error("Yahoo Finance returned invalid/empty quotes due to rate limit/block");
      }
      return res;
    });

    if (Array.isArray(yahooResults)) {
      results.push(...yahooResults);
    } else if (yahooResults) {
      results.push(yahooResults);
    }

    const resultMap = new Map(results.filter(r => r?.symbol).map(r => [r.symbol.toUpperCase(), r]));
    const orderedResults = symbolList.map(s => resultMap.get(s.toUpperCase()) || null);

    return Array.isArray(symbols) ? orderedResults : orderedResults[0];
  }

  async search(query: string, options?: any): Promise<any> {
    const cacheKey = `search_${query.trim().toUpperCase()}_${options?.quotesCount || 20}`;
    return this.executeQuery(cacheKey, 300, () => yahooFinance.search(query, options));
  }

  async chart(symbol: string, options: any): Promise<any> {
    const cacheKey = `chart_${symbol.toUpperCase()}_${options.range || ''}_${options.interval || ''}`;
    const interval = options.interval || '';
    const isDailyOrMore = ['1d', '1wk', '1mo', '1y', '5d'].includes(interval) || (!interval.includes('m') && !interval.includes('h') && !interval.includes('min'));
    const ttl = isDailyOrMore ? 3600 : 60;
    return this.executeQuery(cacheKey, ttl, () => yahooFinance.chart(symbol, options));
  }

  async historical(symbol: string, options: any): Promise<any> {
    const cacheKey = `historical_${symbol.toUpperCase()}_${options.range || ''}_${options.interval || ''}`;
    const interval = options.interval || '';
    const isDailyOrMore = ['1d', '1wk', '1mo', '1y', '5d'].includes(interval) || (!interval.includes('m') && !interval.includes('h') && !interval.includes('min'));
    const ttl = isDailyOrMore ? 3600 : 60;
    return this.executeQuery(cacheKey, ttl, () => yahooFinance.historical(symbol, options));
  }

  async quoteSummary(symbol: string, options: any): Promise<any> {
    const modules = [...(options.modules || [])].sort().join(',');
    const cacheKey = `summary_${symbol.toUpperCase()}_${modules}`;
    let ttl = 1800;
    if (modules.includes('summaryProfile')) ttl = 86400;
    else if (modules.includes('financials') || modules.includes('balanceSheet')) ttl = 3600;
    return this.executeQuery(cacheKey, ttl, () => yahooFinance.quoteSummary(symbol, options));
  }

  async fundamentalsTimeSeries(symbol: string, options: any): Promise<any> {
    const cacheKey = `fundamentals_${symbol.toUpperCase()}_${options.type || ''}`;
    return this.executeQuery(cacheKey, 86400, () => (yahooFinance as any).fundamentalsTimeSeries(symbol, options));
  }
}

export const YahooClient = new CentralYahooClient();
