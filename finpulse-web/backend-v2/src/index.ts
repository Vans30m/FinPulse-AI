import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import axios from 'axios';
import Parser from 'rss-parser';

// ── Route imports conforming to the original premium backend ───────────────
import chartRoutes from "./routes/charts.js";
import { newsRoutes, companyNewsRoutes } from "./routes/news.js";
import {
  technicalRoutes,
  fundamentalsRoutes,
  financialHealthRoutes,
  screenerRoutes,
  marketExplanationRoutes,
  globalMarketsRoutes
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
import recentRouter from "./routes/recent.js";
import customScreenerRouter from "./routes/screeners.js";
import aiHistoryRouter from "./routes/aiHistory.js";
import authRoutes from "./routes/auth.js";
import assetDetailsRoute from "./routes/assetDetails.js";
import { getAssetEvents } from "./services/yahooService.js";
import { YahooClient } from "./services/YahooClient.js";

const app  = express();
const PORT = process.env.PORT || 3001;
const rssParser = new Parser();

// ── CORS ───────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS: string[] = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  'http://localhost:3001',
];
if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(...process.env.FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean));
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin "${origin}" is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
};

app.set('trust proxy', 1);
app.use(compression());
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Cache-Control edge headers ──────────────────────────────────────────────
const PRIVATE_ROUTE_PREFIXES = [
  '/api/portfolio', '/api/watchlists', '/api/alerts',
  '/api/profile', '/api/auth', '/api/ai-chat',
  '/api/saved-screeners', '/api/recent',
];

const PUBLIC_ROUTE_CACHE: [RegExp, number][] = [
  [/^\/api\/screener\/global($|\/)/, 300],
  [/^\/api\/earnings($|\/)/, 43200],
  [/^\/api\/market-indices($|\/)/, 120],
  [/^\/api\/news($|\/)/, 300],
  [/^\/api\/economic-calendar($|\/)/, 3600],
  [/^\/api\/charts($|\/)/, 300],
  [/^\/api\/ai\/(?!chat)/, 300],
  [/^\/api\/fundamentals($|\/)/, 120],
  [/^\/api\/asset-details($|\/)/, 120],
  [/^\/api\/technical($|\/)/, 300],
  [/^\/api\/analyst($|\/)/, 21600],
  [/^\/api\/financial-health($|\/)/, 21600],
  [/^\/api\/search($|\/)/, 21600],
  [/^\/api\/news-sentiment($|\/)/, 21600],
  [/^\/api\/company-news($|\/)/, 21600],
];

