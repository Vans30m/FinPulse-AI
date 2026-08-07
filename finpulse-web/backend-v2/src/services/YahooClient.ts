import { yahooFinance } from '../yahooFinance.js';
import NodeCache from 'node-cache';

class YahooMetrics {
  cacheHits = 0;
  cacheMisses = 0;
  yahooCalls = 0;
  rateLimit429Count = 0;
  duplicateRequestCount = 0;
  totalResponseTime = 0;

  logStats() {
    const avg = this.yahooCalls > 0 ? (this.totalResponseTime / this.yahooCalls).toFixed(2) : '0';
    console.log(
      `[YahooClient] Hits:${this.cacheHits} Miss:${this.cacheMisses} Calls:${this.yahooCalls} ` +
      `429s:${this.rateLimit429Count} Deduped:${this.duplicateRequestCount} AvgLatency:${avg}ms`
    );
  }
}

export const metrics = new YahooMetrics();
setInterval(() => metrics.logStats(), 60_000);

class SequentialQueue {
  private queue: (() => Promise<any>)[] = [];
  private active = false;
  private readonly minDelay = 1500;
  private lastCallTime = 0;

  get size() { return this.queue.length; }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try { resolve(await fn()); } catch (err) { reject(err); }
      });
      this.process();
    });
  }

  private async process() {
    if (this.active || this.queue.length === 0) return;
    this.active = true;

    const wait = Math.max(0, this.minDelay - (Date.now() - this.lastCallTime));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));

    const task = this.queue.shift();
    if (task) {
      this.lastCallTime = Date.now();
      try { await task(); } catch { /* propagated via promise */ }
    }

    this.active = false;
    setTimeout(() => this.process(), 50);
  }
}

export const COMMODITY_SYMBOLS: Record<string, string> = {
  'GC=F': 'Gold Futures',
  'SI=F': 'Silver Futures',
  'CL=F': 'Crude Oil WTI',
  'NG=F': 'Natural Gas',
  'HG=F': 'Copper Futures',
  'PL=F': 'Platinum',
  'ZW=F': 'Wheat Futures',
  'ZC=F': 'Corn Futures',
  'ZS=F': 'Soybean Futures',
  'BZ=F': 'Brent Crude Oil',
  'RB=F': 'RBOB Gasoline',
};

interface CacheEntry<T = any> {
  data: T;
  freshUntil: number;
}

class CentralYahooClient {
  private cache = new NodeCache({ stdTTL: 86400, useClones: false });
  private inflight = new Map<string, Promise<any>>();
  private queue = new SequentialQueue();

  public normalizeRegion(region: string): string {
    const c = region.toLowerCase().trim().replace(/\s+/g, '');
    if (c === 'us' || c === 'nasdaq' || c === 'nyse') return 'usa';
    if (c === 'india' || c === 'nse' || c === 'bse') return 'india';
    if (c === 'japan' || c === 'tokyo') return 'japan';
    if (c === 'hongkong') return 'hongkong';
    if (c === 'uk' || c === 'london') return 'uk';
    if (c === 'germany' || c === 'frankfurt') return 'germany';
    return c;
  }

