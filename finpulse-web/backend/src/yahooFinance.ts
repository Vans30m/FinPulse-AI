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

// Symbol mapping helper functions to convert Yahoo Finance symbols to Twelve Data formats
function yahooToTwelveDataSymbol(symbol: string): string {
  let s = symbol.trim().toUpperCase();
  // Indices
  if (s.startsWith('^')) {
    s = s.substring(1);
    if (s === 'GSPC') return 'SPX'; // TwelveData uses SPX for S&P 500 index
    return s;
  }
  // Crypto: BTC-USD -> BTC/USD
  if (s.endsWith('-USD')) {
    return s.replace('-USD', '/USD');
  }
  // Forex: USDINR=X -> USD/INR
  if (s.endsWith('=X')) {
    const pair = s.replace('=X', '');
    if (pair.length === 6) {
      return `${pair.substring(0, 3)}/${pair.substring(3)}`;
    }
  }
  return s;
}

// Helper to fetch quotes from Twelve Data when Yahoo Finance fails
async function fetchTwelveDataQuotes(symbols: string[]): Promise<any[]> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVEDATA_API_KEY is not configured in .env");
  }

  // Create lookup maps to associate Yahoo symbols with Twelve Data symbols
  const yahooToTd = new Map<string, string>();
  const tdToYahoo = new Map<string, string>();
  for (const s of symbols) {
    const tdSym = yahooToTwelveDataSymbol(s);
    yahooToTd.set(s, tdSym);
    tdToYahoo.set(tdSym.toUpperCase(), s);
    tdToYahoo.set(tdSym.toLowerCase(), s);
    tdToYahoo.set(tdSym, s);
  }

  const tdSymbolList = Array.from(yahooToTd.values());
  const url = 'https://api.twelvedata.com/quote';
  const response = await axios.get(url, {
    params: {
      symbol: tdSymbolList.join(','),
      apikey: apiKey
    },
    timeout: 10000
  });

  const data = response.data;
  if (!data) throw new Error("No data returned from Twelve Data");
  if (data.status === 'error') {
    throw new Error(`Twelve Data Error: ${data.message}`);
  }

  return symbols.map(symbol => {
    const tdSym = yahooToTd.get(symbol);
    if (!tdSym) return null;

    // Twelve Data returns single object if only 1 symbol is requested, otherwise map keyed by symbol
    const tdQuote = tdSymbolList.length === 1 
      ? data 
      : (data[tdSym] || data[tdSym.toUpperCase()] || data[tdSym.toLowerCase()]);
      
    if (!tdQuote || tdQuote.status === 'error') return null;

    return {
      symbol: symbol,
      regularMarketPrice: parseFloat(tdQuote.close || tdQuote.price || '0'),
      regularMarketChange: parseFloat(tdQuote.change || '0'),
      regularMarketChangePercent: parseFloat(tdQuote.percent_change || '0'),
      regularMarketVolume: parseInt(tdQuote.volume || '0'),
      currency: tdQuote.currency || 'USD',
      regularMarketOpen: parseFloat(tdQuote.open || '0'),
      regularMarketDayHigh: parseFloat(tdQuote.high || '0'),
      regularMarketDayLow: parseFloat(tdQuote.low || '0'),
      fiftyTwoWeekHigh: parseFloat(tdQuote.fifty_two_week?.high || '0'),
      fiftyTwoWeekLow: parseFloat(tdQuote.fifty_two_week?.low || '0'),
      shortName: tdQuote.name || symbol,
      longName: tdQuote.name || symbol
    };
  }).filter(Boolean);
}

// Helper to fetch quotes from Yahoo Spark API
async function fetchYahooSparkQuotes(symbols: string[]): Promise<any[]> {
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
      shortName: meta.shortName || symbol.split('.')[0],
      longName: meta.longName || symbol
    };
  }).filter(Boolean);
}

