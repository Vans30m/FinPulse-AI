import { YahooClient } from './YahooClient.js';
import { GLOBAL_INDICES } from '../config/markets.js';

export async function getGlobalMarketQuote(
  symbol: string,
  name: string,
  region: string
) {
  try {
    const quotes = await YahooClient.quote([symbol]);
    const quote = quotes[0];

    if (!quote || !quote.regularMarketPrice) {
      return null;
    }

    const bid = quote.bid;
    const ask = quote.ask;
    const spread = (bid && ask) ? parseFloat((ask - bid).toFixed(5)) : undefined;

    return {
      symbol,
      name,
      region,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      currency: quote.currency,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      yearHigh: quote.fiftyTwoWeekHigh,
      yearLow: quote.fiftyTwoWeekLow,

      // Extra fields
      marketCap: quote.marketCap,
      circulatingSupply: quote.circulatingSupply,
      bid: bid,
      ask: ask,
      spread: spread,
      previousClose: quote.regularMarketPreviousClose,
      open: quote.regularMarketOpen,
      peRatio: quote.trailingPE,
      eps: quote.epsTrailingTwelveMonths,
      dividendYield: quote.dividendYield,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

export async function getAllGlobalMarkets() {
  try {
    const cryptoAndForexSymbols = GLOBAL_INDICES.filter(m => m.region === "Crypto" || m.region === "Forex").map(m => m.symbol);
    const usIndicesSymbols = GLOBAL_INDICES.filter(m => m.region === "US").map(m => m.symbol);
    const yahooOnlySymbols = GLOBAL_INDICES.filter(m => m.region !== "Crypto" && m.region !== "Forex" && m.region !== "US").map(m => m.symbol);

    // 1. Twelve Data for Crypto and Forex symbols (has built-in 429 detection & cooldown)
    let twelveDataQuotes: Record<string, any> = {};
    try {
      const { fetchTwelveDataQuotes } = await import("./twelveDataService.js");
      twelveDataQuotes = await fetchTwelveDataQuotes(cryptoAndForexSymbols);
    } catch (err: any) {
      console.warn("[GlobalMarketService] Twelve Data fetch failed:", err.message);
    }


    // 2. Fetch Finnhub for US Indices
    const finnhubQuotes: Record<string, any> = {};
    try {
      const { getFinnhubQuote } = await import("./finnhubService.js");
      for (const symbol of usIndicesSymbols) {
        const q = await getFinnhubQuote(symbol);
        if (q) {
          finnhubQuotes[symbol] = q;
        }
      }
    } catch (err: any) {
      console.warn("[GlobalMarketService] Finnhub fetch failed:", err.message);
    }

    // 3. Fallback to Yahoo Finance for whatever failed or wasn't targeted
    const failedTwelveData = cryptoAndForexSymbols.filter(s => !twelveDataQuotes[s]);
    const failedFinnhub = usIndicesSymbols.filter(s => !finnhubQuotes[s]);
    const symbolsForYahoo = [...yahooOnlySymbols, ...failedTwelveData, ...failedFinnhub];

    const BATCH_SIZE = 10;
    const allYahooQuotes: any[] = [];

    for (let i = 0; i < symbolsForYahoo.length; i += BATCH_SIZE) {
      const batch = symbolsForYahoo.slice(i, i + BATCH_SIZE);
      try {
        const batchQuotes = await YahooClient.quote(batch);
        allYahooQuotes.push(...batchQuotes);
      } catch (batchErr: any) {
        console.warn(`[GlobalMarketService] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, batchErr.message);
      }
      // No manual sleep here — YahooClient's internal queue enforces 5s between calls
    }

    const yahooQuoteMap = new Map(allYahooQuotes.filter(q => q?.symbol).map(q => [q.symbol, q]));

    const results = GLOBAL_INDICES.map((market) => {
      const symbol = market.symbol;

      if (market.region === "Crypto" || market.region === "Forex") {
        const tdQuote = twelveDataQuotes[symbol];
        if (tdQuote) {
          return {
            symbol: market.symbol,
            name: market.name,
            region: market.region,
            price: tdQuote.regularMarketPrice,
            change: tdQuote.regularMarketChange,
            changePercent: tdQuote.regularMarketChangePercent,
            volume: tdQuote.regularMarketVolume,
            currency: tdQuote.currency || "USD",
            dayHigh: tdQuote.regularMarketDayHigh,
            dayLow: tdQuote.regularMarketDayLow,
            yearHigh: tdQuote.regularMarketDayHigh,
            yearLow: tdQuote.regularMarketDayLow,
            previousClose: tdQuote.regularMarketPreviousClose,
            open: tdQuote.regularMarketOpen,
            exchange: tdQuote.exchange || "TwelveData"
          };
        }
      }

      if (market.region === "US") {
        const fhQuote = finnhubQuotes[symbol];
        if (fhQuote) {
          return {
            symbol: market.symbol,
            name: market.name,
            region: market.region,
            price: fhQuote.price,
            change: fhQuote.change,
            changePercent: fhQuote.changePercent,
            volume: 0,
            currency: "USD",
            dayHigh: fhQuote.dayHigh,
            dayLow: fhQuote.dayLow,
            yearHigh: fhQuote.dayHigh,
            yearLow: fhQuote.dayLow,
            previousClose: fhQuote.previousClose,
            open: fhQuote.open,
            exchange: "Finnhub"
          };
        }
      }

      // Default / Fallback to Yahoo
      const quote = yahooQuoteMap.get(symbol);
      if (!quote || !quote.regularMarketPrice) return null;

      const bid = quote.bid;
      const ask = quote.ask;
      const spread = (bid && ask) ? parseFloat((ask - bid).toFixed(5)) : undefined;

      return {
        symbol: market.symbol,
        name: market.name,
        region: market.region,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        currency: quote.currency,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        yearHigh: quote.fiftyTwoWeekHigh,
        yearLow: quote.fiftyTwoWeekLow,

        // Extra fields
        marketCap: quote.marketCap,
        circulatingSupply: quote.circulatingSupply,
        bid: bid,
        ask: ask,
        spread: spread,
        previousClose: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        peRatio: quote.trailingPE,
        eps: quote.epsTrailingTwelveMonths,
        dividendYield: quote.dividendYield,
      };
    });

    return results.filter(Boolean);
  } catch (err) {
    console.error("Failed to batch fetch all global markets:", err);
    // Safe batched fallback — never fire all symbols as parallel individual requests
    const FALLBACK_BATCH = 10;
    const fallbackQuotes: any[] = [];
    const allSymbols = GLOBAL_INDICES.map(m => m.symbol);

    for (let i = 0; i < allSymbols.length; i += FALLBACK_BATCH) {
      const batch = allSymbols.slice(i, i + FALLBACK_BATCH);
      try {
        const batchQuotes = await YahooClient.quote(batch);
        fallbackQuotes.push(...batchQuotes.filter(Boolean));
      } catch (batchErr: any) {
        console.warn(`[GlobalMarketService] Fallback batch ${Math.floor(i / FALLBACK_BATCH) + 1} failed:`, batchErr.message);
      }
    }

    const fallbackMap = new Map(fallbackQuotes.filter(q => q?.symbol).map(q => [q.symbol, q]));
    return GLOBAL_INDICES.map(market => {
      const quote = fallbackMap.get(market.symbol);
      if (!quote || !quote.regularMarketPrice) return null;
      return {
        symbol: market.symbol,
        name: market.name,
        region: market.region,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        currency: quote.currency,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        yearHigh: quote.fiftyTwoWeekHigh,
        yearLow: quote.fiftyTwoWeekLow,
        previousClose: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
      };
    }).filter(Boolean);
  }
}


export async function getIndexSummary(
  symbol: string
) {
  const quotes = await YahooClient.quote([symbol]);
  const quote = quotes[0];
  if (!quote) throw new Error("Index data unavailable");

  return {
    current: quote.regularMarketPrice,
    dayHigh: quote.regularMarketDayHigh,
    dayLow: quote.regularMarketDayLow,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    volume: quote.regularMarketVolume,
  };
}
