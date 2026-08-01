import axios from "axios";
import NodeCache from "node-cache";

const twelveDataCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes to satisfy api rate limits

const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;
const BASE_URL = "https://api.twelvedata.com";

let TWELVEDATA_COOLDOWN_UNTIL = 0;

export function isTwelveDataRateLimited(): boolean {
  return Date.now() < TWELVEDATA_COOLDOWN_UNTIL;
}

export function setTwelveDataRateLimited() {
  TWELVEDATA_COOLDOWN_UNTIL = Date.now() + 60000; // 1 minute cooldown
  console.warn(`[Twelve Data Service] Twelve Data rate-limit detected. Entering 1-minute cooldown.`);
}

// Map Yahoo style symbols to Twelve Data style symbols
// BTC-USD -> BTC/USD
// EURUSD=X -> EUR/USD
export function toTwelveDataSymbol(yahooSymbol: string): string {
  if (yahooSymbol.endsWith("=X")) {
    const raw = yahooSymbol.replace("=X", "");
    if (raw.length === 6) {
      return `${raw.substring(0, 3)}/${raw.substring(3, 6)}`;
    }
  }
  return yahooSymbol.replace("-USD", "/USD");
}

export async function fetchTwelveDataQuotes(yahooSymbols: string[]): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  if (isTwelveDataRateLimited()) {
    console.warn("[Twelve Data Service] Twelve Data is rate limited. Skipping request.");
    return result;
  }

  if (!TWELVEDATA_API_KEY) {
    console.warn("[Twelve Data Service] TWELVEDATA_API_KEY not found.");
    return {};
  }

  const missingYahooSymbols: string[] = [];

  // Check cache for each symbol individually
  for (const ys of yahooSymbols) {
    const cachedQuote = twelveDataCache.get<any>(`td-quote-${ys.toUpperCase()}`);
    if (cachedQuote) {
      result[ys] = cachedQuote;
    } else {
      missingYahooSymbols.push(ys);
    }
  }

  if (missingYahooSymbols.length === 0) {
    return result;
  }

  const tdToYahooSymbolMap: Record<string, string> = {};
  const tdSymbols: string[] = [];

  for (const ys of missingYahooSymbols) {
    const tds = toTwelveDataSymbol(ys);
    tdToYahooSymbolMap[tds] = ys;
    tdSymbols.push(tds);
  }

  try {
    const symbolParam = tdSymbols.join(",");
    console.log(`[Twelve Data Service] Fetching batch quotes for: ${symbolParam}`);
    
    const response = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol: symbolParam,
        apikey: TWELVEDATA_API_KEY,
      },
      timeout: 10000
    });

    const data = response.data;
    if (!data) return result;

    // If Twelve Data returns an error (e.g. rate limit, invalid key)
    if (data.status === "error" || data.code >= 400) {
      console.warn("[Twelve Data Service] API Error:", data.message || data);
      if (data.code === 429 || data.message?.includes("429") || data.message?.includes("rate limit") || data.message?.includes("Too Many Requests")) {
        setTwelveDataRateLimited();
      }
      return result;
    }

    // Process and cache retrieved quotes
    if (tdSymbols.length === 1) {
      const singleSymbol = tdSymbols[0];
      const ys = tdToYahooSymbolMap[singleSymbol];
      if (data.symbol) {
        const mapped = mapTwelveDataQuote(data);
        result[ys] = mapped;
        twelveDataCache.set(`td-quote-${ys.toUpperCase()}`, mapped);
      }
    } else {
      // Multiple symbols response is an object keyed by symbol name
      for (const [tds, quoteData] of Object.entries<any>(data)) {
        const ys = tdToYahooSymbolMap[tds] || tdToYahooSymbolMap[tds.toUpperCase()];
        if (ys && quoteData && quoteData.symbol) {
          const mapped = mapTwelveDataQuote(quoteData);
          result[ys] = mapped;
          twelveDataCache.set(`td-quote-${ys.toUpperCase()}`, mapped);
        }
      }
    }

    return result;
  } catch (err: any) {
    console.error("[Twelve Data Service] HTTP Request failed:", err.message);
    if (err.response?.status === 429 || err.message?.includes("429") || err.message?.includes("Too Many Requests")) {
      setTwelveDataRateLimited();
    }
    return result;
  }
}

function mapTwelveDataQuote(q: any) {
  const price = parseFloat(q.close || q.price || "0");
  const change = parseFloat(q.change || "0");
  const changePercent = parseFloat(q.percent_change || "0");
  const dayHigh = parseFloat(q.high || "0");
  const dayLow = parseFloat(q.low || "0");
  const open = parseFloat(q.open || "0");
  const previousClose = parseFloat(q.previous_close || "0");
  const volume = parseFloat(q.volume || "0");

  return {
    regularMarketPrice: price,
    regularMarketChange: change,
    regularMarketChangePercent: changePercent,
    regularMarketVolume: volume,
    regularMarketDayHigh: dayHigh,
    regularMarketDayLow: dayLow,
    regularMarketOpen: open,
    regularMarketPreviousClose: previousClose,
    currency: q.currency || "USD",
    exchange: q.exchange || "TwelveData",
  };
}
