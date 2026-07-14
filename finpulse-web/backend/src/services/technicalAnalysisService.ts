import { yahooFinance } from '../yahooFinance.js';
import { RSI, MACD, SMA, EMA } from "technicalindicators";
import { getCompanyNews } from './companyService.js';

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
            5 * 365 * 24 * 60 * 60 * 1000
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
      rsi[rsi.length - 1];

    const latestMACD =
      macd[macd.length - 1];

    const latestSMA =
      sma50[sma50.length - 1];

    const latestEMA =
      ema20[ema20.length - 1];

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

    // Long-term structural trend additions
    let sma200 = currentPrice;
    if (closes.length >= 200) {
      let sum200 = 0;
      for (let i = closes.length - 200; i < closes.length; i++) sum200 += closes[i];
      sma200 = sum200 / 200;
    }

    if (currentPrice > sma200) {
      score += 10;
      reasons.push("Price above structural 200-day SMA");
    } else {
      score -= 15;
      reasons.push("Price below structural 200-day SMA (long-term bearish)");
    }

    const oneYearAgoIndex = Math.max(0, closes.length - 252);
    const price1y = closes[oneYearAgoIndex] || currentPrice;
    const return1y = (currentPrice - price1y) / price1y;

    const price5y = closes[0] || currentPrice;
    const return5y = (currentPrice - price5y) / price5y;

    if (return1y < -0.05) {
      score -= 10;
      reasons.push(`Weak 1-year price performance (${(return1y * 100).toFixed(1)}%)`);
    } else if (return1y > 0.05) {
      score += 5;
      reasons.push(`Strong 1-year price performance (+${(return1y * 100).toFixed(1)}%)`);
    }

    if (return5y < -0.20) {
      score -= 20;
      reasons.push(`Persistent 5-year structural decline (${(return5y * 100).toFixed(1)}%)`);
      if (currentPrice < sma200) {
        verdict = "Bearish Downtrend";
      }
    } else if (return5y > 0.20) {
      score += 5;
      reasons.push(`Strong 5-year wealth generation (+${(return5y * 100).toFixed(1)}%)`);
    }

    let recommendation =
      "HOLD";

    if (score >= 75) {
      recommendation =
        "STRONG BUY";
    } else if (
      score >= 60
    ) {
      recommendation =
        "BUY";
    } else if (
      score >= 40
    ) {
      recommendation =
        "HOLD";
    } else if (
      score >= 25
    ) {
      recommendation =
        "SELL";
    } else {
      recommendation =
        "STRONG SELL";
    }

    const confidence =
      Math.min(Math.max(score, 5), 95);

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

export async function getAIScore(
  symbol: string
) {
  // Run all 4 sub-calls in parallel with individual fallbacks.
  // Promise.allSettled ensures one failure doesn't abort the others.
  const [techResult, finResult, analystResult, newsResult] = await Promise.allSettled([
    getTechnicalIndicators(symbol),
    getFinancialHealth(symbol),
    getAnalystConsensus(symbol),
    getCompanyNews(symbol),
  ]);

  const technicals = techResult.status === 'fulfilled'
    ? techResult.value
    : { recommendation: 'HOLD', verdict: 'Neutral' };

  const financials = finResult.status === 'fulfilled'
    ? finResult.value
    : { revenueGrowth: 0, earningsGrowth: 0, profitMargin: 0 };

  const analysts = analystResult.status === 'fulfilled'
    ? analystResult.value
    : { recommendation: 'hold' };

  const news = newsResult.status === 'fulfilled'
    ? newsResult.value
    : [];

  let technicalScore = 0;

  if (technicals.recommendation === "STRONG BUY") {
    technicalScore = 40;
  } else if (technicals.recommendation === "BUY") {
    technicalScore = 30;
  } else if (technicals.recommendation === "HOLD") {
    technicalScore = 20;
  } else {
    technicalScore = 10;
  }

  let financialScore = 0;

  if ((financials as any).revenueGrowth > 0.15) {
    financialScore += 10;
  }
  if ((financials as any).earningsGrowth > 0.15) {
    financialScore += 10;
  }
  if ((financials as any).profitMargin > 0.20) {
    financialScore += 5;
  }

  let analystScore = 0;

  if (analysts.recommendation === "strong_buy") {
    analystScore = 20;
  } else if (analysts.recommendation === "buy") {
    analystScore = 15;
  } else if (analysts.recommendation === "hold") {
    analystScore = 10;
  } else {
    analystScore = 5;
  }

  let newsScore = 0;
  const headlines = (news as any[]).map((item: any) => item.title?.toLowerCase() || "");

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

  let baseScore = technicalScore + financialScore + analystScore + newsScore;

  // 5-Year historical quotes calculation to blend long-term trend
  let trendModifier = 0;
  let hasTrend = false;
  let return1y = 0;
  let return5y = 0;

  try {
    const now = new Date();
    const startDate = new Date();
    startDate.setFullYear(now.getFullYear() - 5);
    const chartResult = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: now,
      interval: '1d'
    });
    const quotes = chartResult?.quotes || [];
    if (quotes.length > 0) {
      const currentPrice = quotes[quotes.length - 1]?.close || 0;

      const oneYearAgoDate = new Date();
      oneYearAgoDate.setFullYear(now.getFullYear() - 1);
      const quote1y = quotes.find(q => q.date && new Date(q.date) >= oneYearAgoDate) || quotes[Math.max(0, quotes.length - 252)];
      const price1y = quote1y?.close || currentPrice;
      return1y = price1y ? (currentPrice - price1y) / price1y : 0;

      const price5y = quotes[0]?.close || currentPrice;
      return5y = price5y ? (currentPrice - price5y) / price5y : 0;

      const closes = quotes.map(q => q.close).filter((c): c is number => typeof c === 'number');
      const sma200 = closes.length >= 200 ? closes.slice(-200).reduce((a,b) => a+b, 0) / 200 : currentPrice;

      if (currentPrice < sma200) trendModifier -= 15;
      else trendModifier += 10;

      if (return1y < -0.05) trendModifier -= 10;
      else if (return1y > 0.05) trendModifier += 10;

      if (return5y < -0.20) trendModifier -= 20;
      else if (return5y > 0.20) trendModifier += 10;

      hasTrend = true;
    }
  } catch (err) {
    // Fail silently
  }

  if (hasTrend) {
    baseScore = Math.max(0, Math.min(100, baseScore + trendModifier));
  }

  // Determine recommendation
  let recommendation = "HOLD";
  if (baseScore >= 75) {
    recommendation = "STRONG BUY";
  } else if (baseScore >= 60) {
    recommendation = "BUY";
  } else if (baseScore >= 40) {
    recommendation = "HOLD";
  } else if (baseScore >= 25) {
    recommendation = "SELL";
  } else {
    recommendation = "STRONG SELL";
  }

  // Determine trend and momentum
  let finalTrend = "Neutral";
  if (hasTrend) {
    if (return1y > 0.05 && return5y > 0.10) finalTrend = "Bullish";
    else if (return1y < -0.05 && return5y < -0.10) finalTrend = "Bearish";
  } else {
    finalTrend = technicals.recommendation && technicals.recommendation.includes("BUY") ? "Bullish" : "Bearish";
  }

  let finalMomentum = "Neutral Momentum";
  if (technicals.verdict) {
    finalMomentum = technicals.verdict;
  }

  return {
    score: baseScore,
    technicalScore,
    financialScore,
    analystScore,
    newsScore,
    sentiment,
    recommendation,
    verdict: recommendation, // Backward compatibility for verdict prop
    trend: finalTrend,
    momentum: finalMomentum
  };
}