// Monkey-patch yahooFinance.quote to use a resilient axios fallback on failure (crumb 429 errors)
const originalQuote = yahooFinance.quote;
(yahooFinance as any).quote = async function (symbols: string | string[], options?: any) {
  try {
    return await originalQuote.call(this, symbols, options);
  } catch (err: any) {
    console.warn(`[Yahoo Service] yahooFinance.quote failed, trying Twelve Data fallback:`, err.message);
    const symbolList = Array.isArray(symbols) ? symbols : [symbols];
    try {
      const tdResults = await fetchTwelveDataQuotes(symbolList);
      if (Array.isArray(symbols)) {
        return tdResults;
      } else {
        return tdResults[0] || null;
      }
    } catch (tdErr: any) {
      console.warn(`[Yahoo Service] Twelve Data fallback failed: ${tdErr.message}. Trying direct axios Yahoo spark fallback.`);
      try {
        const sparkResults = await fetchYahooSparkQuotes(symbolList);
        if (sparkResults && sparkResults.length > 0) {
          if (Array.isArray(symbols)) {
            return sparkResults;
          } else {
            return sparkResults[0] || null;
          }
        }
        throw new Error("No spark results returned");
      } catch (sparkErr: any) {
        console.warn(`[Yahoo Service] Yahoo spark fallback failed: ${sparkErr.message}. Trying direct axios Yahoo v7 quote fallback.`);
        try {
          const url = 'https://query1.finance.yahoo.com/v7/finance/quote';
          const response = await axios.get(url, {
            params: {
              symbols: symbolList.join(',')
            },
            headers: {
              'User-Agent': getRandomUserAgent()
            },
            httpsAgent: proxyAgent,
            timeout: 10000
          });

          const results = response.data?.quoteResponse?.result || [];
          if (Array.isArray(symbols)) {
            return results;
          } else {
            return results[0] || null;
          }
        } catch (fallbackErr: any) {
          console.error(`[Yahoo Service] Direct axios quote fallback failed:`, fallbackErr.message);
          const mocks = symbolList.map(sym => ({
            symbol: sym,
            regularMarketPrice: 0,
            regularMarketChange: 0,
            regularMarketChangePercent: 0,
            regularMarketVolume: 0,
            currency: 'USD',
            shortName: sym,
            longName: sym,
            regularMarketOpen: 0,
            regularMarketDayHigh: 0,
            regularMarketDayLow: 0,
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0
          }));
          if (Array.isArray(symbols)) {
            return mocks;
          } else {
            return mocks[0];
          }
        }
      }
    }
  }
};

// Monkey-patch yahooFinance.search to use direct axios on failure
const originalSearch = yahooFinance.search;
(yahooFinance as any).search = async function (query: string, searchOptions?: any) {
  try {
    return await originalSearch.call(this, query, searchOptions);
  } catch (err: any) {
    console.warn(`[Yahoo Service] yahooFinance.search failed, trying direct axios search fallback:`, err.message);
    try {
      const response = await axios.get('https://query2.finance.yahoo.com/v1/finance/search', {
        params: {
          q: query,
          quotesCount: searchOptions?.quotesCount || 20,
          newsCount: searchOptions?.newsCount || 0
        },
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        httpsAgent: proxyAgent,
        timeout: 10000
      });
      return response.data || { quotes: [] };
    } catch (fallbackErr: any) {
      console.error(`[Yahoo Service] Direct axios search fallback failed:`, fallbackErr.message);
      throw err;
    }
  }
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
    const quoteList = Array.isArray(quotes) ? quotes : [quotes];
    const isMock = quoteList.every(q => !q || q.regularMarketPrice === 0);
    if (isMock) {
      console.warn(`[Yahoo Service] yahooFinance.quote returned mocks, trying spark fallback directly in fetchQuotesResilient.`);
      try {
        const sparkQuotes = await fetchYahooSparkQuotes(symbols);
        if (sparkQuotes && sparkQuotes.length > 0) {
          return sparkQuotes;
        }
      } catch (e: any) {
        console.error(`[Yahoo Service] Spark fallback in fetchQuotesResilient failed:`, e.message);
      }
    }
    return quoteList;
  } catch (err: any) {
    console.warn(`[Yahoo Service] Quote fetch failed, trying Twelve Data batch fallback:`, err.message);
    try {
      return await fetchTwelveDataQuotes(symbols);
    } catch (tdErr: any) {
      console.warn(`[Yahoo Service] Twelve Data fallback failed: ${tdErr.message}. Trying Yahoo spark fallback.`);
      try {
        return await fetchYahooSparkQuotes(symbols);
      } catch (fallbackErr: any) {
        console.error(`[Yahoo Service] Resilient spark fallback failed:`, fallbackErr.message);
        throw err;
      }
    }
  }
}
