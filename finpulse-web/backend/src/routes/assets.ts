import { Router, Request, Response } from 'express';
import axios from 'axios';
import YahooFinance from 'yahoo-finance2';

const router = Router();
const yahooFinance = new YahooFinance();

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

  const fallback = {
    profile: {
      name: `${symbol} Corporation`,
      sector: "Technology",
      industry: "Information Technology Services",
      country: "United States",
      employees: 120000,
      ceo: "John Doe",
      website: "https://www.google.com",
      description: `${symbol} is a leading global firm offering innovative solutions, cutting-edge products, and enterprise services to customers worldwide.`
    },
    statistics: {
      price: yahooContext?.price || 180.50,
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
      institutionOwnership: yahooContext?.majorHolders?.institutionsPercentHeld || 0.625,
      insiderOwnership: yahooContext?.majorHolders?.insidersPercentHeld || 0.005,
      institutionsFloatPercentHeld: yahooContext?.majorHolders?.institutionsFloatPercentHeld || 0.628,
      institutionsCount: 2800
    },
    sentiment: {
      score: 75,
      label: "Bullish",
      reasons: [
        "Strong market position with defensible product ecosystem",
        "Robust free cash flow generation enables dividend growth",
        "Expanding enterprise cloud opportunities"
      ]
    },
    quote: {
      exchangeName: yahooContext?.exchangeName || "NASDAQ",
      marketState: yahooContext?.marketState || "OPEN",
      currency: yahooContext?.currency || "USD"
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
  IMPORTANT: If Real-time Yahoo Finance Data Context is provided, you MUST use the exact, correct values from it (prices, change percentage, description, market cap, key statistics, CEO name, etc.) instead of generating them. Use the AI only to fill in missing/empty gaps, compile the final structure, and calculate the overall stock sentiment.`;

  const result = await queryLLM(prompt, fallback);
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

export default router;
