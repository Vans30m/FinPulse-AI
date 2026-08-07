import axios from "axios";
import NodeCache from "node-cache";

const polygonCache = new NodeCache({ stdTTL: 180 }); // Cache quotes for 3 minutes
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const BASE_URL = "https://api.polygon.io";

let polygonCooldownUntil = 0;

export async function getPolygonQuote(symbol: string): Promise<any | null> {
  const cleanSymbol = symbol.toUpperCase().replace("-", "").replace("/", ""); // Polygon symbol format (e.g. BTCUSD instead of BTC-USD)
  const cacheKey = `polygon-quote-${cleanSymbol}`;
  const cached = polygonCache.get<any>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!POLYGON_API_KEY) {
    return null;
  }

  if (Date.now() < polygonCooldownUntil) {
    return null;
  }

  try {
    // Fetch previous close / daily aggregate bar from Polygon
    const response = await axios.get(`${BASE_URL}/v2/aggs/ticker/${cleanSymbol}/prev`, {
      params: {
        adjusted: "true",
        apiKey: POLYGON_API_KEY,
      },
    });

    const results = response.data.results?.[0];
    if (!results) {
      return null;
    }

    // c = close (last price), o = open, h = high, l = low, v = volume, prev close isn't directly here
    const price = results.c || 0;
    const open = results.o || 0;
    const dayHigh = results.h || 0;
    const dayLow = results.l || 0;
    
    // Approximate change using open vs close if previous close is not in results
    const change = price - open;
    const changePercent = open > 0 ? (change / open) * 100 : 0;

    const mapped = {
      price,
      change,
      changePercent,
      dayHigh,
      dayLow,
      open,
      previousClose: open,
    };

    polygonCache.set(cacheKey, mapped);
    return mapped;
  } catch (err: any) {
    console.warn(`[Polygon Service] Error fetching quote for ${symbol}:`, err.message);
    if (err.response?.status === 429) {
      console.warn(`[Polygon Service] Polygon rate limit (429) encountered. Entering 1-minute cooldown.`);
      polygonCooldownUntil = Date.now() + 60000; // 1-minute cooldown
    }
    return null;
  }
}
