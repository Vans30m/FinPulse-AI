import express from "express";
import YahooFinance from "yahoo-finance2";
import NodeCache from "node-cache";
import axios from "axios";

const router = express.Router();
const yahooFinance = new YahooFinance();

// Caches with custom TTLs
const quoteCache = new NodeCache({ stdTTL: 30 });
const chartCache = new NodeCache({ stdTTL: 120 });
const financialsCache = new NodeCache({ stdTTL: 21600 }); // 6 hours
const newsCache = new NodeCache({ stdTTL: 600 }); // 10 mins
const analystCache = new NodeCache({ stdTTL: 21600 }); // 6 hours
const eventsCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

// Helper to calculate technical indicators locally
function calculateTechnicals(quotes: any[]) {
  if (!quotes || quotes.length < 50) return null;

  const closes = quotes.map(q => q.close).filter(c => c != null);
  const highs = quotes.map(q => q.high).filter(h => h != null);
  const lows = quotes.map(q => q.low).filter(l => l != null);
  const volumes = quotes.map(q => q.volume).filter(v => v != null);
  const latestClose = closes[closes.length - 1];

  // Helper moving averages
  const getSMA = (data: number[], period: number) => {
    if (data.length < period) return null;
    let sum = 0;
    for (let i = data.length - period; i < data.length; i++) sum += data[i];
    return sum / period;
  };

  const getEMA = (data: number[], period: number) => {
    if (data.length < period) return null;
    let ema = getSMA(data.slice(0, period), period) || data[0];
    const k = 2 / (period + 1);
    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  };

  // RSI 14
  const getRSI = (data: number[], period = 14) => {
    if (data.length <= period) return null;
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = data[i] - data[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      avgGain = (avgGain * 13 + (diff > 0 ? diff : 0)) / 14;
      avgLoss = (avgLoss * 13 + (diff < 0 ? -diff : 0)) / 14;
    }
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  };

  // MACD (12, 26, 9)
  const getMACD = (data: number[]) => {
    if (data.length < 26) return null;
    const ema12List: number[] = [];
    const ema26List: number[] = [];
    
    // Compute EMA lists
    let ema12 = getSMA(data.slice(0, 12), 12) || data[0];
    let ema26 = getSMA(data.slice(0, 26), 26) || data[0];
    const k12 = 2 / 13;
    const k26 = 2 / 27;

    for (let i = 0; i < data.length; i++) {
      if (i >= 12) ema12 = data[i] * k12 + ema12 * (1 - k12);
      if (i >= 26) ema26 = data[i] * k26 + ema26 * (1 - k26);
      ema12List.push(ema12);
      ema26List.push(ema26);
    }

    const macdLineList: number[] = [];
    for (let i = 26; i < data.length; i++) {
      macdLineList.push(ema12List[i] - ema26List[i]);
    }

    const signalLine = getEMA(macdLineList, 9);
    const macdVal = macdLineList[macdLineList.length - 1];
    return {
      macd: macdVal,
      signal: signalLine,
      histogram: signalLine != null ? macdVal - signalLine : null
    };
  };

  const rsi = getRSI(closes);
  const macdObj = getMACD(closes);

  return {
    rsi: rsi != null ? rsi.toFixed(2) : "N/A",
    macd: macdObj?.macd != null ? macdObj.macd.toFixed(4) : "N/A",
    macdSignal: macdObj?.signal != null ? macdObj.signal.toFixed(4) : "N/A",
    macdHistogram: macdObj?.histogram != null ? macdObj.histogram.toFixed(4) : "N/A",
    ema20: getEMA(closes, 20)?.toFixed(2) || "N/A",
    ema50: getEMA(closes, 50)?.toFixed(2) || "N/A",
    ema100: getEMA(closes, 100)?.toFixed(2) || "N/A",
    ema200: getEMA(closes, 200)?.toFixed(2) || "N/A",
    sma20: getSMA(closes, 20)?.toFixed(2) || "N/A",
    sma50: getSMA(closes, 50)?.toFixed(2) || "N/A",
    sma100: getSMA(closes, 100)?.toFixed(2) || "N/A",
    sma200: getSMA(closes, 200)?.toFixed(2) || "N/A",
    verdict: rsi != null && rsi > 70 ? "OVERBOUGHT" : rsi != null && rsi < 30 ? "OVERSOLD" : "NEUTRAL"
  };
}

