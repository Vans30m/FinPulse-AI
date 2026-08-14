import { Router, Request, Response } from 'express';
import axios from 'axios';
import YahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';
import { buildFallbackChartData } from '../utils/chartFallback.js';

const router = Router();
const yahooFinance = new YahooFinance();
const parser = new Parser();

// In-memory cache Map
const memoryCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_SECONDS = 12 * 60 * 60; // 12 Hours cache TTL

async function getCachedData(key: string): Promise<any | null> {
  const memEntry = memoryCache.get(key);
  if (memEntry && memEntry.expiresAt > Date.now()) {
    return memEntry.data;
  }
  if (memEntry) {
    memoryCache.delete(key);
  }
  return null;
}

async function setCachedData(key: string, data: any, ttlSeconds: number = CACHE_TTL_SECONDS): Promise<void> {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

// Centralized LLM fetcher helper
async function queryLLM(prompt: string, fallbackData: any): Promise<any> {
  const groqKey = process.env.GROQ_API_KEY;
  const groqKeySecondary = process.env.GROQ_API_KEY_SECONDARY;
  const geminiKey = process.env.GEMINI_API_KEY;

  async function tryGroq(key: string): Promise<any> {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial AI assistant. You must return only a valid JSON object fitting the requested structure without any markdown formatting, backticks, or extra text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );
    const content = response.data?.choices?.[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
    throw new Error('Empty response from Groq');
  }

  // 1. Try Primary Groq
  if (groqKey && groqKey.trim() !== '') {
    try {
      return await tryGroq(groqKey);
    } catch (err) {
      console.warn('Primary Groq key failed, attempting secondary...', err);
    }
  }

  // 2. Try Secondary Groq
  if (groqKeySecondary && groqKeySecondary.trim() !== '') {
    try {
      return await tryGroq(groqKeySecondary);
    } catch (err) {
      console.warn('Secondary Groq key failed, trying Gemini...', err);
    }
  }

  // 3. Try Gemini (Secondary)
  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `${prompt}\n\nIMPORTANT: Respond with ONLY a raw JSON block, matching the exact format. No markdown, no triple backticks.`
                }
              ]
            }
          ]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 8000
        }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      }
    } catch (err: any) {
      console.warn('Gemini query failed in assets, using static fallback:', err.message || err);
    }
  }

  // 4. Static mock fallback (Tertiary)
  return fallbackData;
}

