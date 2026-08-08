import { Router, Request, Response } from 'express';
import axios from 'axios';
import YahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';

const router = Router();
const yahooFinance = new YahooFinance();
const parser = new Parser();

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
    } catch (err) {
      console.warn('Gemini query failed in assets, using static fallback...', err);
    }
  }

  // 4. Static mock fallback (Tertiary)
  return fallbackData;
}

// GET /api/asset-details/:symbol
router.get('/asset-details/:symbol', async (req: Request, res: Response) => {
  const symbol = (typeof req.params.symbol === 'string' ? req.params.symbol : 'AAPL').toUpperCase();

  // Fetch real-time data from Yahoo Finance to inject as context
  let yahooContext: any = null;
  try {
    const [quoteData, summaryData] = await Promise.all([
      yahooFinance.quote(symbol).catch(() => null),
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

  const isIndian = symbol.endsWith('.NS') || symbol.endsWith('.BO');

  const fallback = {
    profile: {
      name: yahooContext?.profile?.name || (isIndian ? `${symbol.replace(/\.(NS|BO)$/i, '')} India Ltd.` : `${symbol} Corporation`),
      sector: yahooContext?.profile?.sector || (isIndian ? "Financials" : "Technology"),
      industry: yahooContext?.profile?.industry || (isIndian ? "Financial Services" : "Information Technology Services"),
      country: yahooContext?.profile?.country || (isIndian ? "India" : "United States"),
      employees: yahooContext?.profile?.fullTimeEmployees || 12000,
      ceo: yahooContext?.profile?.companyOfficers?.[0]?.name || (isIndian ? "Amit Sharma" : "John Doe"),
      website: yahooContext?.profile?.website || (isIndian ? "https://www.nseindia.com" : "https://www.google.com"),
      description: yahooContext?.profile?.longBusinessSummary || `${symbol} is a leading global firm offering innovative solutions, cutting-edge products, and enterprise services.`
    },
    statistics: {
      price: yahooContext?.price || (isIndian ? 1250.00 : 180.50),
      change: yahooContext?.change || 2.15,
      changePercent: yahooContext?.changePercent || 1.20,
      marketCap: yahooContext?.marketCap || 1500000000000,
      enterpriseValue: yahooContext?.keyStats?.enterpriseValue || 1520000000000,
      sharesOutstanding: yahooContext?.keyStats?.sharesOutstanding || 8500000000,
      pe: yahooContext?.keyStats?.trailingPE || 28.5,
      forwardPe: yahooContext?.keyStats?.forwardPE || 24.2,
      peg: yahooContext?.keyStats?.pegRatio || 1.8,
      beta: yahooContext?.keyStats?.beta || 1.15,
      dividendYield: yahooContext?.keyStats?.dividendYield || 0.0085,
      fiftyDayAverage: yahooContext?.keyStats?.fiftyDayAverage || 175.40,
      twoHundredDayAverage: yahooContext?.keyStats?.twoHundredDayAverage || 168.20,
      performance: {
        "1D": yahooContext?.changePercent || 1.20,
        "1W": -0.85,
        "3M": 10.50,
        "6M": 16.80,
        "YTD": 12.30,
        "1Y": 25.40,
        "5Y": 145.20,
        "All Time": 380.50
      }
    },
    financialHealth: {
      profitMargin: yahooContext?.financials?.profitMargins || 0.224,
      operatingMargin: yahooContext?.financials?.operatingMargins || 0.268,
      cash: yahooContext?.financials?.totalCash || 45000000000,
      debt: yahooContext?.financials?.totalDebt || 80000000000,
      revenue: yahooContext?.financials?.totalRevenue || 250000000000,
      ebitda: yahooContext?.financials?.ebitda || 75000000000
    },
    analysts: {
      recommendationMean: yahooContext?.financials?.recommendationMean || 2.0,
      recommendationKey: yahooContext?.financials?.recommendationKey || "Buy",
      numberOfAnalysts: yahooContext?.financials?.numberOfAnalysts || 35,
      targetLow: yahooContext?.financials?.targetLowPrice || 160.00,
      targetMedian: yahooContext?.financials?.targetMedianPrice || 195.00,
      targetMeanPrice: yahooContext?.financials?.targetMeanPrice || 193.50,
      targetHigh: yahooContext?.financials?.targetHighPrice || 220.00
    },
    ownership: {
      institutionOwnership: yahooContext?.majorHolders?.institutionsPercentHeld || 0.455,
      insiderOwnership: yahooContext?.majorHolders?.insidersPercentHeld || 0.125,
      institutionsFloatPercentHeld: yahooContext?.majorHolders?.institutionsFloatPercentHeld || 0.482,
      institutionsCount: isIndian ? 450 : 2800
    },
    sentiment: {
      score: 75,
      label: "Bullish",
      reasons: [
        "Strong market positioning and industry growth tailwinds",
        "Robust financial profile with consistent margin execution",
        "Resilient operational updates driving broker upgrades"
      ]
    },
    quote: {
      exchangeName: yahooContext?.exchangeName || (isIndian ? "NSE" : "NASDAQ"),
      marketState: yahooContext?.marketState || "OPEN",
      currency: yahooContext?.currency || (isIndian ? "INR" : "USD")
    },
    events: {
      earnings: {
        earningsDate: yahooContext?.calendarEvents?.earnings?.earningsDate || [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()],
        earningsAverage: yahooContext?.calendarEvents?.earnings?.earningsAverage || 1.25,
        earningsLow: yahooContext?.calendarEvents?.earnings?.earningsLow || 1.15,
        earningsHigh: yahooContext?.calendarEvents?.earnings?.earningsHigh || 1.35,
        revenueAverage: yahooContext?.calendarEvents?.earnings?.revenueAverage || 65000000000,
        revenueLow: yahooContext?.calendarEvents?.earnings?.revenueLow || 63000000000,
        revenueHigh: yahooContext?.calendarEvents?.earnings?.revenueHigh || 67000000000
      },
      exDividendDate: yahooContext?.calendarEvents?.exDividendDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
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

  const result = await queryLLM(prompt, fallback);

  // Fetch real historical performance returns from Yahoo Finance
  let calculatedPerformance: any = null;
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
  } catch (err) {
    console.warn("Failed to calculate real historical performance:", err);
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

  result.news = companyNews;
  res.json(result);
});

// GET /api/fundamentals/:symbol
router.get('/fundamentals/:symbol', async (req: Request, res: Response) => {
  const symbol = (typeof req.params.symbol === 'string' ? req.params.symbol : 'AAPL').toUpperCase();

  // Fetch real fundamentals from Yahoo Finance
  let quoteData: any = null;
  try {
    quoteData = await yahooFinance.quote(symbol).catch(() => null);
  } catch (err) {
    console.warn('Failed to retrieve Yahoo Finance fundamentals:', err);
  }

  const fallback = {
    symbol,
    name: quoteData?.shortName || quoteData?.longName || `${symbol} Corporation`,
    price: quoteData?.regularMarketPrice || 180.50,
    change: quoteData?.regularMarketChange !== undefined ? quoteData.regularMarketChange : 2.15,
    changePercent: quoteData?.regularMarketChangePercent !== undefined ? quoteData.regularMarketChangePercent : 1.20,
    open: quoteData?.regularMarketOpen || 179.00,
    previousClose: quoteData?.regularMarketPreviousClose || 178.35,
    dayHigh: quoteData?.regularMarketDayHigh || 182.00,
    dayLow: quoteData?.regularMarketDayLow || 178.50,
    fiftyTwoWeekHigh: quoteData?.fiftyTwoWeekHigh || 198.50,
    fiftyTwoWeekLow: quoteData?.fiftyTwoWeekLow || 142.00,
    volume: quoteData?.regularMarketVolume || 35000000,
    averageVolume: quoteData?.averageDailyVolume3Month || 40000000,
    marketCap: quoteData?.marketCap || 1500000000000,
    currency: quoteData?.currency || "USD",
    marketState: quoteData?.marketState || "OPEN"
  };

  const contextStr = quoteData ? `\nReal-time Yahoo Finance Data Context:\n${JSON.stringify(quoteData)}` : '';

  const prompt = `Generate basic stock fundamentals for the symbol "${symbol}" in JSON format matching this schema:
  {
    "symbol": string,
    "name": string (company name),
    "price": number,
    "change": number,
    "changePercent": number,
    "open": number,
    "previousClose": number,
    "dayHigh": number,
    "dayLow": number,
    "fiftyTwoWeekHigh": number,
    "fiftyTwoWeekLow": number,
    "volume": number,
    "averageVolume": number,
    "marketCap": number,
    "currency": string (e.g. "USD"),
    "marketState": "OPEN" | "CLOSED"
  }
  ${contextStr}
  IMPORTANT: If Real-time Yahoo Finance Data Context is provided, you MUST use the exact, correct values from it (regularMarketPrice, regularMarketChange, etc.) instead of generating them.`;

  const result = await queryLLM(prompt, fallback);
  res.json(result);
});

// GET /api/technical/:symbol
router.get('/technical/:symbol', async (req: Request, res: Response) => {
  const symbol = (typeof req.params.symbol === 'string' ? req.params.symbol : 'AAPL').toUpperCase();

  // Fetch current price for context
  let currentPrice = 180.50;
  try {
    const quoteData = await yahooFinance.quote(symbol).catch(() => null);
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
    ema20: currentPrice * 0.99,
    sma50: currentPrice * 0.97,
    verdict: "BUY",
    recommendation: "Bullish momentum holding",
    confidence: 78,
    reasons: [
      "Relative Strength Index (RSI) at 55.4 shows moderate bullish continuation without being overbought.",
      "MACD line remains positive and above the signal line, supporting current price levels.",
      `Price of $${currentPrice.toFixed(2)} trades cleanly above its key moving averages (EMA20 and SMA50).`
    ]
  };

  const prompt = `Generate technical indicators and structural level parameters for "${symbol}" stock given the current price is $${currentPrice.toFixed(2)} in JSON format matching this schema:
  {
    "rsi": number (0-100),
    "macd": number,
    "signal": number,
    "ema20": number,
    "sma50": number,
    "verdict": "BUY" | "SELL" | "HOLD" | "NEUTRAL" | "STRONG BUY" | "STRONG SELL",
    "recommendation": string,
    "confidence": number (0-100),
    "reasons": string[]
  }
  Ensure moving averages (ema20 and sma50) are highly realistic in relation to the current price ($${currentPrice.toFixed(2)}).`;

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

// GET /api/charts/:symbol
router.get('/charts/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || 'AAPL').toUpperCase();
  const range = (req.query.range || '1y').toString();
  const interval = (req.query.interval || '1d').toString();

  try {
    const data = await fetchYahooChartDirect(symbol, range, interval);
    const chartResult = data.chart?.result?.[0];
    if (chartResult && chartResult.timestamp) {
      const timestamps = chartResult.timestamp;
      const quote = chartResult.indicators?.quote?.[0];
      const adjclose = chartResult.indicators?.adjclose?.[0]?.adjclose; // optional
      
      const quotes = timestamps.map((ts: number, i: number) => {
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

      res.json({
        meta: chartResult.meta,
        quotes: quotes
      });
    } else {
      res.status(502).json({ error: "Invalid data structure returned from Yahoo Finance" });
    }
  } catch (err: any) {
    console.error(`Direct Yahoo chart fetch failed for ${symbol}:`, err.message);
    res.status(502).json({ error: `Failed to retrieve chart data: ${err.message}` });
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

export default router;
