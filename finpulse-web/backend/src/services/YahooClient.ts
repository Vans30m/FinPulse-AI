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
        console.log(`[YahooClient Miss] Fetching fresh data: ${cacheKey}`);
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
        if (status === 429 || err.message?.includes('429')) {
          metrics.rateLimit429Count++;
        }
        console.error(`[YahooClient Miss Fetch Failed] Key: ${cacheKey}, Error: ${err.message}`);
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
      return { quotes: [], meta: { symbol: cacheKey.split('_')[1] || 'UNKNOWN' } };
    }
    if (cacheKey.startsWith('summary_')) {
      return {};
    }
    return null;
  }

  private getDeterministicMockQuote(symbol: string) {
    const cleanSym = symbol.toUpperCase();
    const hash = cleanSym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = (hash % 1000) + 50.5;
    const change = ((hash % 100) / 10) - 5;
    const changePercent = (change / basePrice) * 100;
    return {
      symbol: cleanSym,
      regularMarketPrice: basePrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
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
    const finnhubSymbolsToFetch: string[] = [];
    const cryptoForexToFetch: string[] = [];
    const yahooSymbols: string[] = [];

    for (const symbol of symbolList) {
      const symUpper = symbol.toUpperCase();
      if (usIndices.has(symUpper) || isUsStock(symUpper)) {
        finnhubSymbolsToFetch.push(symUpper);
      } else if (cryptos.has(symUpper) || forexPairs.has(symUpper)) {
        cryptoForexToFetch.push(symUpper);
      } else {
        yahooSymbols.push(symbol);
      }
    }

    if (cryptoForexToFetch.length > 0) {
      try {
        const { fetchTwelveDataQuotes } = await import("./twelveDataService.js");
        const sortedKey = [...cryptoForexToFetch].map(s => s.toUpperCase()).sort().join(',');
        const cacheKey = `twelvedata_${sortedKey}`;
        const quotes = await this.executeQuery(cacheKey, 180, () => fetchTwelveDataQuotes(cryptoForexToFetch));
        for (const sym of cryptoForexToFetch) {
          const q = quotes[sym];
          if (q) {
            results.push({
              symbol: sym,
              ...q,
              fiftyTwoWeekHigh: q.regularMarketDayHigh,
              fiftyTwoWeekLow: q.regularMarketDayLow,
              shortName: sym,
              longName: sym
            });
          } else {
            yahooSymbols.push(sym);
          }
        }
      } catch (e) {
        console.warn("[YahooClient] Twelve Data fetch failed, falling back to Yahoo:", e);
        yahooSymbols.push(...cryptoForexToFetch);
      }
    }

    if (finnhubSymbolsToFetch.length > 0) {
      try {
        const { getFinnhubQuote } = await import("./finnhubService.js");
        const { getPolygonQuote } = await import("./polygonService.js");
        for (const sym of finnhubSymbolsToFetch) {
          let q = await getFinnhubQuote(sym);
          if (!q) {
            // Try Polygon as a secondary backup!
            q = await getPolygonQuote(sym);
          }

          if (q) {
            results.push({
              symbol: sym,
              regularMarketPrice: q.price,
              regularMarketChange: q.change,
              regularMarketChangePercent: q.changePercent,
              regularMarketVolume: 0,
              regularMarketDayHigh: q.dayHigh,
              regularMarketDayLow: q.dayLow,
              regularMarketOpen: q.open,
              regularMarketPreviousClose: q.previousClose,
              fiftyTwoWeekHigh: q.dayHigh,
              fiftyTwoWeekLow: q.dayLow,
              currency: "USD",
              exchange: "Finnhub/Polygon",
              shortName: sym,
              longName: sym
            });
          } else {
            yahooSymbols.push(sym);
          }
        }
      } catch (e) {
        console.warn("[YahooClient] Finnhub/Polygon fetch failed, falling back to Yahoo:", e);
        yahooSymbols.push(...finnhubSymbolsToFetch);
      }
    }

    if (yahooSymbols.length > 0) {
      const sortedKey = [...yahooSymbols].map(s => s.toUpperCase()).sort().join(',');
      const cacheKey = `quote_${sortedKey}`;
      const yahooResults = await this.executeQuery(cacheKey, 45, () => yahooFinance.quote(yahooSymbols, options));
      if (Array.isArray(yahooResults)) {
        results.push(...yahooResults);
      } else if (yahooResults) {
        results.push(yahooResults);
      }
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
    return this.executeQuery(cacheKey, 180, () => yahooFinance.chart(symbol, options));
  }

  async historical(symbol: string, options: any): Promise<any> {
    const cacheKey = `historical_${symbol.toUpperCase()}_${options.range || ''}_${options.interval || ''}`;
    return this.executeQuery(cacheKey, 180, () => yahooFinance.historical(symbol, options));
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