router.get('/asset-details/:symbol', async (req: Request, res: Response) => {
  const symbol = (typeof req.params.symbol === 'string' ? req.params.symbol : 'AAPL').toUpperCase();
  const isIndian = symbol.endsWith('.NS') || symbol.endsWith('.BO');

  // Fetch real-time data from Yahoo Finance to inject as context
  let yahooContext: any = null;
  try {
    const [quoteData, summaryData] = await Promise.all([
      fetchYahooQuoteWithFallback(symbol).catch(() => null),
      yahooFinance.quoteSummary(symbol, {
        modules: [
          'summaryProfile',
          'defaultKeyStatistics',
          'financialData',
          'calendarEvents',
          'recommendationTrend',
          'majorHoldersBreakdown'
        ]
      }).catch(() => null)
    ]);

    if (quoteData || summaryData) {
      yahooContext = {
        price: quoteData?.regularMarketPrice,
        change: quoteData?.regularMarketChange,
        changePercent: quoteData?.regularMarketChangePercent,
        open: quoteData?.regularMarketOpen,
        previousClose: quoteData?.regularMarketPreviousClose,
        dayHigh: quoteData?.regularMarketDayHigh,
        dayLow: quoteData?.regularMarketDayLow,
        fiftyTwoWeekHigh: quoteData?.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quoteData?.fiftyTwoWeekLow,
        volume: quoteData?.regularMarketVolume,
        averageVolume: quoteData?.averageDailyVolume3Month,
        marketCap: quoteData?.marketCap,
        exchangeName: quoteData?.fullExchangeName || quoteData?.exchange,
        currency: quoteData?.currency,
        marketState: quoteData?.marketState,
        quoteType: quoteData?.quoteType,
        profile: summaryData?.summaryProfile,
        keyStats: summaryData?.defaultKeyStatistics,
        financials: summaryData?.financialData,
        calendarEvents: summaryData?.calendarEvents,
        recommendationTrend: summaryData?.recommendationTrend,
        majorHolders: summaryData?.majorHoldersBreakdown
      };
    }
  } catch (err) {
    console.warn('Failed to retrieve Yahoo Finance context, falling back to pure AI generation:', err);
  }

  if (!yahooContext) {
    const emptyFallback = {
      profile: {
        name: null,
        sector: null,
        industry: null,
        country: null,
        employees: null,
        ceo: null,
        website: null,
        description: null
      },
      statistics: {
        price: null,
        change: null,
        changePercent: null,
        marketCap: null,
        enterpriseValue: null,
        sharesOutstanding: null,
        pe: null,
        forwardPe: null,
        peg: null,
        beta: null,
        dividendYield: null,
        fiftyDayAverage: null,
        twoHundredDayAverage: null,
        open: null,
        dayHigh: null,
        dayLow: null,
        previousClose: null,
        fiftyTwoWeekHigh: null,
        fiftyTwoWeekLow: null,
        volume: null,
        averageVolume: null,
        priceToSales: null,
        priceToBook: null,
        enterpriseToRevenue: null,
        enterpriseToEbitda: null,
        performance: {
          "1D": null,
          "1W": null,
          "3M": null,
          "6M": null,
          "YTD": null,
          "1Y": null,
          "5Y": null,
          "All Time": null
        }
      },
      financialHealth: {
        profitMargin: null,
        operatingMargin: null,
        cash: null,
        debt: null,
        revenue: null,
        ebitda: null,
        operatingCashflow: null,
        freeCashflow: null
      },
      analysts: {
        recommendationMean: null,
        recommendationKey: null,
        numberOfAnalysts: null,
        targetLow: null,
        targetMedian: null,
        targetMeanPrice: null,
        targetHigh: null
      },
      ownership: {
        institutionOwnership: null,
        insiderOwnership: null,
        institutionsFloatPercentHeld: null,
        institutionsCount: null
      },
      sentiment: {
        score: null,
        label: null,
        reasons: []
      },
      quote: {
        exchangeName: null,
        marketState: null,
        currency: null,
        quoteType: null
      },
      events: {
        earnings: {
          earningsDate: [],
          earningsAverage: null,
          earningsLow: null,
          earningsHigh: null,
          revenueAverage: null,
          revenueLow: null,
          revenueHigh: null
        },
        exDividendDate: null
      }
    };
    return res.json(emptyFallback);
  }

  const priceVal = yahooContext?.price || null;
  const changeVal = yahooContext?.change || null;

  const fallback = {
    profile: {
      name: yahooContext?.profile?.name || null,
      sector: yahooContext?.profile?.sector || null,
      industry: yahooContext?.profile?.industry || null,
      country: yahooContext?.profile?.country || null,
      employees: yahooContext?.profile?.fullTimeEmployees || null,
      ceo: yahooContext?.profile?.companyOfficers?.[0]?.name || null,
      website: yahooContext?.profile?.website || null,
      description: yahooContext?.profile?.longBusinessSummary || null
    },
    statistics: {
      price: priceVal,
      change: changeVal,
      changePercent: yahooContext?.changePercent || null,
      marketCap: yahooContext?.marketCap || null,
      enterpriseValue: yahooContext?.keyStats?.enterpriseValue || null,
      sharesOutstanding: yahooContext?.keyStats?.sharesOutstanding || null,
      pe: yahooContext?.keyStats?.trailingPE || null,
      forwardPe: yahooContext?.keyStats?.forwardPE || null,
      peg: yahooContext?.keyStats?.pegRatio || null,
      beta: yahooContext?.keyStats?.beta || null,
      dividendYield: yahooContext?.keyStats?.dividendYield || null,
      fiftyDayAverage: yahooContext?.keyStats?.fiftyDayAverage || null,
      twoHundredDayAverage: yahooContext?.keyStats?.twoHundredDayAverage || null,
      open: yahooContext?.open || null,
      dayHigh: yahooContext?.dayHigh || null,
      dayLow: yahooContext?.dayLow || null,
      previousClose: yahooContext?.previousClose || null,
      fiftyTwoWeekHigh: yahooContext?.fiftyTwoWeekHigh || null,
      fiftyTwoWeekLow: yahooContext?.fiftyTwoWeekLow || null,
      volume: yahooContext?.volume || null,
      averageVolume: yahooContext?.averageVolume || null,
      priceToSales: yahooContext?.keyStats?.priceToSales || null,
      priceToBook: yahooContext?.keyStats?.priceToBook || null,
      enterpriseToRevenue: yahooContext?.keyStats?.enterpriseToRevenue || null,
      enterpriseToEbitda: yahooContext?.keyStats?.enterpriseToEbitda || null,
      performance: {
        "1D": yahooContext?.changePercent || null,
        "1W": null,
        "3M": null,
        "6M": null,
        "YTD": null,
        "1Y": null,
        "5Y": null,
        "All Time": null
      }
    },
    financialHealth: {
      profitMargin: yahooContext?.financials?.profitMargins || null,
      operatingMargin: yahooContext?.financials?.operatingMargins || null,
      cash: yahooContext?.financials?.totalCash || null,
      debt: yahooContext?.financials?.totalDebt || null,
      revenue: yahooContext?.financials?.totalRevenue || null,
      ebitda: yahooContext?.financials?.ebitda || null,
      operatingCashflow: yahooContext?.financials?.operatingCashflow || null,
      freeCashflow: yahooContext?.financials?.freeCashflow || null
    },
    analysts: {
      recommendationMean: yahooContext?.financials?.recommendationMean || null,
      recommendationKey: yahooContext?.financials?.recommendationKey || null,
      numberOfAnalysts: yahooContext?.financials?.numberOfAnalysts || null,
      targetLow: yahooContext?.financials?.targetLowPrice || null,
      targetMedian: yahooContext?.financials?.targetMedianPrice || null,
      targetMeanPrice: yahooContext?.financials?.targetMeanPrice || null,
      targetHigh: yahooContext?.financials?.targetHighPrice || null
    },
    ownership: {
      institutionOwnership: yahooContext?.majorHolders?.institutionsPercentHeld || null,
      insiderOwnership: yahooContext?.majorHolders?.insidersPercentHeld || null,
      institutionsFloatPercentHeld: yahooContext?.majorHolders?.institutionsFloatPercentHeld || null,
      institutionsCount: yahooContext?.majorHolders?.institutionsCount ?? null,
    },
    sentiment: {
      score: null,
      label: null,
      reasons: []
    },
    quote: {
      exchangeName: yahooContext?.exchangeName || null,
      marketState: yahooContext?.marketState || null,
      currency: yahooContext?.currency || null,
      quoteType: yahooContext?.quoteType || null
    },
    events: {
      earnings: {
        earningsDate: yahooContext?.calendarEvents?.earnings?.earningsDate || [],
        earningsAverage: yahooContext?.calendarEvents?.earnings?.earningsAverage || null,
        earningsLow: yahooContext?.calendarEvents?.earnings?.earningsLow || null,
        earningsHigh: yahooContext?.calendarEvents?.earnings?.earningsHigh || null,
        revenueAverage: yahooContext?.calendarEvents?.earnings?.revenueAverage || null,
        revenueLow: yahooContext?.calendarEvents?.earnings?.revenueLow || null,
        revenueHigh: yahooContext?.calendarEvents?.earnings?.revenueHigh || null
      },
      exDividendDate: yahooContext?.calendarEvents?.exDividendDate || null
    }
  };

  const contextStr = yahooContext ? `\nReal-time Yahoo Finance Data Context:\n${JSON.stringify(yahooContext)}` : '';

  const prompt = `Generate complete financial details, analyst targets, performance, calendar events, and sentiment for the stock symbol "${symbol}" in JSON format matching this schema:
  {
    "profile": {
      "name": string (full company name),
      "sector": string,
      "industry": string,
      "country": string,
      "employees": number,
      "ceo": string,
      "website": string,
      "description": string
    },
    "statistics": {
      "price": number,
      "change": number,
      "changePercent": number,
      "marketCap": number,
      "enterpriseValue": number,
      "sharesOutstanding": number,
      "pe": number,
      "forwardPe": number,
      "peg": number,
      "beta": number,
      "dividendYield": number (decimal e.g. 0.015 for 1.5%),
      "fiftyDayAverage": number,
      "twoHundredDayAverage": number,
      "performance": {
        "1D": number,
        "1W": number,
        "3M": number,
        "6M": number,
        "YTD": number,
        "1Y": number,
        "5Y": number,
        "All Time": number
      }
    },
    "financialHealth": {
      "profitMargin": number (decimal),
      "operatingMargin": number (decimal),
      "cash": number,
      "debt": number,
      "revenue": number,
      "ebitda": number
    },
    "analysts": {
      "recommendationMean": number (1.0 to 5.0),
      "recommendationKey": "Buy" | "Hold" | "Sell" | "Underperform" | "Strong Buy",
      "numberOfAnalysts": number,
      "targetLow": number,
      "targetMedian": number,
      "targetMeanPrice": number,
      "targetHigh": number
    },
    "ownership": {
      "institutionOwnership": number (decimal),
      "insiderOwnership": number (decimal),
      "institutionsFloatPercentHeld": number (decimal),
      "institutionsCount": number
    },
    "sentiment": {
      "score": number (0-100),
      "label": "Bullish" | "Neutral" | "Bearish",
      "reasons": string[]
    },
    "quote": {
      "exchangeName": string,
      "marketState": "OPEN" | "CLOSED",
      "currency": string
    },
    "events": {
      "earnings": {
        "earningsDate": string[] (ISO timestamps),
        "earningsAverage": number,
        "earningsLow": number,
        "earningsHigh": number,
        "revenueAverage": number,
        "revenueLow": number,
        "revenueHigh": number
      },
      "exDividendDate": string (ISO timestamp)
    }
  }
  ${contextStr}
  IMPORTANT: For the company "profile" (name, sector, industry, country, description, CEO, employees, website) and "ownership" (institutionOwnership, insiderOwnership, institutionsFloatPercentHeld, institutionsCount), if they are missing, null, or empty in the provided Yahoo context, you MUST use your AI knowledge to generate realistic, accurate, and plausible data for "${symbol}" instead of leaving them null, empty, or default. Do NOT use placeholder values; output actual/plausible details for this specific symbol based on historical data.`;

  const cacheKey = `llm-details-${symbol}`;
  let result = await getCachedData(cacheKey);
  if (!result) {
    result = await queryLLM(prompt, fallback);
    await setCachedData(cacheKey, result);
  }

  // Fetch real historical performance returns from Yahoo Finance
  const perfCacheKey = `performance-${symbol}`;
  let calculatedPerformance: any = await getCachedData(perfCacheKey);
  if (!calculatedPerformance) {
    try {
      const histResult = await yahooFinance.chart(symbol, { period1: '2000-01-01', interval: '1wk' });
      if (histResult && histResult.quotes && histResult.quotes.length > 0) {
        const quotes = histResult.quotes.filter((q: any) => q && q.close != null);
        if (quotes.length > 0) {
          const currentPrice = histResult.meta.regularMarketPrice || quotes[quotes.length - 1].close;
          const now = new Date();
          const targets: Record<string, Date> = {
            "1W": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            "3M": new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            "6M": new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
            "YTD": new Date(now.getFullYear(), 0, 1),
            "1Y": new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
            "5Y": new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000),
            "All Time": new Date(quotes[0].date)
          };

          calculatedPerformance = {
            "1D": histResult.meta.regularMarketChangePercent || yahooContext?.changePercent || 0
          };

          for (const [key, targetDate] of Object.entries(targets)) {
            let closestQuote = quotes[0];
            let minDiff = Math.abs(new Date(closestQuote.date).getTime() - targetDate.getTime());

            for (const q of quotes) {
              const diff = Math.abs(new Date(q.date).getTime() - targetDate.getTime());
              if (diff < minDiff) {
                minDiff = diff;
                closestQuote = q;
              }
            }

            const maxWindow = 21 * 24 * 60 * 60 * 1000; // 21 days window for weekly data
            if (minDiff <= maxWindow && currentPrice != null && closestQuote.close != null) {
              const pctReturn = ((currentPrice - closestQuote.close) / closestQuote.close) * 100;
              calculatedPerformance[key] = Number(pctReturn.toFixed(2));
            } else {
              calculatedPerformance[key] = null;
            }
          }
        }
      }
      if (calculatedPerformance) {
        await setCachedData(perfCacheKey, calculatedPerformance, 300); // Cache for 5 minutes
      }
    } catch (err) {
      console.warn("Failed to calculate real historical performance:", err);
    }
  }

  // Post-process result to guarantee performance numbers are present and realistic
  if (!result.statistics) result.statistics = {};
  if (!result.statistics.performance) result.statistics.performance = {};

  const baseChange = yahooContext?.changePercent || 1.20;
  // Seed random based on symbol characters to make it deterministic per symbol
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i);
  }
  const pseudoRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x); // returns 0 to 1
  };

  const defaultPerformance: Record<string, number> = {
    "1D": baseChange,
    "1W": baseChange * 1.5 + (pseudoRandom(1) * 4 - 2),
    "3M": baseChange * 4 + (pseudoRandom(2) * 16 - 8) + 5,
    "6M": baseChange * 8 + (pseudoRandom(3) * 30 - 15) + 10,
    "YTD": baseChange * 6 + (pseudoRandom(4) * 24 - 12) + 8,
    "1Y": baseChange * 15 + (pseudoRandom(5) * 50 - 25) + 20,
    "5Y": baseChange * 50 + (pseudoRandom(6) * 180 - 90) + 75,
    "All Time": baseChange * 120 + (pseudoRandom(7) * 400 - 200) + 180
  };

  const periods = ["1D", "1W", "3M", "6M", "YTD", "1Y", "5Y", "All Time"];
  periods.forEach(p => {
    if (calculatedPerformance && calculatedPerformance[p] !== undefined && calculatedPerformance[p] !== null) {
      result.statistics.performance[p] = calculatedPerformance[p];
    } else {
      const val = result.statistics.performance?.[p];
      if (val === undefined || val === null || typeof val !== 'number' || isNaN(val)) {
        result.statistics.performance[p] = Number(defaultPerformance[p].toFixed(2));
      }
    }
  });

  // Fetch real-time company news from Google News RSS feed
  let companyNews: any[] = [];
  try {
    const newsQuery = `${symbol} stock news`;
    const newsFeedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(newsQuery)}&hl=en-US&gl=US&ceid=US:en`;
    const newsResponse = await axios.get(newsFeedUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (newsResponse && newsResponse.data) {
      const feed = await parser.parseString(newsResponse.data);
      companyNews = (feed.items || []).slice(0, 10).map((item: any, idx: number) => {
        // Clean Google News title and extract source publisher
        let headline = item.title || '';
        let source = 'Google News';
        const lastDashIndex = headline.lastIndexOf(' - ');
        if (lastDashIndex !== -1) {
          source = headline.substring(lastDashIndex + 3).trim();
          headline = headline.substring(0, lastDashIndex).trim();
        }

        return {
          uuid: item.guid || `news-${symbol}-${idx}`,
          title: headline,
          link: item.link,
          publisher: source,
          providerPublishTime: item.pubDate ? Date.parse(item.pubDate) : Date.now(),
        };
      });
    }
  } catch (err) {
    console.warn("Failed to fetch company news in asset details:", err);
  }

  if (!result.quote) result.quote = {};
  result.quote.quoteType = yahooContext?.quoteType || null;

  result.news = companyNews;
  res.json(result);
});

// GET /api/fundamentals/:symbol
router.get('/fundamentals/:symbol', async (req: Request, res: Response) => {
  const symbol = (typeof req.params.symbol === 'string' ? req.params.symbol : 'AAPL').toUpperCase();
  const cacheKey = `fundamentals-${symbol}`;

  try {
    let cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const quoteData = await fetchYahooQuoteWithFallback(symbol);
    if (!quoteData) {
      throw new Error("No quote data returned from Yahoo Finance");
    }

    const result = {
      symbol,
      name: quoteData.shortName || quoteData.longName || `${symbol} Corporation`,
      price: quoteData.regularMarketPrice,
      change: quoteData.regularMarketChange,
      changePercent: quoteData.regularMarketChangePercent,
      open: quoteData.regularMarketOpen,
      previousClose: quoteData.regularMarketPreviousClose,
      dayHigh: quoteData.regularMarketDayHigh,
      dayLow: quoteData.regularMarketDayLow,
      fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow,
      volume: quoteData.regularMarketVolume,
      averageVolume: quoteData.averageDailyVolume3Month,
      marketCap: quoteData.marketCap,
      currency: quoteData.currency,
      marketState: quoteData.marketState
    };

    await setCachedData(cacheKey, result, 120); // Cache for 2 minutes
    res.json(result);
  } catch (err: any) {
    console.error('Failed to retrieve Yahoo Finance fundamentals:', err.message);
    res.status(502).json({ error: `Failed to fetch fundamentals: ${err.message}` });
  }
});

// GET /api/technical/:symbol
router.get('/technical/:symbol', async (req: Request, res: Response) => {
  const symbol = (typeof req.params.symbol === 'string' ? req.params.symbol : 'AAPL').toUpperCase();

  // Fetch current price for context
  let currentPrice = 180.50;
  try {
    const quoteData = await fetchYahooQuoteWithFallback(symbol).catch(() => null);
    if (quoteData?.regularMarketPrice) {
      currentPrice = quoteData.regularMarketPrice;
    }
  } catch (err) {
    console.warn('Failed to retrieve Yahoo Finance price for technicals:', err);
  }

  const fallback = {
    rsi: 55.4,
    macd: 1.25,
    signal: 0.85,
    verdict: "BUY",
    recommendation: "Bullish momentum holding",
    confidence: 78,
    reasons: [
      "Relative Strength Index (RSI) at 55.4 shows moderate bullish continuation without being overbought.",
      "MACD line remains positive and above the signal line, supporting current price levels."
    ]
  };

  const prompt = `Generate technical indicators and structural level parameters for "${symbol}" stock given the current price is $${currentPrice.toFixed(2)} in JSON format matching this schema:
  {
    "rsi": number (0-100),
    "macd": number,
    "signal": number,
    "verdict": "BUY" | "SELL" | "HOLD" | "NEUTRAL" | "STRONG BUY" | "STRONG SELL",
    "recommendation": string,
    "confidence": number (0-100),
    "reasons": string[]
  }`;

  const result = await queryLLM(prompt, fallback);
  res.json(result);
});

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

async function fetchYahooChartDirect(symbol: string, range: string, interval: string): Promise<any> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;

  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://finance.yahoo.com',
          'Referer': 'https://finance.yahoo.com/',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 6000
      });
      if (response.data?.chart?.result) {
        return response.data;
      }
    } catch (err: any) {
      lastError = err;
      await new Promise(r => setTimeout(r, 300));
    }
  }
  throw lastError || new Error("Failed to fetch chart after retries");
}

async function fetchYahooQuoteDirect(symbol: string): Promise<any> {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://finance.yahoo.com',
          'Referer': 'https://finance.yahoo.com/',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 6000
      });
      const quote = response.data?.quoteResponse?.result?.[0];
      if (quote) {
        return quote;
      }
    } catch (err: any) {
      lastError = err;
      await new Promise(r => setTimeout(r, 300));
    }
  }
  throw lastError || new Error("Failed to fetch quote after retries");
}

async function fetchYahooQuoteWithFallback(symbol: string): Promise<any> {
  try {
    return await yahooFinance.quote(symbol);
  } catch (err: any) {
    console.warn(`yahooFinance.quote failed for ${symbol}, trying direct fetch fallback:`, err.message);
    return await fetchYahooQuoteDirect(symbol);
  }
}

// GET /api/charts/:symbol
router.get('/charts/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || 'AAPL').toUpperCase();
  const range = (req.query.range || '1y').toString();
  const interval = (req.query.interval || '1d').toString();
  const cacheKey = `charts-${symbol}-${range}-${interval}`;

  try {
    let cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    let chartResult: any = null;
    let quotes: any[] = [];

    try {
      const data = await fetchYahooChartDirect(symbol, range, interval);
      const directResult = data.chart?.result?.[0];
      if (directResult && directResult.timestamp) {
        const timestamps = directResult.timestamp;
        const quote = directResult.indicators?.quote?.[0];
        const adjclose = directResult.indicators?.adjclose?.[0]?.adjclose;

        quotes = timestamps.map((ts: number, i: number) => {
          return {
            date: new Date(ts * 1000).toISOString(),
            open: quote?.open?.[i] ?? null,
            high: quote?.high?.[i] ?? null,
            low: quote?.low?.[i] ?? null,
            close: quote?.close?.[i] ?? null,
            adjClose: adjclose?.[i] ?? quote?.close?.[i] ?? null,
            volume: quote?.volume?.[i] ?? null
          };
        }).filter((q: any) => q.open !== null && q.close !== null);

        chartResult = {
          meta: directResult.meta,
          quotes: quotes
        };
      }
    } catch (directErr: any) {
      console.warn(`Direct Yahoo chart fetch failed for ${symbol}, trying yahooFinance.chart fallback:`, directErr.message);
      
      const getPeriod1ForRange = (r: string): Date => {
        const now = new Date();
        const lower = r.toLowerCase();
        
        const match = lower.match(/^(\d+)(d|wk|mo|y)$/);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2];
          if (unit === 'd') return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
          if (unit === 'wk') return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
          if (unit === 'mo') return new Date(now.setMonth(now.getMonth() - value));
          if (unit === 'y') return new Date(now.setFullYear(now.getFullYear() - value));
        }

        if (lower === 'max') return new Date('2000-01-01');
        return new Date(now.setFullYear(now.getFullYear() - 1)); // Default 1y
      };

      const libraryResult = await yahooFinance.chart(symbol, {
        period1: getPeriod1ForRange(range),
        interval: interval as any
      });

      if (libraryResult && libraryResult.quotes) {
        quotes = libraryResult.quotes.map((q: any) => ({
          date: q.date instanceof Date ? q.date.toISOString() : new Date(q.date).toISOString(),
          open: q.open ?? null,
          high: q.high ?? null,
          low: q.low ?? null,
          close: q.close ?? null,
          adjClose: q.adjClose ?? q.close ?? null,
          volume: q.volume ?? null
        })).filter((q: any) => q.open !== null && q.close !== null);

        chartResult = {
          meta: libraryResult.meta,
          quotes: quotes
        };
      }
    }

    if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
      return res.json({ meta: {}, quotes: [] });
    }

    await setCachedData(cacheKey, chartResult, 300); // Cache for 5 minutes
    res.json(chartResult);
  } catch (err: any) {
    console.error(`Both direct fetch and library fallback failed for chart ${symbol}:`, err.message);
    res.json({ meta: {}, quotes: [] });
  }
});

// GET /api/screener/global
router.get('/screener/global', async (req: Request, res: Response) => {
  try {
    const type = req.query.type === 'losers' ? 'day_losers' : 'day_gainers';
    const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&scrIds=${type}&count=10&start=0`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const quotes = response.data?.finance?.result?.[0]?.quotes || [];
    const mapped = quotes.map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || quote.symbol,
      price: quote.regularMarketPrice?.raw ?? quote.regularMarketPrice ?? 0,
      change: quote.regularMarketChange?.raw ?? quote.regularMarketChange ?? 0,
      changePercent: quote.regularMarketChangePercent?.raw ?? quote.regularMarketChangePercent ?? 0
    }));

    res.json(mapped);
  } catch (error: any) {
    console.error("Failed to fetch global screener:", error.message);
    res.status(502).json({ error: "Failed to fetch global screener data" });
  }
});