function calculatePerformance(quotes: any[], currentPrice: number, previousClose: number) {
  if (!quotes || quotes.length === 0 || !currentPrice) {
    return {
      "1D": 0, "1W": 0, "3M": 0, "6M": 0, "YTD": 0, "1Y": 0, "5Y": 0, "All Time": 0
    };
  }

  const latestPrice = currentPrice;
  const now = new Date();

  const findReturn = (daysAgo: number) => {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - daysAgo);
    
    // Find quote closest to targetDate
    let closestQuote = quotes[0];
    let minDiff = Math.abs(new Date(quotes[0].date).getTime() - targetDate.getTime());
    
    for (let i = 1; i < quotes.length; i++) {
      if (!quotes[i].date) continue;
      const diff = Math.abs(new Date(quotes[i].date).getTime() - targetDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestQuote = quotes[i];
      }
    }
    
    if (closestQuote && closestQuote.close) {
      return ((latestPrice - closestQuote.close) / closestQuote.close) * 100;
    }
    return 0;
  };

  const findReturnYTD = () => {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    let closestQuote = quotes[0];
    let minDiff = Math.abs(new Date(quotes[0].date).getTime() - startOfYear.getTime());
    
    for (let i = 1; i < quotes.length; i++) {
      if (!quotes[i].date) continue;
      const diff = Math.abs(new Date(quotes[i].date).getTime() - startOfYear.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestQuote = quotes[i];
      }
    }
    
    if (closestQuote && closestQuote.close) {
      return ((latestPrice - closestQuote.close) / closestQuote.close) * 100;
    }
    return 0;
  };

  // 1D Return
  const return1D = previousClose ? ((latestPrice - previousClose) / previousClose) * 100 : 0;

  // Calculate others
  const return1W = findReturn(7);
  const return3M = findReturn(90);
  const return6M = findReturn(180);
  const returnYTD = findReturnYTD();
  const return1Y = findReturn(365);
  const return5Y = findReturn(365 * 5);
  
  // All Time (using oldest quote in 5y chart)
  const oldestClose = quotes[0]?.close;
  const returnAllTime = oldestClose ? ((latestPrice - oldestClose) / oldestClose) * 100 : return5Y;

  return {
    "1D": Number(return1D.toFixed(2)),
    "1W": Number(return1W.toFixed(2)),
    "3M": Number(return3M.toFixed(2)),
    "6M": Number(return6M.toFixed(2)),
    "YTD": Number(returnYTD.toFixed(2)),
    "1Y": Number(return1Y.toFixed(2)),
    "5Y": Number(return5Y.toFixed(2)),
    "All Time": Number(returnAllTime.toFixed(2))
  };
}

