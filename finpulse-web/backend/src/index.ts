import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';

import YahooFinance from 'yahoo-finance2';
import chartRoutes from "./routes/charts.js";
import { newsRoutes, companyNewsRoutes } from "./routes/news.js";
import {
  globalMarketsRoutes,
  indexSummaryRoutes,
  technicalRoutes,
  fundamentalsRoutes,
  financialHealthRoutes,
  screenerRoutes,
  marketExplanationRoutes
} from "./routes/markets.js";
import {
  aiScoreRoutes,
  analystRoutes,
  stockSentimentRoutes,
  marketBriefRoutes
} from "./routes/ai.js";
import portfolioRoutes from "./routes/portfolio.js";
import profileRoutes from "./routes/profile.js";
import watchlistsRouter from "./routes/watchlists.js";
import alertsRouter from "./routes/alerts.js";
import recentRouter from "./routes/recent.js";
import customScreenerRouter from "./routes/screeners.js";
import aiHistoryRouter from "./routes/aiHistory.js";
import { getUpcomingEarningsForMarket, getAssetEvents } from "./services/yahooService.js";
import authRoutes from "./routes/auth.js";


export const yahooFinance = new YahooFinance();
const app = express();
const prisma = new PrismaClient();

// Clean up any default seeded mock assets on startup
prisma.holding.deleteMany({
  where: {
    ticker: { in: ['RELIANCE.NS', 'NVDA', 'BTC-USD'] }
  }
}).then(() => console.log('Mock holdings cleaned up successfully!'))
  .catch(err => console.error('Failed to clean mock holdings:', err));

const rssParser = new Parser();
const PORT = process.env.PORT || 5000;

