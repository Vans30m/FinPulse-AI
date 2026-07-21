import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Define rotating standard desktop User-Agents to mimic real browsers
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
];

export function getRandomUserAgent(): string {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
}

// Set up optional Proxy Agent to route all traffic (Vercel/Render resilience)
const proxyUrl = process.env.PROXY_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

if (proxyAgent) {
  console.log(`[Yahoo Service] Initialized HttpsProxyAgent with proxy configuration.`);
}

export const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  validation: {
    logErrors: false
  },
  fetchOptions: {
    headers: {
      'User-Agent': getRandomUserAgent()
    }
  }
} as any);

// Monkey-patch _moduleExec to globally disable result schema validation and inject rotating User-Agents & Proxy Agent
const originalModuleExec = (yahooFinance as any)._moduleExec;
(yahooFinance as any)._moduleExec = function (opts: any) {
  if (!opts.moduleOptions) {
    opts.moduleOptions = {};
  }
  opts.moduleOptions.validateResult = false;

  if (!opts.fetchOptions) {
    opts.fetchOptions = {};
  }
  if (!opts.fetchOptions.headers) {
    opts.fetchOptions.headers = {};
  }

  // Rotate User-Agent per request
  opts.fetchOptions.headers['User-Agent'] = getRandomUserAgent();

  // Attach proxy agent if configured
  if (proxyAgent) {
    opts.fetchOptions.agent = proxyAgent;
  }

  return originalModuleExec.call(this, opts);
};

// Monkey-patch yahooFinance.chart to use a resilient axios fallback on failure
const originalChart = yahooFinance.chart;
(yahooFinance as any).chart = async function (symbol: string, options: any) {
  try {
    return await originalChart.call(this, symbol, options);
  } catch (err: any) {
    console.warn(`[Yahoo Service] yahooFinance.chart failed for ${symbol}, falling back to direct axios query:`, err.message);
    try {
      const params: any = {};
      if (options.range) params.range = options.range;
      if (options.interval) params.interval = options.interval;
      if (options.period1) {
        params.period1 = options.period1 instanceof Date 
          ? Math.floor(options.period1.getTime() / 1000) 
          : options.period1;
      }
      if (options.period2) {
        params.period2 = options.period2 instanceof Date 
          ? Math.floor(options.period2.getTime() / 1000) 
          : options.period2;
      }

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        params,
        headers: {
          'User-Agent': getRandomUserAgent()
        },
        httpsAgent: proxyAgent,
        timeout: 10000
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) throw new Error("No chart data returned from Yahoo fallback");

      const meta = result.meta || {};
      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const adjclose = result.indicators?.adjclose?.[0]?.adjclose || [];

      const quotes = timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000),
        high: quote.high?.[index] ?? null,
        volume: quote.volume?.[index] ?? null,
        open: quote.open?.[index] ?? null,
        low: quote.low?.[index] ?? null,
        close: quote.close?.[index] ?? null,
        adjclose: adjclose[index] ?? quote.close?.[index] ?? null
      }));

      return {
        meta,
        quotes
      };
    } catch (fallbackErr: any) {
      console.error(`[Yahoo Service] Direct axios chart fallback failed for ${symbol}:`, fallbackErr.message);
      throw err;
    }
  }
};

// Monkey-patch yahooFinance.historical to use a resilient axios fallback on failure
const originalHistorical = yahooFinance.historical;
(yahooFinance as any).historical = async function (symbol: string, options: any) {
  try {
    return await originalHistorical.call(this, symbol, options);
  } catch (err: any) {
    console.warn(`[Yahoo Service] yahooFinance.historical failed for ${symbol}, falling back to direct axios query:`, err.message);
    try {
      const params: any = {};
      if (options.range) params.range = options.range;
      if (options.interval) params.interval = options.interval;
      if (options.period1) {
        params.period1 = options.period1 instanceof Date 
          ? Math.floor(options.period1.getTime() / 1000) 
          : options.period1;
      }
      if (options.period2) {
        params.period2 = options.period2 instanceof Date 
          ? Math.floor(options.period2.getTime() / 1000) 
          : options.period2;
      }

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        params,
        headers: {
          'User-Agent': getRandomUserAgent()
        },
        httpsAgent: proxyAgent,
        timeout: 10000
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) throw new Error("No historical data returned from Yahoo fallback");

      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const adjclose = result.indicators?.adjclose?.[0]?.adjclose || [];

      return timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000),
        open: quote.open?.[index] ?? null,
        high: quote.high?.[index] ?? null,
        low: quote.low?.[index] ?? null,
        close: quote.close?.[index] ?? null,
        volume: quote.volume?.[index] ?? null,
        adjClose: adjclose[index] ?? quote.close?.[index] ?? null
      }));
    } catch (fallbackErr: any) {
      console.error(`[Yahoo Service] Direct axios historical fallback failed for ${symbol}:`, fallbackErr.message);
      throw err;
    }
  }
};

export async function fetchQuotesResilient(symbols: string[]): Promise<any[]> {
  try {
    const quotes = await yahooFinance.quote(symbols);
    return Array.isArray(quotes) ? quotes : [quotes];
  } catch (err: any) {
    console.warn(`[Yahoo Service] Quote fetch failed, falling back to spark/chart:`, err.message);
    try {
      const url = 'https://query1.finance.yahoo.com/v7/finance/spark';
      const response = await axios.get(url, {
        params: {
          symbols: symbols.join(','),
          range: '1d',
          interval: '1d'
        },
        headers: {
          'User-Agent': getRandomUserAgent()
        },
        httpsAgent: proxyAgent,
        timeout: 10000
      });

      const data = response.data || {};
      const results = data.spark?.result || [];
      const resultMap = new Map<string, any>(results.map((r: any) => [r.symbol, r] as [string, any]));

      return symbols.map(symbol => {
        const spark = resultMap.get(symbol);
        if (!spark || !spark.response?.[0]) return null;

        const resp = spark.response[0];
        const meta = resp.meta || {};
        const close = resp.indicators?.quote?.[0]?.close || [];
        const price = meta.regularMarketPrice || close[close.length - 1] || 0;
        const prevClose = meta.chartPreviousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;

        return {
          symbol,
          regularMarketPrice: price,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
          regularMarketVolume: meta.regularMarketVolume || 0,
          currency: meta.currency || 'USD',
          regularMarketOpen: meta.regularMarketOpen || price,
          regularMarketDayHigh: meta.regularMarketDayHigh || price,
          regularMarketDayLow: meta.regularMarketDayLow || price,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || price,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow || price,
          shortName: symbol.split('.')[0]
        };
      }).filter(Boolean) as any[];
    } catch (fallbackErr: any) {
      console.error(`[Yahoo Service] Resilient spark fallback failed:`, fallbackErr.message);
      throw err;
    }
  }
}
