import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import YahooFinance from 'yahoo-finance2';
import chartRoutes from "./routes/charts.js";
import newsRoutes from "./routes/newsRoutes.js";
import marketExplanationRoutes from "./routes/marketExplanationRoutes.js";
import stockSentimentRoutes from "./routes/stockSentimentRoutes.js";
import technicalRoutes from "./routes/technicalRoutes.js";
import fundamentalsRoutes from "./routes/fundamentalsRoutes.js";
import financialHealthRoutes from "./routes/financialHealthRoutes.js";
import analystRoutes
from "./routes/analyst.js";
import companyNewsRoutes
from "./routes/companyNews.js";
import newsSentimentRoute
from "./routes/newsSentiment.js";
import aiScoreRoutes
from "./routes/aiScore.js";
import globalMarketsRoutes
from "./routes/globalMarkets.js";
import screenerRoutes
from "./routes/screener.js";

dotenv.config();

export const yahooFinance = new YahooFinance();
const app = express();
const prisma = new PrismaClient();
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
  "/api/news-sentiment",
  newsSentimentRoute
);
app.use(
  "/api/ai-score",
  aiScoreRoutes
);
app.use(
  "/api/global-markets",
  globalMarketsRoutes
);
app.use(
  "/api/screener",
  screenerRoutes
);
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
// 4. PRICE ALERTS (POSTGRESQL DB)
// ==========================================


// UNTIL DB is used
app.get(
  "/api/alerts",
  (req,res)=>{
    res.json([]);
  }
);

// ==========================================
// SERVER START
// ==========================================
app.listen(PORT, () => {
  console.log(`FinPulse-AI Backend is running securely on port ${PORT}`);
});