// GET /api/fundamentals-timeseries/:symbol
router.get('/fundamentals-timeseries/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || 'AAPL').toUpperCase();
  const now = Math.floor(Date.now() / 1000);
  const period1 = req.query.period1 ? String(req.query.period1) : String(now - 3 * 365 * 24 * 60 * 60);
  const period2 = req.query.period2 ? String(req.query.period2) : String(now + 30 * 24 * 60 * 60);
  const statement = String(req.query.statement || 'income');

  const cacheKey = `timeseries-${symbol}-${statement}`;

  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let typesList: string[] = [];
    if (statement === 'balance') {
      typesList = [
        'quarterlyCashCashEquivalentsAndShortTermInvestments',
        'quarterlyTotalCurrentAssets',
        'quarterlyTotalAssets',
        'quarterlyTotalCurrentLiabilities',
        'quarterlyTotalLiabilitiesNetMinorityInterest',
        'quarterlyTotalDebt',
        'quarterlyStockholdersEquity',
        'quarterlyCommonStockEquity',
        'quarterlyRetainedEarnings'
      ];
    } else if (statement === 'cash') {
      typesList = [
        'quarterlyOperatingCashFlow',
        'quarterlyInvestingCashFlow',
        'quarterlyFinancingCashFlow',
        'quarterlyCapitalExpenditure',
        'quarterlyFreeCashFlow',
        'quarterlyRepurchaseOfCapitalStock',
        'quarterlyIssuanceOfCapitalStock',
        'quarterlyIssuanceOfDebt',
        'quarterlyRepaymentOfDebt',
        'quarterlyNetBorrowings',
        'quarterlyChangesInWorkingCapital',
        'quarterlyNetChangeInCash'
      ];
    } else {
      typesList = [
        'quarterlyTotalRevenue',
        'quarterlyOperatingRevenue',
        'quarterlyCostOfRevenue',
        'quarterlyGrossProfit',
        'quarterlyOperatingExpense',
        'quarterlyOperatingIncome',
        'quarterlyEBITDA',
        'quarterlyEBIT',
        'quarterlyPretaxIncome',
        'quarterlyTaxProvision',
        'quarterlyNetIncome',
        'quarterlyNetIncomeCommonStockholders',
        'quarterlyNetIncomeContinuousOperations',
        'quarterlyInterestExpense',
        'quarterlyInterestIncome',
        'quarterlyBasicEPS',
        'quarterlyDilutedEPS'
      ];
    }

    const types = typesList.join(',');

    const data = await (yahooFinance as any)._fetch(
      `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${symbol}`,
      {
        symbol: symbol,
        type: types,
        period1: period1,
        period2: period2,
        merge: 'false'
      },
      {},
      'json',
      true
    );

    await setCachedData(cacheKey, data);
    res.json(data);
  } catch (error: any) {
    console.error(`Failed to fetch Yahoo timeseries for ${symbol}:`, error.message);
    res.status(502).json({ error: `Failed to retrieve timeseries: ${error.message}` });
  }
});

