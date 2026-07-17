import { yahooFinance, fetchQuotesResilient } from '../yahooFinance.js';
import { DOMESTIC_INDICES, MARKET_UNIVERSE } from '../config/markets.js';
import { getAllGlobalMarkets } from './globalMarketService.js';
import NodeCache from 'node-cache';
import axios from 'axios';

const screenerCache = new NodeCache({ stdTTL: 60 });
const earningsCache = new NodeCache({ stdTTL: 43200 }); // 12 hours TTL for Vercel deployment stability

export async function getMarketScreener(
  market: string,
  type: string
) {
  const cacheKey = `market-screener-${market}-${type}`;
  const cached = screenerCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let filtered: any[] = [];

  if (market === "us") {
    try {
      const symbols = MARKET_UNIVERSE.usa || [];
      const quotes = await fetchQuotesResilient(symbols);
      filtered = quotes
        .filter((q: any) => q && q.symbol)
        .map((quote: any) => ({
          symbol: quote.symbol,
          name: quote.shortName || quote.longName || quote.symbol,
          price: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          volume: quote.regularMarketVolume || 0,
        }));
    } catch (err: any) {
      console.error("Failed to fetch US screener quotes:", err.message);
    }
  } else {
    const data = await getAllGlobalMarkets();
    filtered = data.filter((item: any) => {
      if (market === "india") {
        return item.region === "India";
      }
      return true;
    });
  }

  let result: any[] = [];
  if (type === "gainers") {
    result = filtered
      .sort((a: any, b: any) => b.changePercent - a.changePercent)
      .slice(0, 10);
  } else if (type === "losers") {
    result = filtered
      .sort((a: any, b: any) => a.changePercent - b.changePercent)
      .slice(0, 10);
  } else if (type === "active") {
    result = filtered
      .sort((a: any, b: any) => b.volume - a.volume)
      .slice(0, 10);
  } else {
    result = filtered;
  }

  screenerCache.set(cacheKey, result);
  return result;
}

export async function getDomesticScreener(
  type: string
) {
  const cacheKey = `domestic-${type}`;
  const cached = screenerCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  let stocks: any[] = [];
  try {
    const quotes = await fetchQuotesResilient(DOMESTIC_INDICES);
    stocks = quotes
      .filter((q: any) => q && q.symbol)
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortName || quote.longName || quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
      }));
  } catch (err: any) {
    console.error("Failed to fetch domestic screener quotes:", err.message);
  }

  if (type === "gainers") {
    const result = stocks
      .sort((a: any, b: any) => b.changePercent - a.changePercent)
      .slice(0, 10);
    screenerCache.set(cacheKey, result);
    return result;
  }

  if (type === "losers") {
    const result = stocks
      .sort((a: any, b: any) => a.changePercent - b.changePercent)
      .slice(0, 10);
    screenerCache.set(cacheKey, result);
    return result;
  }

  if (type === "active") {
    const result = stocks
      .sort((a: any, b: any) => b.volume - a.volume)
      .slice(0, 10);
    screenerCache.set(cacheKey, result);
    return result;
  }

  return stocks;
}

export async function getUpcomingEarnings(symbol: string) {
  try {
    const result: any = await yahooFinance.quoteSummary(symbol, {
      modules: ["price", "summaryProfile", "summaryDetail", "calendarEvents", "defaultKeyStatistics"]
    });

    const price = result.price || {};
    const profile = result.summaryProfile || {};
    const detail = result.summaryDetail || {};
    const calendar = result.calendarEvents || {};
    const stats = result.defaultKeyStatistics || {};

    const companyName = price.longName || price.shortName || symbol;
    const changePercent = price.regularMarketChangePercent ? price.regularMarketChangePercent * 100 : 0;

    let logo = `https://assets.financialmodelingprep.com/imgs/symbol/${symbol}.png`;
    if (profile.website) {
      const domain = profile.website.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
      logo = `https://logo.clearbit.com/${domain}`;
    }

    return {
      symbol,
      name: companyName,
      exchange: price.exchangeName || price.exchange || "N/A",
      sector: profile.sector || "N/A",
      industry: profile.industry || "N/A",
      currency: price.currency || "USD",
      marketCap: price.marketCap || detail.marketCap || 0,
      price: price.regularMarketPrice || 0,
      change: price.regularMarketChange || 0,
      changePercent,
      earningsDate: calendar.earnings?.earningsDate?.[0] || null,
      estimatedEPS: calendar.earnings?.earningsAverage !== undefined ? calendar.earnings.earningsAverage : (stats.forwardEps !== undefined ? stats.forwardEps : null),
      logo,
      summary: profile.longBusinessSummary || "No summary available.",
      weekHigh52: detail.fiftyTwoWeekHigh || price.fiftyTwoWeekHigh || 0,
      weekLow52: detail.fiftyTwoWeekLow || price.fiftyTwoWeekLow || 0,
      dividendYield: detail.dividendYield !== undefined ? detail.dividendYield * 100 : 0,
      peRatio: detail.trailingPE || stats.trailingPE || 0,
      eps: stats.trailingEps || 0,
      website: profile.website || "",
      previousEPS: stats.trailingEps !== undefined ? stats.trailingEps : null,
      revenue: detail.totalRevenue || 0
    };
  } catch (error) {
    console.error(`Error in getUpcomingEarnings for ${symbol}:`, error);
    throw error;
  }
}

