import axios from "axios";
import NodeCache from "node-cache";

const twelveDataCache = new NodeCache({ stdTTL: 180 }); // Cache for 3 minutes to satisfy 7 api/min & 799/day

const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;
const BASE_URL = "https://api.twelvedata.com";

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
  const cacheKey = "twelvedata-quotes-all";
  const cached = twelveDataCache.get<Record<string, any>>(cacheKey);
  if (cached) {
    console.log("[Twelve Data Service] Returning cached crypto/forex quotes");
    return cached;
  }

  if (!TWELVEDATA_API_KEY) {
    console.warn("[Twelve Data Service] TWELVEDATA_API_KEY not found.");
    return {};
  }

  const tdToYahooSymbolMap: Record<string, string> = {};
  const tdSymbols: string[] = [];

  for (const ys of yahooSymbols) {
    const tds = toTwelveDataSymbol(ys);
    tdToYahooSymbolMap[tds] = ys;
    // Twelve data also accepts lowercase or uppercase, but standard is uppercase
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
    });

    const data = response.data;
    if (!data) return {};

    // If Twelve Data returns an error (e.g. rate limit, invalid key)
    if (data.status === "error" || data.code >= 400) {
      console.warn("[Twelve Data Service] API Error:", data.message || data);
      return {};
    }

    const result: Record<string, any> = {};

    // If only one symbol was requested, response might not be nested by symbol
    if (tdSymbols.length === 1) {
      const singleSymbol = tdSymbols[0];
      const ys = tdToYahooSymbolMap[singleSymbol];
      if (data.symbol) {
        result[ys] = mapTwelveDataQuote(data);
      }
    } else {
      // Multiple symbols response is an object keyed by symbol name
      for (const [tds, quoteData] of Object.entries<any>(data)) {
        const ys = tdToYahooSymbolMap[tds] || tdToYahooSymbolMap[tds.toUpperCase()];
        if (ys && quoteData && quoteData.symbol) {
          result[ys] = mapTwelveDataQuote(quoteData);
        }
      }
    }

    twelveDataCache.set(cacheKey, result);
    return result;
  } catch (err: any) {
    console.error("[Twelve Data Service] HTTP Request failed:", err.message);
    return {};
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