// Middleware 
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use("/api/charts", chartRoutes);
app.use("/api/news-sentiment", newsRoutes);
app.use("/api/market-explanation", marketExplanationRoutes);
app.use("/api/stock-sentiment", stockSentimentRoutes);
app.use("/api/technical", technicalRoutes);
app.use("/api/fundamentals", fundamentalsRoutes);
app.use("/api/financial-health", financialHealthRoutes);
app.use(
  "/api/analyst",
  analystRoutes
);
app.use(
  "/api/company-news",
  companyNewsRoutes
);
app.use(
  "/api/ai-score",
  aiScoreRoutes
);
app.use(
  "/api/ai",
  marketBriefRoutes
);
app.use(
  "/api/global-markets",
  globalMarketsRoutes
);
app.use(
  "/api/screener",
  screenerRoutes
);
app.use("/api/index-summary", indexSummaryRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/ai-chat", aiHistoryRouter);
app.use("/api/profile", profileRoutes);
app.use("/api/watchlists", watchlistsRouter);
app.use("/api/alerts-custom", alertsRouter);
app.use("/api/recent", recentRouter);
app.use("/api/saved-screeners", customScreenerRouter);
app.use("/api/ai-chat", aiHistoryRouter);
app.use("/api/auth", authRoutes);
// ==========================================
// 0. GLOBAL EARNINGS CALENDAR ENDPOINT
// ==========================================
app.get(["/api/earnings/calendar/:market", "/api/earnings/upcoming/:market"], async (req, res) => {
  try {
    const market = String(req.params.market || "");
    const data = await getUpcomingEarningsForMarket(market);
    res.json(data);
  } catch (error: any) {
    console.error(`Error in GET earnings endpoint for ${req.params.market}:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch earnings calendar" });
  }
});

app.get("/api/events/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "");
    const data = await getAssetEvents(symbol);
    res.json(data);
  } catch (error: any) {
    console.error(`Error in GET events for ${req.params.symbol}:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch asset events" });
  }
});

// ==========================================
// 1. OMNI-SEARCH: FINNHUB + YAHOO FINANCE
// ==========================================
app.get("/api/search", async (req, res) => {
  try {
    const q = String(
      req.query.q || ""
    ).trim();

    if (!q) {
      return res.json([]);
    }

    const yahooResults =
      await yahooFinance.search(q);

    const results =
      yahooResults.quotes
        ?.filter((item: any) => item && item.symbol && (item.shortname || item.longname))
        ?.slice(0, 20)
        .map((item: any) => ({
          symbol: item.symbol,

          yahooSymbol:
            item.symbol,

          name:
            item.shortname ||
            item.longname ||
            item.symbol,

          exchange:
            item.exchDisp ||
            item.exchange ||
            "GLOBAL",

          type:
            item.quoteType ||
            item.typeDisp ||
            "Asset",
        })) || [];

    res.json(results);
  } catch (error) {
    console.error(
      "Yahoo Search Error",
      error
    );

    res.status(500).json([]);
  }
});

// ==========================================
// 1.5. MARKET INDICES ENDPOINT FOR HERO BANNER
// ==========================================
app.get('/api/market-indices', async (req, res) => {
  try {
    const symbols = ['^GSPC', '^IXIC', '^DJI'];
    const quotes = await yahooFinance.quote(symbols);
    const formatted = quotes.map((q: any) => ({
      symbol: q.symbol,
      name: q.symbol === '^GSPC' ? 'S&P 500' : q.symbol === '^IXIC' ? 'NASDAQ' : 'DOW JONES',
      price: q.regularMarketPrice ? q.regularMarketPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---',
      changePercent: q.regularMarketChangePercent !== undefined ? q.regularMarketChangePercent : 0
    }));
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching market indices:", error);
    res.json([
      { symbol: '^GSPC', name: 'S&P 500', price: '5,432.10', changePercent: 0.45 },
      { symbol: '^IXIC', name: 'NASDAQ', price: '18,245.50', changePercent: 0.80 },
      { symbol: '^DJI', name: 'DOW JONES', price: '39,120.00', changePercent: -0.12 }
    ]);
  }
});

// ==========================================
// 2. LIVE MARKET NEWS (FINNHUB API)
// ==========================================
app.get('/api/news', async (req, res) => {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    const response = await axios.get(
      `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`
    );

    // Return top 15
    const latestNews = response.data.slice(0, 15);
    res.json(latestNews);
  } catch (error) {
    console.error("Finnhub News Error:", error);
    res.status(500).json({ error: "Failed to fetch live market news" });
  }
});

// ==========================================
// 3. GOOGLE NEWS RSS FEED
// ==========================================
app.get('/api/news/google', async (req, res) => {
  try {
    // using "when:1d" for hyper-recent breaking news to match Finnhub
    const feed = await rssParser.parseURL('https://news.google.com/rss/search?q=stock+market+finance+economy+when:1d&hl=en-US&gl=US&ceid=US:en');

    const formattedNews = feed.items.slice(0, 15).map((item, index) => {
      const unixTimestamp = Math.floor(new Date(item.pubDate || Date.now()).getTime() / 1000);

      return {
        id: `google-${index}-${unixTimestamp}`,
        headline: item.title,
        source: item.creator || item.source || 'Google News',
        datetime: unixTimestamp,
        url: item.link,
        summary: item.contentSnippet || 'Click to read the full story on Google News.',
        type: 'google'
      };
    });

    res.json(formattedNews);
  } catch (error) {
    console.error("RSS Parsing Error:", error);
    res.status(500).json({ error: "Failed to fetch Google News RSS" });
  }
});

// ==========================================
// 4. ECONOMIC CALENDAR ENDPOINT
// ==========================================
function getMockEconomicEvents(dateStr: string) {
  const day = new Date(dateStr).getUTCDay();
  if (day === 0 || day === 6) {
    return [];
  }
  const events = [
    { time: "6:30 AM", currency: "AUD", impact: "medium", event: "MI Inflation Gauge m/m", actual: "-0.4%", forecast: "0.2%", previous: "-0.3%" },
    { time: "6:30 AM", currency: "NZD", impact: "low", event: "ANZ Commodity Prices m/m", actual: "-1.0%", forecast: "0.5%", previous: "0.7%" },
    { time: "7:00 AM", currency: "AUD", impact: "low", event: "ANZ Job Advertisements m/m", actual: "-0.2%", forecast: "0.8%", previous: "2.0%" },
    { time: "11:30 AM", currency: "EUR", impact: "medium", event: "German Factory Orders m/m", actual: "1.9%", forecast: "1.1%", previous: "-3.2%" },
    { time: "12:30 PM", currency: "CHF", impact: "medium", event: "Unemployment Rate", actual: "3.1%", forecast: "3.1%", previous: "3.1%" },
    { time: "2:00 PM", currency: "EUR", impact: "medium", event: "Sentix Investor Confidence", actual: "-3.1", forecast: "-8.9", previous: "-13.4" },
    { time: "2:00 PM", currency: "GBP", impact: "medium", event: "Construction PMI", actual: "38.4", forecast: "40.1", previous: "38.2" },
    { time: "2:00 PM", currency: "GBP", impact: "low", event: "Housing Equity Withdrawal q/q", actual: "-12.6B", forecast: "-14.5B", previous: "-13.9B" },
    { time: "2:30 PM", currency: "EUR", impact: "medium", event: "PPI m/m", actual: "0.2%", forecast: "0.2%", previous: "0.7%" },
    { time: "2:30 PM", currency: "EUR", impact: "medium", event: "Retail Sales m/m", actual: "0.2%", forecast: "0.2%", previous: "-0.3%" },
    { time: "7:15 PM", currency: "USD", impact: "medium", event: "Final Services PMI", actual: "51.4", forecast: "51.4", previous: "51.3" },
    { time: "7:30 PM", currency: "USD", impact: "high", event: "ISM Services PMI", actual: "54.2", forecast: "54.2", previous: "54.5" },
    { time: "8:30 PM", currency: "USD", impact: "medium", event: "FOMC Member Waller Speaks", actual: "", forecast: "", previous: "" },
    { time: "9:00 PM", currency: "CAD", impact: "low", event: "BOC Business Outlook Survey", actual: "", forecast: "", previous: "" }
  ];

  const hash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return events.map((e, idx) => {
    const isOdd = (hash + idx) % 2 === 0;
    let actual = e.actual;
    if (e.actual && e.actual.endsWith('%')) {
      const base = parseFloat(e.actual);
      const val = base + (isOdd ? 0.1 : -0.1);
      actual = val.toFixed(1) + '%';
    } else if (e.actual) {
      const base = parseFloat(e.actual);
      const val = base + (isOdd ? 0.5 : -0.5);
      actual = isNaN(val) ? e.actual : val.toFixed(1);
    }
    return { ...e, date: dateStr, actual };
  });
}

app.get('/api/economic-calendar', async (req, res) => {
  try {
    const dateStr = String(req.query.date || new Date().toISOString().split('T')[0]);

    // Set up range from 00:00:00 to 23:59:59 UTC for the requested date
    const fromDate = `${dateStr}T00:00:00.000Z`;
    const toDate = `${dateStr}T23:59:59.000Z`;

    const url = 'https://economic-calendar.tradingview.com/events';
    const params = {
      from: fromDate,
      to: toDate,
      countries: 'US,IN,GB,EU,DE,FR,IT,ES,JP,CA,AU,CH,NZ'
    };

    const headers = {
      'Origin': 'https://www.tradingview.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    const response = await axios.get(url, { headers, params });

    if (response.data && Array.isArray(response.data.result)) {
      const events = response.data.result.map((item: any) => {
        let impact = 'low';
        if (item.importance === 0) impact = 'medium';
        else if (item.importance === 1) impact = 'high';

        const timeStr = item.date ? new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day';

        const formatVal = (val: any) => {
          if (val === null || val === undefined) return '';
          return `${val}${item.unit || ''}`;
        };

        return {
          time: timeStr,
          currency: item.currency || item.country || 'USD',
          impact,
          event: item.title || item.indicator || '',
          actual: formatVal(item.actual),
          forecast: formatVal(item.forecast),
          previous: formatVal(item.previous),
          date: dateStr
        };
      });

      return res.json(events);
    }

    res.json(getMockEconomicEvents(dateStr));
  } catch (error) {
    console.error("Economic calendar TradingView API error:", error);
    const dateStr = String(req.query.date || new Date().toISOString().split('T')[0]);
    res.json(getMockEconomicEvents(dateStr));
  }
});

// ==========================================
// 5. PRICE ALERTS (POSTGRESQL DB)
// ==========================================


// UNTIL DB is used
app.get(
  "/api/alerts",
  (req, res) => {
    res.json([]);
  }
);

// ==========================================
// SERVER START
// ==========================================
app.listen(PORT, () => {
  console.log(`FinPulse-AI Backend is running securely on port ${PORT}`);
});