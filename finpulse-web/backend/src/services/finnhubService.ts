import axios from "axios";
import NodeCache from "node-cache";
import { YahooClient } from "./YahooClient.js";

const finnhubCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
const indexCache = new NodeCache({ stdTTL: 300 }); // Cache indices for 5 minutes

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = "https://finnhub.io/api/v1";

interface FinnhubEarning {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  hour: string;
  quarter: number;
  revenueActual: number | null;
  revenueEstimate: number | null;
  symbol: string;
  year: number;
}

export async function getFinnhubUpcomingEarnings(): Promise<any[]> {
  const cacheKey = "finnhub-earnings-us";
  const cached = finnhubCache.get<any[]>(cacheKey);
  if (cached) {
    console.log("[Finnhub Service] Returning cached US upcoming earnings");
    return cached;
  }

  if (!FINNHUB_API_KEY) {
    throw new Error("FINNHUB_API_KEY is not defined");
  }

  const today = new Date();
  const fromDate = today.toISOString().split("T")[0];
  
  // Fetch for next 7 days (1 week)
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 7);
  const toDate = futureDate.toISOString().split("T")[0];

  console.log(`[Finnhub Service] Fetching US earnings from ${fromDate} to ${toDate}`);
  
  const response = await axios.get(`${BASE_URL}/calendar/earnings`, {
    params: {
      from: fromDate,
      to: toDate,
      token: FINNHUB_API_KEY,
    },
  });

  const earnings: FinnhubEarning[] = response.data.earningsCalendar || [];
  if (!earnings.length) {
    return [];
  }

  // Sort chronologically (closest first)
  earnings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get top 6 closest unique upcoming earnings
  const uniqueEarnings: FinnhubEarning[] = [];
  const seenSymbols = new Set<string>();
  for (const item of earnings) {
    if (!seenSymbols.has(item.symbol)) {
      seenSymbols.add(item.symbol);
      uniqueEarnings.push(item);
    }
    if (uniqueEarnings.length >= 6) {
      break;
    }
  }

  // Fetch quote details for these 6 symbols using Finnhub or Yahoo Finance as fallback
  const results = [];
  for (const item of uniqueEarnings) {
    try {
      // Get quote from Finnhub
      const quoteRes = await axios.get(`${BASE_URL}/quote`, {
        params: {
          symbol: item.symbol,
          token: FINNHUB_API_KEY,
        },
      });
      const q = quoteRes.data;

      // Fallback/enrich details with Yahoo Client if necessary or compute basic
      const price = q.c || 0;
      const change = q.d || 0;
      const changePercent = q.dp || 0;
      const prevClose = q.pc || 0;
      const dayHigh = q.h || 0;
      const dayLow = q.l || 0;

      results.push({
        symbol: item.symbol,
        name: item.symbol, // We can get full name from Yahoo or default to symbol
        exchange: "US",
        sector: "N/A",
        industry: "N/A",
        currency: "USD",
        marketCap: 0,
        price,
        change,
        changePercent,
        earningsDate: new Date(item.date).toISOString(),
        estimatedEPS: item.epsEstimate,
        logo: `https://logo.clearbit.com/${item.symbol.toLowerCase()}.com`,
        summary: `Upcoming earnings release for ${item.symbol} on ${item.date}.`,
        weekHigh52: dayHigh,
        weekLow52: dayLow,
        dividendYield: 0,
        peRatio: null,
        eps: item.epsEstimate,
        website: "",
        previousEPS: item.epsActual,
        revenue: item.revenueEstimate || 0,
        country: "usa",
      });
      
      // Sleep a bit to avoid hitting 55 calls/min limit
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err: any) {
      console.warn(`[Finnhub Service] Failed to fetch quote for ${item.symbol}:`, err.message);
      // fallback with basic entry
      results.push({
        symbol: item.symbol,
        name: item.symbol,
        exchange: "US",
        sector: "N/A",
        industry: "N/A",
        currency: "USD",
        marketCap: 0,
        price: 0,
        change: 0,
        changePercent: 0,
        earningsDate: new Date(item.date).toISOString(),
        estimatedEPS: item.epsEstimate,
        logo: `https://logo.clearbit.com/${item.symbol.toLowerCase()}.com`,
        summary: `Upcoming earnings release for ${item.symbol} on ${item.date}.`,
        weekHigh52: 0,
        weekLow52: 0,
        dividendYield: 0,
        peRatio: null,
        eps: item.epsEstimate,
        website: "",
        previousEPS: item.epsActual,
        revenue: item.revenueEstimate || 0,
        country: "usa",
      });
    }
  }

  // Try to enrich company names and details with a quick Yahoo query where possible
  try {
    const symbols = results.map(r => r.symbol);
    const yahooQuotes = await YahooClient.quote(symbols);
    const yahooMap = new Map(yahooQuotes.filter((y: any) => y?.symbol).map((y: any) => [y.symbol, y]));
    for (const r of results) {
      const yq = yahooMap.get(r.symbol) as any;
      if (yq) {
        r.name = yq.longName || yq.shortName || r.name;
        r.exchange = yq.exchange || r.exchange;
        r.currency = yq.currency || r.currency;
        r.marketCap = yq.marketCap || r.marketCap;
        if (r.price === 0) {
          r.price = yq.regularMarketPrice || r.price;
          r.change = yq.regularMarketChange || r.change;
          r.changePercent = yq.regularMarketChangePercent || r.changePercent;
        }
        r.weekHigh52 = yq.fiftyTwoWeekHigh || r.weekHigh52;
        r.weekLow52 = yq.fiftyTwoWeekLow || r.weekLow52;
        r.peRatio = yq.trailingPE || r.peRatio;
        r.eps = yq.epsTrailingTwelveMonths || r.eps;
      }
    }
  } catch (err: any) {
    console.warn("[Finnhub Service] Yahoo enrichment failed:", err.message);
  }

  finnhubCache.set(cacheKey, results);
  return results;
}

let finnhubCooldownUntil = 0;

export async function getFinnhubQuote(symbol: string): Promise<any | null> {
  const cacheKey = `quote-${symbol}`;
  const cached = indexCache.get<any>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!FINNHUB_API_KEY) {
    return null;
  }

  if (Date.now() < finnhubCooldownUntil) {
    return null;
  }

  try {
    const res = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol,
        token: FINNHUB_API_KEY,
      },
    });
    const q = res.data;
    if (!q || q.c === null || q.c === 0) {
      return null;
    }

    const mapped = {
      price: q.c,
      change: q.d,
      changePercent: q.dp,
      dayHigh: q.h,
      dayLow: q.l,
      open: q.o,
      previousClose: q.pc,
    };
    
    indexCache.set(cacheKey, mapped);
    return mapped;
  } catch (err: any) {
    console.warn(`[Finnhub Service] Error fetching quote for ${symbol}:`, err.message);
    if (err.response?.status === 429) {
      console.warn(`[Finnhub Service] Finnhub rate limit (429) encountered. Entering 1-minute cooldown.`);
      finnhubCooldownUntil = Date.now() + 60000; // 1 minute cooldown
    }
    return null;
  }
}
