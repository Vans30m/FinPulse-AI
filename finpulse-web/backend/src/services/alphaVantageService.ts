import axios from "axios";

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export async function getNewsSentiment() {
  const response = await axios.get(
    "https://www.alphavantage.co/query",
    {
      params: {
        function: "NEWS_SENTIMENT",
        topics: "financial_markets",
        sort: "LATEST",
        limit: 20,
        apikey: API_KEY,
      },
    }
  );

  return response.data;
}

export async function getAlphaVantageQuote(symbol: string): Promise<any | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY || API_KEY;
  if (!apiKey) return null;

  let avSymbol = symbol.trim().toUpperCase();
  if (avSymbol.endsWith('.NS')) {
    avSymbol = avSymbol.replace('.NS', '.NSE');
  } else if (avSymbol.endsWith('.BO')) {
    avSymbol = avSymbol.replace('.BO', '.BOM');
  }

  try {
    console.log(`[Alpha Vantage] Fetching quote fallback for ${symbol} as ${avSymbol}`);
    const response = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "GLOBAL_QUOTE",
        symbol: avSymbol,
        apikey: apiKey,
      },
      timeout: 10000
    });

    const quote = response.data?.["Global Quote"];
    if (!quote || !quote["05. price"]) {
      console.warn(`[Alpha Vantage] No quote returned for ${avSymbol}:`, response.data);
      return null;
    }

    return {
      price: parseFloat(quote["05. price"]),
      change: parseFloat(quote["09. change"]),
      changePercent: parseFloat(quote["10. change percent"].replace('%', '')),
      volume: parseInt(quote["06. volume"]) || 0,
      open: parseFloat(quote["02. open"]) || 0,
      dayHigh: parseFloat(quote["03. high"]) || 0,
      dayLow: parseFloat(quote["04. low"]) || 0,
      previousClose: parseFloat(quote["08. previous close"]) || 0,
    };
  } catch (err: any) {
    console.warn(`[Alpha Vantage] Quote failed for ${symbol}:`, err.message);
    return null;
  }
}