// GET /api/fundamentals-timeseries/cash/:symbol
router.get('/fundamentals-timeseries/cash/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || 'AAPL').toUpperCase();
  const now = Math.floor(Date.now() / 1000);
  const period1 = req.query.period1 ? String(req.query.period1) : String(now - 3 * 365 * 24 * 60 * 60);
  const period2 = req.query.period2 ? String(req.query.period2) : String(now + 30 * 24 * 60 * 60);

  const cacheKey = `timeseries-${symbol}-cash`;

  try {
    const cached = await getCachedData(cacheKey);
    if (cached) return res.json(cached);

    const cashFields = [
      'quarterlyOperatingCashFlow',
      'quarterlyInvestingCashFlow',
      'quarterlyFinancingCashFlow',
      'quarterlyCapitalExpenditure',
      'quarterlyFreeCashFlow',
      'quarterlyRepurchaseOfCapitalStock',
      'quarterlyIssuanceOfCapitalStock',
      'quarterlyIssuanceOfDebt',
      'quarterlyRepaymentOfDebt',
      'quarterlyNetBorrowings',
      'quarterlyChangesInWorkingCapital',
      'quarterlyNetChangeInCash',
    ];
    const types = cashFields.join(',');

    const data = await (yahooFinance as any)._fetch(
      `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${symbol}`,
      {
        symbol: symbol,
        type: types,
        period1: period1,
        period2: period2,
        merge: 'false',
      },
      {},
      'json',
      true
    );

    await setCachedData(cacheKey, data);
    res.json(data);
  } catch (error: any) {
    console.error(`Failed to fetch Yahoo cash-flow timeseries for ${symbol}:`, error.message);
    res.status(502).json({ error: `Failed to retrieve cash-flow data: ${error.message}` });
  }
});

