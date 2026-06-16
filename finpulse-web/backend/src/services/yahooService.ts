import YahooFinance from "yahoo-finance2";
import {
  RSI,
  MACD,
  SMA,
  EMA,
} from "technicalindicators";
import { GLOBAL_INDICES } from "../config/globalIndices.js";
import { DOMESTIC_INDICES } from "../config/domesticIndices.js";
import NodeCache from "node-cache";

const screenerCache =
  new NodeCache({
    stdTTL: 60,
  });

const yahooFinance =
  new YahooFinance();

// ==========================================
// NEW WORKING HISTORICAL RECHARTS TIMELINE METHOD
// ==========================================
export async function getAssetsHistoricalGrowth(
  symbols: string[],
  initialInvestment: number
) {
  try {
    const principal = initialInvestment || 10000;
    
    // Set up standard 5-Year intervals
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 5);

    // Fetch overlapping array promises asynchronously
    // Fetch overlapping array promises asynchronously
    const historyPromises = symbols.map(async (symbol) => {
      try {
        const queryResult = await yahooFinance.historical(symbol, {
          period1: startDate, // ✅ Pass the native Date object directly
          period2: endDate,   // ✅ Pass the native Date object directly
          interval: '1mo'
        });
        return { symbol, data: queryResult };
      } catch (err) {
        console.error(`Failed fetching historical chart metrics for ${symbol}:`, err);
        return { symbol, data: [] };
      }
    });

    const rawResults = await Promise.all(historyPromises);
    const dateMap: Record<string, any> = {};

    rawResults.forEach((result) => {
      const { symbol, data } = result;
      // ✅ Fix 1: Explicitly guard against missing or empty data arrays upfront
      if (!data || data.length === 0) return;

      // ✅ Fix 2: Add safe fallback check so TypeScript knows it's an object
      const firstEntry = data[0];
      if (!firstEntry) return;
      const initialClose = firstEntry.adjClose || firstEntry.close || 1;

      data.forEach((candle: any) => {
        if (!candle || !candle.date) return;
        const dateStr = new Date(candle.date).toISOString().slice(0, 7); // Generates clean "YYYY-MM" matrix
        const currentClose = candle.adjClose || candle.close || 0;

        if (!dateMap[dateStr]) {
          dateMap[dateStr] = { date: dateStr };
        }

        const growthValue = principal * (currentClose / initialClose);
        dateMap[dateStr][symbol] = parseFloat(growthValue.toFixed(2));
      });
    });

    // Chronological order formatting alignment
    const sortedGrowthData = Object.values(dateMap).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );

    // Generate summaries metadata card structures mapping standard interface keys
    const assetSummaries = rawResults.map((result) => {
      const { symbol, data } = result;
      if (!data || data.length === 0) return null;

      // ✅ Fix 3: Secure the variables with explicit first/last element guards
      const firstEntry = data[0];
      const lastEntry = data[data.length - 1];
      if (!firstEntry || !lastEntry) return null;

      const firstPrice = firstEntry.adjClose || firstEntry.close || 1;
      const lastPrice = lastEntry.adjClose || lastEntry.close || 0;
      
      const totalReturnPercent = ((lastPrice - firstPrice) / firstPrice) * 100;
      const finalPortfolioValue = principal * (lastPrice / firstPrice);

      return {
        symbol,
        name: `${symbol} Equity Asset`,
        type: 'Stock',
        endValue: parseFloat(finalPortfolioValue.toFixed(2)),
        totalReturn: parseFloat(totalReturnPercent.toFixed(2)),
        annualReturn: parseFloat((totalReturnPercent / 5).toFixed(2)),
      };
    }).filter(Boolean);

    return {
      growthData: sortedGrowthData,
      summaries: assetSummaries
    };
  } catch (error) {
    console.error("Historical growth compilation calculation crashed:", error);
    throw error;
  }
}