  private async executeQuery<T>(
    cacheKey: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get<CacheEntry<T>>(cacheKey);

    if (cached && now < cached.freshUntil) {
      metrics.cacheHits++;
      return cached.data;
    }

    if (cached) {
      metrics.cacheHits++;
      if (!this.inflight.has(cacheKey)) {
        const bg = this.queue.add(async () => {
          const start = Date.now();
          metrics.yahooCalls++;
          try {
            const fresh = await fetchFn();
            metrics.totalResponseTime += Date.now() - start;
            this.cache.set(cacheKey, { data: fresh, freshUntil: Date.now() + ttlSeconds * 1000 });
          } catch (err: any) {
            metrics.totalResponseTime += Date.now() - start;
            console.warn(`[YahooClient SWR] Background refresh failed – ${cacheKey}: ${err.message}`);
            this.cache.del(cacheKey);
          }
        }).finally(() => this.inflight.delete(cacheKey));
        this.inflight.set(cacheKey, bg);
      }
      return cached.data;
    }

    if (this.inflight.has(cacheKey)) {
      metrics.duplicateRequestCount++;
      return this.inflight.get(cacheKey)!;
    }

    metrics.cacheMisses++;
    const fetchPromise = this.queue.add(async () => {
      const start = Date.now();
      metrics.yahooCalls++;
      try {
        const result = await fetchFn();
        metrics.totalResponseTime += Date.now() - start;
        this.cache.set(cacheKey, { data: result, freshUntil: Date.now() + ttlSeconds * 1000 });
        return result;
      } catch (err: any) {
        metrics.totalResponseTime += Date.now() - start;
        const is429 = err.response?.status === 429 || err.message?.includes('429');
        if (is429) {
          metrics.rateLimit429Count++;
          console.warn(`[YahooClient 429] Rate limited – ${cacheKey}`);
        } else {
          console.error(`[YahooClient Error] ${cacheKey}: ${err.message}`);
        }
        return this.getFallback(cacheKey);
      }
    }).finally(() => this.inflight.delete(cacheKey));

    this.inflight.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  private getFallback(cacheKey: string): any {
    if (cacheKey.startsWith('quote_')) {
      const symbols = cacheKey.replace('quote_', '').split(',');
      return symbols.map(s => this.mockQuote(s));
    }
    if (cacheKey.startsWith('chart_')) {
      const [, symbol = 'UNKNOWN', range = '1y', interval = '1d'] = cacheKey.split('_');
      return this.mockChart(symbol, range, interval);
    }
    if (cacheKey.startsWith('search_')) {
      return { quotes: this.mockSearchResults(cacheKey.split('_')[1] || ''), news: [] };
    }
    if (cacheKey.startsWith('summary_')) return {};
    if (cacheKey.startsWith('fundamentals_')) return [];
    return null;
  }

  private mockQuote(symbol: string) {
    const s = symbol.toUpperCase();
    const isCrypto = s.endsWith('-USD');
    const isCommodity = s.endsWith('=F');
    const basePrice = isCrypto ? 45000 : isCommodity ? 2000 : 150;
    return {
      symbol: s,
      regularMarketPrice: basePrice,
      regularMarketChange: 0,
      regularMarketChangePercent: 0,
      shortName: s,
      currency: s.endsWith('.NS') || s.endsWith('.BO') ? 'INR' : 'USD',
    };
  }

  private mockChart(symbol: string, range: string, interval: string) {
    const now = Date.now() - 5 * 60 * 1000;
    const isMin = interval.includes('m');
    const isHour = interval.includes('h');
    const step = isMin ? 60_000 : isHour ? 3_600_000 : 86_400_000;
    let base = symbol.endsWith('-USD') ? 45000 : symbol.endsWith('=F') ? 2000 : 150;
    const quotes = Array.from({ length: 100 }, (_, i) => {
      const time = now - (100 - i) * step;
      const chg = (Math.random() - 0.5) * base * 0.005;
      const open = base, close = base + chg;
      const high = Math.max(open, close) + Math.random() * base * 0.002;
      const low = Math.min(open, close) - Math.random() * base * 0.002;
      base = close;
      return { date: new Date(time).toISOString(), open, high, low, close, adjclose: close, volume: Math.floor(Math.random() * 5e5) + 1e5 };
    });
    return { meta: { symbol, currency: 'USD', dataGranularity: interval, range }, quotes };
  }

  private mockSearchResults(query: string) {
    const universe = [
      { symbol: 'AAPL', shortname: 'Apple Inc.', exchDisp: 'NASDAQ', quoteType: 'EQUITY' },
      { symbol: 'MSFT', shortname: 'Microsoft Corporation', exchDisp: 'NASDAQ', quoteType: 'EQUITY' },
      { symbol: 'GOOGL', shortname: 'Alphabet Inc.', exchDisp: 'NASDAQ', quoteType: 'EQUITY' },
      { symbol: 'NVDA', shortname: 'NVIDIA Corporation', exchDisp: 'NASDAQ', quoteType: 'EQUITY' },
      { symbol: 'TSLA', shortname: 'Tesla Inc.', exchDisp: 'NASDAQ', quoteType: 'EQUITY' },
      { symbol: 'BTC-USD', shortname: 'Bitcoin USD', exchDisp: 'CCC', quoteType: 'CRYPTOCURRENCY' },
      { symbol: 'ETH-USD', shortname: 'Ethereum USD', exchDisp: 'CCC', quoteType: 'CRYPTOCURRENCY' },
      { symbol: 'SOL-USD', shortname: 'Solana USD', exchDisp: 'CCC', quoteType: 'CRYPTOCURRENCY' },
      { symbol: 'GC=F', shortname: 'Gold Futures', exchDisp: 'COMEX', quoteType: 'FUTURE' },
      { symbol: 'CL=F', shortname: 'Crude Oil WTI', exchDisp: 'NYMEX', quoteType: 'FUTURE' },
      { symbol: 'SI=F', shortname: 'Silver Futures', exchDisp: 'COMEX', quoteType: 'FUTURE' },
      { symbol: 'RELIANCE.NS', shortname: 'Reliance Industries', exchDisp: 'NSE', quoteType: 'EQUITY' },
      { symbol: 'TCS.NS', shortname: 'Tata Consultancy Services', exchDisp: 'NSE', quoteType: 'EQUITY' },
    ];
    const q = query.toLowerCase();
    return universe.filter(a =>
      a.symbol.toLowerCase().includes(q) || a.shortname.toLowerCase().includes(q)
    );
  }

  async quote(symbols: string | string[], options?: any): Promise<any> {
    const list = Array.isArray(symbols) ? symbols : [symbols];
    if (list.length === 0) return Array.isArray(symbols) ? [] : null;

    const sortedKey = list.map(s => s.toUpperCase()).sort().join(',');
    const cacheKey = `quote_${sortedKey}`;

    const result = await this.executeQuery(cacheKey, 60, async () => {
      const res: any = await yahooFinance.quote(list as any, options);
      const arr: any[] = Array.isArray(res) ? res : [res];
      const allInvalid = arr.every((q: any) => !q || q.regularMarketPrice == null);
      if (allInvalid) throw new Error('Yahoo returned empty/invalid quotes');
      return res;
    });

    const arr: any[] = Array.isArray(result) ? result : [result];
    const map = new Map(arr.filter((r: any) => r?.symbol).map((r: any) => [r.symbol.toUpperCase(), r]));
    const ordered = list.map(s => map.get(s.toUpperCase()) || null);
    return Array.isArray(symbols) ? ordered : ordered[0];
  }

  async search(query: string, options?: any): Promise<any> {
    const cacheKey = `search_${query.trim().toUpperCase()}_${options?.quotesCount || 20}`;
    return this.executeQuery(cacheKey, 300, () => yahooFinance.search(query, options));
  }

  async chart(symbol: string, options: any): Promise<any> {
    const cacheKey = `chart_${symbol.toUpperCase()}_${options.range || ''}_${options.interval || ''}`;
    const interval = options.interval || '';
    const isDailyOrMore = ['1d', '1wk', '1mo', '1y', '5d'].includes(interval)
      || (!interval.includes('m') && !interval.includes('h'));
    return this.executeQuery(cacheKey, isDailyOrMore ? 3600 : 60, () =>
      yahooFinance.chart(symbol, options)
    );
  }

  async historical(symbol: string, options: any): Promise<any> {
    const cacheKey = `historical_${symbol.toUpperCase()}_${options.range || options.period1 || ''}_${options.interval || ''}`;
    const interval = options.interval || '';
    const isDailyOrMore = ['1d', '1wk', '1mo'].includes(interval)
      || (!interval.includes('m') && !interval.includes('h'));
    return this.executeQuery(cacheKey, isDailyOrMore ? 3600 : 60, () =>
      yahooFinance.historical(symbol, options)
    );
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
    return this.executeQuery(cacheKey, 86400, () =>
      (yahooFinance as any).fundamentalsTimeSeries(symbol, options)
    );
  }
}

export const YahooClient = new CentralYahooClient();