// Route to fetch unified premium asset details
router.get("/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required" });
  }

  try {
    // 1. Fetch Quote and Summary Details
    let quoteData: any = quoteCache.get(symbol);
    if (!quoteData) {
      const [quote, summary] = await Promise.all([
        yahooFinance.quote(symbol).catch(() => null),
        yahooFinance.quoteSummary(symbol, {
          modules: [
            "assetProfile",
            "summaryDetail",
            "defaultKeyStatistics",
            "financialData",
            "majorHoldersBreakdown",
            "recommendationTrend",
            "upgradeDowngradeHistory",
            "calendarEvents"
          ]
        }).catch(() => null)
      ]);
      quoteData = { quote, summary };
      quoteCache.set(symbol, quoteData);
    }

    // 2. Fetch Financial Statements (Income, Balance, CashFlow - Quarterly & Annual)
    let financialsData: any = financialsCache.get(symbol);
    if (!financialsData) {
      const financialStatements = await yahooFinance.quoteSummary(symbol, {
        modules: [
          "incomeStatementHistory",
          "incomeStatementHistoryQuarterly",
          "balanceSheetHistory",
          "balanceSheetHistoryQuarterly",
          "cashflowStatementHistory",
          "cashflowStatementHistoryQuarterly"
        ]
      }).catch(() => null);
      financialsData = financialStatements || {};
      financialsCache.set(symbol, financialsData);
    }

    // 3. Fetch News Stream
    let newsData: any = newsCache.get(symbol);
    if (!newsData) {
      const companyName = quoteData.quote?.longName || quoteData.quote?.shortName || symbol;
      const cleanBaseSymbol = symbol.split('.')[0];
      
      // Perform searches in parallel
      const [searchCompany, searchSymbol, searchBase] = await Promise.all([
        yahooFinance.search(companyName).catch(() => null),
        yahooFinance.search(symbol).catch(() => null),
        yahooFinance.search(cleanBaseSymbol).catch(() => null)
      ]);
      
      const newsList: any[] = [];
      const seenLinks = new Set<string>();
      
      const addNews = (newsArray: any[]) => {
        if (!newsArray) return;
        for (const item of newsArray) {
          if (item && item.link && !seenLinks.has(item.link)) {
            newsList.push(item);
            seenLinks.add(item.link);
          }
        }
      };
      
      addNews(searchCompany?.news || []);
      addNews(searchSymbol?.news || []);
      addNews(searchBase?.news || []);
      
      // Sort by publish time descending (latest news first)
      const getTimestamp = (item: any) => {
        if (!item.providerPublishTime) return 0;
        const val = item.providerPublishTime;
        if (typeof val === 'number') {
          // If it's in seconds, convert to ms
          return val < 1e11 ? val * 1000 : val;
        }
        const parsed = new Date(val).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };
      
      newsList.sort((a, b) => getTimestamp(b) - getTimestamp(a));
      
      newsData = newsList;
      newsCache.set(symbol, newsData);
    }

    // 4. Fetch 5-year historical daily chart candles for Technical indicators
    let chart5yData: any = chartCache.get(symbol);
    if (!chart5yData) {
      const now = new Date();
      const startDate = new Date();
      startDate.setFullYear(now.getFullYear() - 5);
      const chartResult = await yahooFinance.chart(symbol, {
        period1: startDate,
        period2: now,
        interval: '1d'
      }).catch(() => null);
      chart5yData = chartResult?.quotes || [];
      chartCache.set(symbol, chart5yData);
    }

    // Build consolidated payload conforming strictly to requested data
    const summary = quoteData.summary || {};
    const quote = quoteData.quote || {};
    const assetProfile = summary.assetProfile || {};
    const summaryDetail = summary.summaryDetail || {};
    const defaultKeyStats = summary.defaultKeyStatistics || {};
    const financialData = summary.financialData || {};
    const calendarEvents = summary.calendarEvents || {};
    const majorHolders = summary.majorHoldersBreakdown || {};
    const upgradesDowngrades = summary.upgradeDowngradeHistory || {};
    const recTrend = summary.recommendationTrend || {};

    // Calculate technicals
    const technicals = calculateTechnicals(chart5yData);

    // Calculate blended sentiment
    const sentiment = await calculateBlendedSentiment(symbol, chart5yData, financialData);

    res.json({
      symbol,
      quote: {
        currency: quote.currency || "USD",
        exchangeName: quote.exchangeName || "GLOBAL",
        marketState: quote.marketState || "CLOSED"
      },
      profile: {
        name: quote.longName || quote.shortName || quote.displayName || symbol,
        sector: assetProfile.sector || "Not Available",
        industry: assetProfile.industry || "Not Available",
        country: assetProfile.country || "Not Available",
        employees: assetProfile.fullTimeEmployees || "Not Available",
        ceo: assetProfile.companyOfficers?.[0]?.name || "Not Available",
        website: assetProfile.website || "Not Available",
        description: assetProfile.longBusinessSummary || "Not Available"
      },
      statistics: {
        price: quote.regularMarketPrice || resolvedPriceFallback(quote, summaryDetail, chart5yData),
        change: quote.regularMarketChange ?? 0,
        changePercent: quote.regularMarketChangePercent ?? 0,
        open: summaryDetail.open || "Not Available",
        previousClose: summaryDetail.previousClose || "Not Available",
        bid: summaryDetail.bid || "Not Available",
        ask: summaryDetail.ask || "Not Available",
        dayHigh: summaryDetail.dayHigh || "Not Available",
        dayLow: summaryDetail.dayLow || "Not Available",
        fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh || "Not Available",
        fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow || "Not Available",
        volume: summaryDetail.volume || "Not Available",
        averageVolume: summaryDetail.averageVolume || "Not Available",
        marketCap: summaryDetail.marketCap || "Not Available",
        enterpriseValue: defaultKeyStats.enterpriseValue || "Not Available",
        sharesOutstanding: defaultKeyStats.sharesOutstanding || "Not Available",
        float: defaultKeyStats.floatShares || "Not Available",
        beta: defaultKeyStats.beta || "Not Available",
        fiftyDayAverage: defaultKeyStats.fiftyDayAverage || "Not Available",
        twoHundredDayAverage: defaultKeyStats.twoHundredDayAverage || "Not Available",
        pe: summaryDetail.trailingPE || "Not Available",
        forwardPe: defaultKeyStats.forwardPE || "Not Available",
        peg: defaultKeyStats.pegRatio || "Not Available",
        pb: defaultKeyStats.priceToBook || "Not Available",
        ps: defaultKeyStats.priceToSalesTrailing12Months || "Not Available",
        dividendRate: summaryDetail.dividendRate || "Not Available",
        dividendYield: summaryDetail.dividendYield || "Not Available",
        eps: defaultKeyStats.trailingEps || "Not Available",
        forwardEps: defaultKeyStats.forwardEps || "Not Available",
        bookValue: defaultKeyStats.bookValue || "Not Available",
        performance: calculatePerformance(
          chart5yData, 
          quote.regularMarketPrice || resolvedPriceFallback(quote, summaryDetail, chart5yData), 
          summaryDetail.previousClose || quote.regularMarketPreviousClose
        )
      },
      financialHealth: {
        cash: financialData.totalCash || "Not Available",
        debt: financialData.totalDebt || "Not Available",
        cashPerShare: financialData.totalCashPerShare || "Not Available",
        operatingMargin: financialData.operatingMargins || "Not Available",
        profitMargin: financialData.profitMargins || "Not Available",
        grossMargin: financialData.grossMargins || "Not Available",
        roe: financialData.returnOnAssets || "Not Available",
        roa: financialData.returnOnEquity || "Not Available",
        revenue: financialData.totalRevenue || "Not Available",
        revenueGrowth: financialData.revenueGrowth || "Not Available",
        ebitda: financialData.ebitda || "Not Available",
        freeCashFlow: financialData.freeCashflow || "Not Available",
        operatingCashFlow: financialData.operatingCashflow || "Not Available"
      },
      analysts: {
        recommendationMean: financialData.recommendationMean || "Not Available",
        recommendationKey: financialData.recommendationKey || "Not Available",
        targetMeanPrice: financialData.targetMeanPrice || "Not Available",
        targetHigh: financialData.targetHighPrice || "Not Available",
        targetLow: financialData.targetLowPrice || "Not Available",
        targetMedian: financialData.targetMedianPrice || "Not Available",
        numberOfAnalysts: financialData.numberOfAnalystOpinions || "Not Available",
        upgradesDowngrades: upgradesDowngrades.history || []
      },
      financials: financialsData,
      events: {
        earnings: calendarEvents.earnings || "Not Available",
        exDividendDate: calendarEvents.exDividendDate || "Not Available",
        dividendDate: calendarEvents.dividendDate || "Not Available"
      },
      ownership: {
        institutionOwnership: majorHolders.institutionsPercentHeld || "Not Available",
        insiderOwnership: majorHolders.insidersPercentHeld || "Not Available",
        institutionsFloatPercentHeld: majorHolders.institutionsFloatPercentHeld || "Not Available",
        institutionsCount: majorHolders.institutionsCount || "Not Available"
      },
      technicals,
      sentiment,
      news: newsData
    });
  } catch (error: any) {
    console.error("Asset details route error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch asset details" });
  }
});