// ==========================================
// PRE-EXISTING TERMINAL PIPELINES
// ==========================================
export async function getYahooCandles(
  symbol: string,
  range: string
) {
  try {
    const result =
      await yahooFinance.chart(
        symbol,
        {
          period1: new Date(
            Date.now() -
              365 *
                24 *
                60 *
                60 *
                1000
          ),
          period2: new Date(),
          interval: "1d",
        }
      );

    return result;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

export async function getTechnicalIndicators(
  symbol: string
) {
  try {
    const result =
      await yahooFinance.chart(
        symbol,
        {
          period1: new Date(
            Date.now() -
              365 * 24 * 60 * 60 * 1000
          ),
          period2: new Date(),
          interval: "1d",
        }
      );

    const closes: number[] =
      (result.quotes || [])
        .map((q: any) => q.close)
        .filter(
          (v): v is number =>
            typeof v === "number"
        );

    if (closes.length < 50) {
      throw new Error(
        "Not enough price data"
      );
    }

    const rsi =
      RSI.calculate({
        values: closes,
        period: 14,
      });

    const macd =
      MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      });

    const sma50 =
      SMA.calculate({
        values: closes,
        period: 50,
      });

    const ema20 =
      EMA.calculate({
        values: closes,
        period: 20,
      });

    const latestRSI =
      rsi.at(-1);

    const latestMACD =
      macd.at(-1);

    const latestSMA =
      sma50.at(-1);

    const latestEMA =
      ema20.at(-1);

    if (
      latestRSI === undefined ||
      latestMACD === undefined ||
      latestSMA === undefined ||
      latestEMA === undefined
    ) {
      throw new Error(
        "Failed to calculate indicators"
      );
    }

    const macdValue =
      Number(
        latestMACD.MACD ?? 0
      );

    const signalValue =
      Number(
        latestMACD.signal ?? 0
      );
    let verdict = "Neutral";

    if (
      latestRSI < 30 &&
      macdValue > signalValue
    ) {
      verdict = "Strong Buy Setup";
    } else if (
      latestRSI > 70 &&
      macdValue < signalValue
    ) {
      verdict = "Potential Pullback";
    } else if (
      macdValue > signalValue
    ) {
      verdict = "Bullish Momentum";
    } else {
      verdict = "Bearish Momentum";
    }

    const reasons: string[] = [];
    let score = 50;

    if (
      latestRSI > 40 &&
      latestRSI < 70
    ) {
      score += 10;
      reasons.push(
        "RSI indicates healthy momentum"
      );
    }

    if (
      macdValue > signalValue
    ) {
      score += 15;
      reasons.push(
        "Bullish MACD crossover"
      );
    }

    const currentPrice =
      closes[closes.length - 1]!;

    if (
      currentPrice > latestEMA
    ) {
      score += 10;
      reasons.push(
        "Price above EMA20"
      );
    }

    if (
      currentPrice > latestSMA
    ) {
      score += 10;
      reasons.push(
        "Price above SMA50"
      );
    }

    let recommendation =
      "HOLD";

    if (score >= 80) {
      recommendation =
        "STRONG BUY";
    } else if (
      score >= 65
    ) {
      recommendation =
        "BUY";
    } else if (
      score >= 50
    ) {
      recommendation =
        "HOLD";
    } else {
      recommendation =
        "SELL";
    }

    const confidence =
      Math.min(score, 95);

    return {
      symbol,
      rsi: Number(latestRSI).toFixed(2),
      macd: macdValue.toFixed(2),
      signal: signalValue.toFixed(2),
      histogram: Number(latestMACD.histogram ?? 0).toFixed(2),
      sma50: Number(latestSMA).toFixed(2),
      ema20: Number(latestEMA).toFixed(2),
      verdict,
      recommendation,
      confidence,
      reasons,
    };
  } catch (error) {
    console.error(
      "Technical indicator error:",
      error
    );
    throw error;
  }
}