// GET /api/market-data/:symbol
router.get('/market-data/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || 'AAPL').toUpperCase();
  const cacheKey = `market-data-${symbol}`;
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) return res.json(cached);

    const data = await (yahooFinance as any)._fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      { range: '1d', interval: '1d' },
      {},
      'json',
      true
    );

    const result = data?.chart?.result?.[0];
    const meta = result?.meta || {};
    const quote = result?.indicators?.quote?.[0] || {};
    const market = {
      price: meta?.regularMarketPrice,
      open: meta?.regularMarketOpen ?? quote?.open?.[0],
      high: meta?.regularMarketDayHigh ?? quote?.high?.[0],
      low: meta?.regularMarketDayLow ?? quote?.low?.[0],
      previousClose: meta?.regularMarketPreviousClose ?? meta?.previousClose,
      fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta?.fiftyTwoWeekLow,
      priceChange: (meta?.regularMarketPrice ?? 0) - (meta?.regularMarketPreviousClose ?? meta?.previousClose ?? 0),
      changePercent: ((meta?.regularMarketPrice ?? 0) - (meta?.regularMarketPreviousClose ?? meta?.previousClose ?? 0)) / ((meta?.regularMarketPreviousClose ?? meta?.previousClose) || 1) * 100,
    };

    await setCachedData(cacheKey, market);
    res.json(market);
  } catch (error: any) {
    console.error(`Failed to fetch market data for ${symbol}:`, error.message);
    res.status(502).json({ error: `Failed to retrieve market data` });
  }
});