async function calculateBlendedSentiment(symbol: string, quotes: any[], financialData: any) {
  let newsScore = 50;
  let hasNews = false;

  try {
    const response = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "NEWS_SENTIMENT",
        tickers: symbol,
        limit: 20,
        sort: "LATEST",
        apikey: process.env.ALPHA_VANTAGE_API_KEY
      },
      timeout: 3000
    });

    const feed = response.data.feed || [];
    if (feed.length > 0) {
      const avgScore = feed.reduce((sum: number, item: any) => sum + Number(item.overall_sentiment_score || 0), 0) / feed.length;
      newsScore = Math.max(0, Math.min(100, Math.round(50 + avgScore * 50)));
      hasNews = true;
    }
  } catch (newsErr) {
    // Fail silently
  }

  let trendScore = 50;
  let hasTrend = false;
  const reasons: string[] = [];

  if (quotes && quotes.length > 0) {
    const currentPrice = quotes[quotes.length - 1]?.close || 0;

    const now = new Date();
    const oneYearAgoDate = new Date();
    oneYearAgoDate.setFullYear(now.getFullYear() - 1);
    const quote1y = quotes.find(q => q.date && new Date(q.date) >= oneYearAgoDate) || quotes[Math.max(0, quotes.length - 252)];
    const price1y = quote1y?.close || currentPrice;
    const return1y = price1y ? (currentPrice - price1y) / price1y : 0;

    const price5y = quotes[0]?.close || currentPrice;
    const return5y = price5y ? (currentPrice - price5y) / price5y : 0;

    const closes = quotes.map(q => q.close).filter((c): c is number => typeof c === 'number');
    const sma50 = closes.length >= 50 ? closes.slice(-50).reduce((a,b) => a+b, 0) / 50 : currentPrice;
    const sma200 = closes.length >= 200 ? closes.slice(-200).reduce((a,b) => a+b, 0) / 200 : currentPrice;

    let scoreModifiers = 0;

    if (currentPrice > sma50) {
      scoreModifiers += 10;
      reasons.push("Price trading above medium-term 50-day SMA");
    } else {
      scoreModifiers -= 10;
      reasons.push("Price trading below medium-term 50-day SMA");
    }

    if (currentPrice > sma200) {
      scoreModifiers += 15;
      reasons.push("Price trading above structural 200-day SMA");
    } else {
      scoreModifiers -= 15;
      reasons.push("Price trading below structural 200-day SMA (long-term bearish)");
    }

    if (return1y > 0.05) {
      scoreModifiers += 10;
      reasons.push(`Strong 1-year price performance (+${(return1y * 100).toFixed(1)}%)`);
    } else if (return1y < -0.05) {
      scoreModifiers -= 10;
      reasons.push(`Weak 1-year price performance (${(return1y * 100).toFixed(1)}%)`);
    }

    if (return5y > 0.20) {
      scoreModifiers += 15;
      reasons.push(`Strong 5-year wealth generation (+${(return5y * 100).toFixed(1)}%)`);
    } else if (return5y < -0.20) {
      scoreModifiers -= 20;
      reasons.push(`Persistent 5-year structural decline (${(return5y * 100).toFixed(1)}%)`);
    }

    trendScore = Math.max(0, Math.min(100, 50 + scoreModifiers));
    hasTrend = true;
  }

  let finalScore = 50;
  if (hasNews && hasTrend) {
    finalScore = Math.max(0, Math.min(100, Math.round(newsScore * 0.35 + trendScore * 0.65)));
    reasons.unshift(`Short-term news sentiment is positive (Score: ${newsScore}%)`);
  } else if (hasTrend) {
    finalScore = trendScore;
  } else if (hasNews) {
    finalScore = newsScore;
    reasons.push(`Short-term news sentiment (Score: ${newsScore}%)`);
  }

  let label = "Neutral";
  if (finalScore >= 62) label = "Bullish";
  if (finalScore <= 42) label = "Bearish";

  return {
    score: finalScore,
    label,
    reasons
  };
}

function resolvedPriceFallback(quote: any, summaryDetail: any, chartData: any[]) {
  if (quote?.regularMarketPrice) return quote.regularMarketPrice;
  if (summaryDetail?.regularMarketPrice) return summaryDetail.regularMarketPrice;
  if (chartData && chartData.length > 0) {
    const last = chartData[chartData.length - 1];
    return last?.close || 0;
  }
  return 0;
}

export default router;