export async function getFundamentals(
  symbol: string
) {
  try {
    const quote =
      await yahooFinance.quote(
        symbol
      );

    return {
      symbol,
      marketCap: quote.marketCap,
      peRatio: quote.trailingPE,
      eps: quote.epsTrailingTwelveMonths,
      dividendYield: quote.dividendYield,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getFinancialHealth(
  symbol: string
) {
  try {
    const result =
      await yahooFinance.quoteSummary(
        symbol,
        {
          modules: [
            "financialData",
            "defaultKeyStatistics",
          ],
        }
      );

    return {
      symbol,
      revenue: result.financialData?.totalRevenue ?? 0,
      revenueGrowth: result.financialData?.revenueGrowth ?? 0,
      earningsGrowth: result.financialData?.earningsGrowth ?? 0,
      profitMargin: result.financialData?.profitMargins ?? 0,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getAnalystConsensus(
  symbol: string
) {
  try {
    const result =
      await yahooFinance.quoteSummary(
        symbol,
        {
          modules: [
            "financialData",
          ],
        }
      );

    return {
      recommendation: result.financialData?.recommendationKey ?? "N/A",
      recommendationMean: result.financialData?.recommendationMean ?? 0,
      analystCount: result.financialData?.numberOfAnalystOpinions ?? 0,
      targetPrice: result.financialData?.targetMeanPrice ?? 0,
      currentPrice: result.financialData?.currentPrice ?? 0,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getCompanyNews(
  symbol: string
) {
  const result: any =
    await yahooFinance.search(
      symbol
    );
  return result.news?.slice(0, 10) || [];
}

export async function getAIScore(
  symbol: string
) {
  const technicals =
    await getTechnicalIndicators(
      symbol
    );

  const financials =
    await getFinancialHealth(
      symbol
    );

  const analysts =
    await getAnalystConsensus(
      symbol
    );

  const news =
    await getCompanyNews(
      symbol
    );

  let technicalScore = 0;

  if (
    technicals.recommendation ===
    "STRONG BUY"
  ) {
    technicalScore = 40;
  } else if (
    technicals.recommendation ===
    "BUY"
  ) {
    technicalScore = 30;
  } else if (
    technicals.recommendation ===
    "HOLD"
  ) {
    technicalScore = 20;
  } else {
    technicalScore = 10;
  }

  let financialScore = 0;

  if (financials.revenueGrowth > 0.15) {
    financialScore += 10;
  }
  if (financials.earningsGrowth > 0.15) {
    financialScore += 10;
  }
  if (financials.profitMargin > 0.20) {
    financialScore += 5;
  }

  let analystScore = 0;

  if (
    analysts.recommendation ===
    "strong_buy"
  ) {
    analystScore = 20;
  } else if (
    analysts.recommendation ===
    "buy"
  ) {
    analystScore = 15;
  } else if (
    analysts.recommendation ===
    "hold"
  ) {
    analystScore = 10;
  } else {
    analystScore = 5;
  }

  let newsScore = 0;
  const headlines = news.map((item: any) => item.title?.toLowerCase() || "");

  const positiveWords = ["buy", "bullish", "growth", "record", "strong", "beat", "upgrade", "surge", "gain"];
  const negativeWords = ["sell", "bearish", "drop", "weak", "downgrade", "fall", "decline", "miss", "risk"];

  let sentiment = 0;

  headlines.forEach((headline: string) => {
    positiveWords.forEach((word) => {
      if (headline.includes(word)) sentiment++;
    });
    negativeWords.forEach((word) => {
      if (headline.includes(word)) sentiment--;
    });
  });

  if (sentiment >= 5) {
    newsScore = 15;
  } else if (sentiment >= 2) {
    newsScore = 10;
  } else if (sentiment >= 0) {
    newsScore = 5;
  } else {
    newsScore = 0;
  }

  const score = technicalScore + financialScore + analystScore + newsScore;

  return {
    score,
    technicalScore,
    financialScore,
    analystScore,
    newsScore,
    sentiment,
  };
}

export async function getGlobalMarketQuote(
  symbol: string,
  name: string,
  region: string
) {
  const quote =
    await yahooFinance.quote(symbol);

  if (!quote.regularMarketPrice) {
    return null;
  }

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
  };
}

export async function getAllGlobalMarkets() {
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

export async function getMarketHistory(
  symbol: string,
  range: string = "1mo"
) {
  let days = 30;

  if (range === "1d") days = 1;
  if (range === "1w") days = 7;
  if (range === "1mo") days = 30;
  if (range === "6mo") days = 180;
  if (range === "1y") days = 365;

  const chart =
    await yahooFinance.chart(
      symbol,
      {
        period1: new Date(
          Date.now() -
            days *
              24 *
              60 *
              60 *
              1000
        ),
        period2: new Date(),
        interval: "1d",
      }
    );

  return (
    chart.quotes?.map(
      (quote: any) => ({
        date: quote.date,
        price: quote.close,
      })
    ) || []
  );
}

export async function getMarketScreener(
  market: string,
  type: string
) {
  const data =
    await getAllGlobalMarkets();

  const filtered =
    data.filter((item: any) => {
      if (market === "india") {
        return item.region === "India";
      }
      if (market === "us") {
        return item.region === "US";
      }
      return true;
    });

  if (type === "gainers") {
    return filtered
      .sort((a: any, b: any) => b.changePercent - a.changePercent)
      .slice(0, 10);
  }
  if (type === "losers") {
    return filtered
      .sort((a: any, b: any) => a.changePercent - b.changePercent)
      .slice(0, 10);
  }
  if (type === "active") {
    return filtered
      .sort((a: any, b: any) => b.volume - a.volume)
      .slice(0, 10);
  }
  return filtered;
}

export async function getDomesticScreener(
  type: string
) {
  const cacheKey = `domestic-${type}`;
  const cached = screenerCache.get(cacheKey);

  if (cached) {
    return cached;
  }
  
  const quotes =
    await Promise.all(
      DOMESTIC_INDICES.map(
        async (symbol) => {
          try {
            const quote =
              await yahooFinance.quote(
                symbol
              );

            return {
              symbol: quote.symbol,
              name: quote.shortName || quote.longName,
              price: quote.regularMarketPrice,
              change: quote.regularMarketChange,
              changePercent: quote.regularMarketChangePercent,
              volume: quote.regularMarketVolume,
            };
          } catch {
            return null;
          }
        }
      )
    );

  const stocks = quotes.filter(Boolean);

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