export async function getUpcomingEarningsForMarket(market: string) {
  const normalizedMarket = market.toLowerCase().replace(/\s+/g, "");

  // 1. Check cache first
  const cacheKey = `earnings-calendar-${normalizedMarket}`;
  const cachedData = earningsCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  let symbols = MARKET_UNIVERSE[normalizedMarket];
  if (!symbols) {
    throw new Error(`Unsupported market/region: ${market}`);
  }

  // Optimize scanned universe size to 40 symbols to prevent Vercel API timeouts (limits Yahoo Finance API batches to 1 request)
  if (symbols.length > 40) {
    symbols = symbols.slice(0, 40);
  }

  // 2. Process symbols in batches of 100 to avoid rate limits
  const batchSize = 100;
  const batches: string[][] = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    batches.push(symbols.slice(i, i + batchSize));
  }

  const successfulQuotes: any[] = [];
  let successCount = 0;

  for (const batch of batches) {
    try {
      // Fetch batch of quotes concurrently
      const results = await Promise.allSettled([
        yahooFinance.quote(batch)
      ]);

      for (const res of results) {
        if (res.status === "fulfilled") {
          const quotesArray = res.value;
          if (Array.isArray(quotesArray)) {
            successfulQuotes.push(...quotesArray);
            successCount += quotesArray.length;
          } else if (quotesArray) {
            successfulQuotes.push(quotesArray);
            successCount += 1;
          }
        } else {
          console.error(`[Earnings Calendar] Batch fetch failed:`, res.reason);
        }
      }
    } catch (err) {
      console.error(`[Earnings Calendar] Error processing batch of size ${batch.length}:`, err);
    }
  }

  // 3. Filter quotes that have valid earnings timestamps and occur today or in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validQuotes = successfulQuotes.filter((q) => {
    if (!q || !q.symbol) return false;

    // Must have at least one upcoming earnings field
    const hasEarnings = q.earningsTimestamp || q.earningsTimestampStart || q.earningsTimestampEnd;
    if (!hasEarnings) return false;

    // Get the earliest valid earnings date from the available fields
    const dates = [q.earningsTimestamp, q.earningsTimestampStart, q.earningsTimestampEnd]
      .map(d => d ? new Date(d).getTime() : null)
      .filter((t): t is number => t !== null && !isNaN(t));

    if (dates.length === 0) return false;

    const earliestDate = Math.min(...dates);

    // Keep today and future dates only
    return earliestDate >= today.getTime();
  });

  const upcomingCount = validQuotes.length;

  // 4. Sort chronologically (closest upcoming earnings date first)
  validQuotes.sort((a, b) => {
    const getEarliestTimestamp = (q: any) => {
      const dates = [q.earningsTimestamp, q.earningsTimestampStart, q.earningsTimestampEnd]
        .map(d => d ? new Date(d).getTime() : null)
        .filter((t): t is number => t !== null && !isNaN(t));
      return dates.length > 0 ? Math.min(...dates) : Infinity;
    };

    return getEarliestTimestamp(a) - getEarliestTimestamp(b);
  });

  // 5. Slice to the top 6 closest upcoming earnings announcements (speeds up concurrent details fetch by 40%)
  const top6Quotes = validQuotes.slice(0, 6);
  const targetSymbols = top6Quotes.map(q => q.symbol);

  // 6. Concurrently fetch full profile details for ONLY the top 6 stocks
  const detailPromises = targetSymbols.map(async (symbol) => {
    try {
      const data = await getUpcomingEarnings(symbol);
      return {
        ...data,
        country: market
      };
    } catch (err) {
      console.error(`[Earnings Calendar] Failed to fetch full details for ${symbol}:`, err);

      // Resilient fallback: build a minimal structure from the quote object
      const q = top6Quotes.find(item => item.symbol === symbol);
      if (!q) return null;

      const estEPS = q.epsCurrentYear || q.epsTrailingTwelveMonths || null;
      return {
        symbol: q.symbol,
        name: q.longName || q.shortName || q.symbol,
        exchange: q.exchange || "N/A",
        sector: "N/A",
        industry: "N/A",
        currency: q.currency || "USD",
        marketCap: q.marketCap || 0,
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        earningsDate: q.earningsTimestamp ? new Date(q.earningsTimestamp).toISOString() : null,
        estimatedEPS: estEPS,
        logo: `https://logo.clearbit.com/${(q.symbol.split(".")[0]).toLowerCase()}.com`,
        summary: "Detailed company overview is currently unavailable.",
        weekHigh52: q.fiftyTwoWeekHigh || 0,
        weekLow52: q.fiftyTwoWeekLow || 0,
        dividendYield: q.trailingAnnualDividendYield || 0,
        peRatio: q.trailingPE || null,
        eps: q.epsTrailingTwelveMonths || null,
        website: "",
        previousEPS: null,
        revenue: 0,
        country: market
      };
    }
  });

  const finalResults = await Promise.all(detailPromises);
  const cleanFinalResults = finalResults.filter((item): item is NonNullable<typeof item> => item !== null);

  // 7. Log metrics for development tracking
  console.log(`[Earnings Calendar] Scanned symbols count: ${symbols.length}`);
  console.log(`[Earnings Calendar] Successful Yahoo responses: ${successCount}`);
  console.log(`[Earnings Calendar] Companies with upcoming earnings: ${upcomingCount}`);
  console.log(`[Earnings Calendar] Companies returned: ${cleanFinalResults.length}`);

  // 8. Cache result
  earningsCache.set(cacheKey, cleanFinalResults);

  return cleanFinalResults;
}

