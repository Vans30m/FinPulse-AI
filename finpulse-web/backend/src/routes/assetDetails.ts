import express from "express";
import YahooFinance from "yahoo-finance2";
import NodeCache from "node-cache";

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
      const searchRes = await yahooFinance.search(symbol).catch(() => null);
      newsData = searchRes?.news || [];
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

    // Calculate technicals
    const technicals = calculateTechnicals(chart5yData);

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

    res.json({
      symbol,
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
        bookValue: defaultKeyStats.bookValue || "Not Available"
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
        insiderOwnership: majorHolders.insidersPercentHeld || "Not Available"
      },
      technicals,
      news: newsData
    });
  } catch (error: any) {
    console.error("Asset details route error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch asset details" });
  }
});

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