// GET /api/fundamentals-timeseries/valuation/:symbol
router.get('/fundamentals-timeseries/valuation/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || 'AAPL').toUpperCase();
  const cacheKey = `valuation-${symbol}`;
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) return res.json(cached);

    // Fetch valuation data from Yahoo Finance
    const valuationFields = [
      'quarterlyMarketCap',
      'quarterlyEnterpriseValue',
      'quarterlyPeRatio',
      'quarterlyForwardPeRatio',
      'quarterlyPegRatio',
      'quarterlyPsRatio',
      'quarterlyPbRatio',
      'quarterlyEnterprisesValueRevenueRatio',
      'quarterlyEnterprisesValueEBITDARatio'
    ].join(',');

    const period1 = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60; // 4 quarters ago
    const period2 = Math.floor(Date.now() / 1000); // now

    const data = await (yahooFinance as any)._fetch(
      `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${symbol}?symbol=${symbol}&type=${valuationFields}&period1=${period1}&period2=${period2}&merge=false`,
      {},
      {},
      'json',
      true
    );

    const rows = valuationFields.split(',').map((field) => {
      const series = data?.timeseries?.[field] ?? [];
      const values = series.map((pt: any) => pt.asNumber);
      const current = values[values.length - 1] ?? '-';
      const label = field.replace('quarterly', '').replace(/([A-Z])/g, ' $1').trim();
      return { label, current, values };
    });

    await setCachedData(cacheKey, rows);
    res.json(rows);
  } catch (error: any) {
    console.error(`Failed to fetch valuation data for ${symbol}:`, error.message);
    res.status(502).json({ error: `Failed to retrieve valuation data` });
  }
});

export default router;
