import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyUrl = process.env.PROXY_URL;

let axiosAgent: HttpsProxyAgent<string> | undefined;

if (proxyUrl) {
  const undiciDispatcher = new ProxyAgent(proxyUrl);
  setGlobalDispatcher(undiciDispatcher);
  axiosAgent = new HttpsProxyAgent(proxyUrl);
  console.log('[Yahoo Service] Routing traffic through outbound proxy:', proxyUrl.replace(/:[^:@]+@/, ':****@'));
}

export const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  validation: {
    logErrors: false
  },
  fetchOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  }
});

// Monkey-patch _moduleExec to globally disable result schema validation.
// This prevents FailedYahooValidationError from crashing the backend when Yahoo's API response structure varies.
const originalModuleExec = (yahooFinance as any)._moduleExec;
(yahooFinance as any)._moduleExec = function (opts: any) {
  if (!opts.moduleOptions) {
    opts.moduleOptions = {};
  }
  opts.moduleOptions.validateResult = false;
  return originalModuleExec.call(this, opts);
};

export async function fetchQuotesResilient(symbols: string[]): Promise<any[]> {
  try {
    const quotes = await yahooFinance.quote(symbols);
    return Array.isArray(quotes) ? quotes : [quotes];
  } catch (err: any) {
    console.warn(`[Yahoo Service] Quote fetch failed, falling back to spark/chart:`, err.message);
    try {
      const url = 'https://query2.finance.yahoo.com/v8/finance/spark';
      const response = await axios.get(url, {
        params: {
          symbols: symbols.join(','),
          range: '1d',
          interval: '1d'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        ...(axiosAgent ? { httpsAgent: axiosAgent, proxy: false } : {}),
        timeout: 10000
      });

      const data = response.data || {};
      return symbols.map(symbol => {
        const spark = data[symbol];
        if (!spark) return null;
        
        const price = spark.close?.[spark.close.length - 1] || 0;
        const prevClose = spark.chartPreviousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;
        
        return {
          symbol,
          regularMarketPrice: price,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
          regularMarketVolume: 0,
          currency: 'USD',
          regularMarketOpen: price,
          regularMarketDayHigh: price,
          regularMarketDayLow: price,
          fiftyTwoWeekHigh: price,
          fiftyTwoWeekLow: price,
          shortName: symbol.split('.')[0]
        };
      }).filter(Boolean);
    } catch (fallbackErr: any) {
      console.error(`[Yahoo Service] Resilient spark fallback failed:`, fallbackErr.message);
      throw err;
    }
  }
}