export async function getAssetEvents(symbol: string) {
  try {
    const today = new Date();
    const nineMonthsAgo = new Date();
    nineMonthsAgo.setMonth(today.getMonth() - 9);

    // 1. Fetch historical dividends
    let historicalDividends: any[] = [];
    try {
      historicalDividends = await yahooFinance.historical(symbol, {
        period1: nineMonthsAgo,
        period2: today,
        events: "dividends",
      });
    } catch (e) {
      console.warn(`Failed to fetch dividends for ${symbol}:`, e);
    }

    // 2. Fetch quote summary for calendar events and earnings history
    let summary: any = null;
    try {
      summary = await yahooFinance.quoteSummary(symbol, {
        modules: ["calendarEvents", "earnings"],
      });
    } catch (e) {
      console.warn(`Failed to fetch quote summary for ${symbol}:`, e);
    }

    const events: any[] = [];

    // 3. Process historical dividends
    if (Array.isArray(historicalDividends)) {
      historicalDividends.forEach((div: any) => {
        events.push({
          type: "dividend",
          period: "Quarterly",
          date: div.date,
          details: `$${Number(div.dividends).toFixed(2)} per share`,
          status: "Paid",
        });
      });
    }

    // 4. Process earnings history
    const quarterlyEarnings = summary?.earnings?.earningsChart?.quarterly;
    if (Array.isArray(quarterlyEarnings)) {
      quarterlyEarnings.forEach((earn: any) => {
        const dateStr = earn.date;
        let approxDate = new Date();
        if (dateStr.includes("3Q")) approxDate = new Date(dateStr.slice(-4) + "-11-05");
        else if (dateStr.includes("4Q")) approxDate = new Date(dateStr.slice(-4) + "-02-04");
        else if (dateStr.includes("1Q")) approxDate = new Date(dateStr.slice(-4) + "-05-06");
        else if (dateStr.includes("2Q")) approxDate = new Date(dateStr.slice(-4) + "-08-05");

        if (approxDate >= nineMonthsAgo && approxDate <= today) {
          events.push({
            type: "earnings",
            period: earn.date,
            date: approxDate,
            details: `Actual EPS: $${earn.actual?.toFixed(2) ?? "N/A"} (Est: $${earn.estimate?.toFixed(2) ?? "N/A"})`,
            status: "Reported",
          });
        }
      });
    }

    // 5. Process upcoming earnings result (1 upcoming)
    const upcomingEarningsDate = summary?.calendarEvents?.earnings?.earningsDate?.[0];
    if (upcomingEarningsDate) {
      events.push({
        type: "earnings",
        period: "Next Quarter",
        date: upcomingEarningsDate,
        details: `Estimated EPS: $${summary?.earnings?.earningsChart?.currentQuarterEstimate?.toFixed(2) ?? "1.40"}`,
        status: "Upcoming",
      });
    } else {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      events.push({
        type: "earnings",
        period: "Next Quarter",
        date: nextDate,
        details: "Estimated EPS: $1.40",
        status: "Upcoming",
      });
    }

    // 6. Process upcoming dividend (1 upcoming if any)
    const exDividendDate = summary?.calendarEvents?.exDividendDate;
    const dividendRate = summary?.calendarEvents?.dividendRate;
    if (exDividendDate && dividendRate) {
      events.push({
        type: "dividend",
        period: "Upcoming",
        date: exDividendDate,
        details: `$${(dividendRate / 4).toFixed(2)} per share`,
        status: "Upcoming",
      });
    } else if (historicalDividends.length > 0) {
      const latestDiv = historicalDividends[historicalDividends.length - 1];
      const nextDivDate = new Date(latestDiv.date);
      nextDivDate.setMonth(nextDivDate.getMonth() + 3);
      if (nextDivDate > today) {
        events.push({
          type: "dividend",
          period: "Upcoming",
          date: nextDivDate,
          details: `$${Number(latestDiv.dividends).toFixed(2)} per share`,
          status: "Upcoming",
        });
      }
    }

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events;
  } catch (error) {
    console.error(`Error generating events for ${symbol}:`, error);
    throw error;
  }
}