app.use((req: Request, res: Response, next: NextFunction) => {
  const isPrivate = PRIVATE_ROUTE_PREFIXES.some(prefix => req.path.startsWith(prefix));
  if (isPrivate) {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  }
  for (const [pattern, maxAge] of PUBLIC_ROUTE_CACHE) {
    if (pattern.test(req.path)) {
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(maxAge / 2)}, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
      return next();
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// ── Health endpoints ────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'FinPulse AI Backend v2', version: '2.0.0', port: PORT });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ── Route registration exactly matching the original premium backend ───────
app.use("/api/charts", chartRoutes);
app.use("/api/news-sentiment", newsRoutes);
app.use("/api/market-explanation", marketExplanationRoutes);
app.use("/api/stock-sentiment", stockSentimentRoutes);
app.use("/api/technical", technicalRoutes);
app.use("/api/fundamentals", fundamentalsRoutes);
app.use("/api/financial-health", financialHealthRoutes);
app.use("/api/analyst", analystRoutes);
app.use("/api/company-news", companyNewsRoutes);
app.use("/api/ai-score", aiScoreRoutes);
app.use("/api/ai", marketBriefRoutes);
app.use("/api/screener", screenerRoutes);
app.use("/api/global-markets", globalMarketsRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/ai-chat", aiHistoryRouter);
app.use("/api/profile", profileRoutes);
app.use("/api/watchlists", watchlistsRouter);
app.use("/api/recent", recentRouter);
app.use("/api/saved-screeners", customScreenerRouter);
app.use("/api/auth", authRoutes);
app.use("/api/asset-details", assetDetailsRoute);

app.get("/api/events/:symbol", async (req: Request, res: Response) => {
  try {
    const symbol = String(req.params['symbol'] || "");
    const data = await getAssetEvents(symbol);
    res.json(data);
  } catch (error: any) {
    console.error(`Error in GET events for ${req.params['symbol']}:`, error);
    res.status(500).json({ error: error.message || "Failed to fetch asset events" });
  }
});

// ── economic-calendar, news alerts and global inline routes ─────────────────
import NodeCache from 'node-cache';
const searchCache = new NodeCache({ stdTTL: 3600 });

app.get("/api/search", async (req: Request, res: Response) => {
  try {
    const q = String(req.query['q'] || "").trim();
    if (!q) return res.json([]);

    const cachedResults = searchCache.get(q);
    if (cachedResults) return res.json(cachedResults);

    const lowerQ = q.toLowerCase();
    const yahooResults = await YahooClient.search(q, { quotesCount: 20 });
    const results = yahooResults.quotes
      ?.filter((item: any) => item && item.symbol && (item.shortname || item.longname))
      ?.slice(0, 20)
      .map((item: any) => {
        let name = item.shortname || item.longname || item.symbol;
        if (item.symbol && item.symbol.toUpperCase() === 'CL=F') {
          name = 'USOil';
        }
        return {
          symbol: item.symbol,
          yahooSymbol: item.symbol,
          name: name,
          exchange: item.exchDisp || item.exchange || "GLOBAL",
          type: item.quoteType || item.typeDisp || "Asset",
        };
      }) || [];

    // Inject manual Commodity mappings if gold/silver/oil are searched
    const commodityMocks: any[] = [];
    if (lowerQ.includes("gold") || lowerQ === "gc=f") {
      commodityMocks.push({ symbol: "GC=F", yahooSymbol: "GC=F", name: "Gold Futures", exchange: "COMEX", type: "FUTURE" });
    }
    if (lowerQ.includes("silver") || lowerQ === "si=f") {
      commodityMocks.push({ symbol: "SI=F", yahooSymbol: "SI=F", name: "Silver Futures", exchange: "COMEX", type: "FUTURE" });
    }
    if (lowerQ.includes("oil") || lowerQ.includes("crude") || lowerQ === "cl=f") {
      commodityMocks.push({ symbol: "CL=F", yahooSymbol: "CL=F", name: "USOil", exchange: "NYMEX", type: "FUTURE" });
    }

    const merged = [...commodityMocks, ...results];
    const deduped = Array.from(new Map(merged.map(item => [item.symbol, item])).values()).slice(0, 20);

    searchCache.set(q, deduped);
    res.json(deduped);
  } catch (error) {
    console.error("Yahoo Search Error", error);
    res.status(500).json([]);
  }
});

app.get('/api/news', async (_req: Request, res: Response) => {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    const response = await axios.get(
      `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`
    );
    res.json(response.data.slice(0, 15));
  } catch (error) {
    console.error("Finnhub News Error:", error);
    res.status(500).json({ error: "Failed to fetch live market news" });
  }
});

app.get('/api/news/google', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(
      'https://news.google.com/rss/search?q=stock+market+finance+economy+when:1d&hl=en-US&gl=US&ceid=US:en',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    const feed = await rssParser.parseString(response.data);
    const formattedNews = feed.items.slice(0, 15).map((item, index) => {
      const unixTimestamp = Math.floor(new Date(item.pubDate || Date.now()).getTime() / 1000);
      return {
        id: `google-${index}-${unixTimestamp}`,
        headline: item.title,
        source: item.creator || item.source || 'Google News',
        datetime: unixTimestamp,
        url: item.link,
        summary: item.contentSnippet || 'Click to read the full story on Google News.',
        type: 'google',
      };
    });
    res.json(formattedNews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Google News RSS" });
  }
});

function getMockEconomicEvents(dateStr: string) {
  const events = [
    { time: "7:30 PM", currency: "USD", impact: "high", event: "ISM Services PMI", actual: "54.2", forecast: "54.2", previous: "54.5" }
  ];
  return events.map(e => ({ ...e, date: dateStr }));
}

app.get('/api/economic-calendar', async (req: Request, res: Response) => {
  try {
    const dateStr = String(req.query['date'] || new Date().toISOString().split('T')[0]);
    const response = await axios.get('https://economic-calendar.tradingview.com/events', {
      headers: { 'Origin': 'https://www.tradingview.com', 'User-Agent': 'Mozilla/5.0' },
      params: { from: `${dateStr}T00:00:00.000Z`, to: `${dateStr}T23:59:59.000Z`, countries: 'US,IN' }
    });
    if (response.data && Array.isArray(response.data.result)) {
      const events = response.data.result.map((item: any) => ({
        time: item.date ? new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day',
        currency: item.currency || 'USD',
        impact: item.importance === 1 ? 'high' : 'medium',
        event: item.title || '',
        actual: item.actual ?? '',
        forecast: item.forecast ?? '',
        previous: item.previous ?? '',
        date: dateStr,
      }));
      return res.json(events);
    }
    res.json(getMockEconomicEvents(dateStr));
  } catch (error) {
    res.json(getMockEconomicEvents(String(req.query['date'] || new Date().toISOString().split('T')[0])));
  }
});

app.get("/api/alerts", (_req: Request, res: Response) => {
  res.json([]);
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Global Error Handler]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FinPulse AI Backend v2 running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log('');
});

export default app;
