import { yahooFinance } from '../yahooFinance.js';
import { GLOBAL_INDICES } from '../config/markets.js';

export async function getGlobalMarketQuote(
  symbol: string,
  name: string,
  region: string
) {
  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote.regularMarketPrice) {
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
    const symbols = GLOBAL_INDICES.map(m => m.symbol);
    const quotes = await yahooFinance.quote(symbols);

    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

    const results = GLOBAL_INDICES.map((market) => {
      const quote = quoteMap.get(market.symbol);
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
    // Fallback to individual fetches in case batch fails
    const results = await Promise.all(
      GLOBAL_INDICES.map((market) =>
        getGlobalMarketQuote(
          market.symbol,
          market.name,
          market.region
        )
      )
    );
    return results.filter(Boolean);
  }
}

export async function getIndexSummary(
  symbol: string
) {
  const quote =
    await yahooFinance.quote(symbol);

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
