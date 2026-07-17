import express from "express";
import axios from "axios";
import NodeCache from "node-cache";

const marketsCache = new NodeCache({ stdTTL: 15 }); // 15 seconds cache for real-time market data
const explanationCache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache for macro market explanation

import {
  getAllGlobalMarkets,
  getMarketHistory,
  getMarketScreener,
  getDomesticScreener,
  getIndexSummary,
  getTechnicalIndicators,
  getFundamentals,
  getFinancialHealth
} from "../services/yahooService.js";

// 1. globalMarketsRoutes handles /api/global-markets
const globalMarketsRoutes = express.Router();
globalMarketsRoutes.get("/", async (req, res) => {
  try {
    const cachedData = marketsCache.get("global-markets-all");
    if (cachedData) {
      return res.json(cachedData);
    }
    const data = await getAllGlobalMarkets();
    marketsCache.set("global-markets-all", data);
    res.json(data);
  } catch (err: any) {
    res.status(500).json(err);
  }
});

globalMarketsRoutes.get("/history/:symbol", async (req, res) => {
  try {
    const history = await getMarketHistory(
      req.params.symbol,
      String(req.query.range || "1mo")
    );
    res.json(history);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

globalMarketsRoutes.get("/screener", async (req, res) => {
  try {
    const market = String(req.query.market || "india");
    const type = String(req.query.type || "gainers");
    const data = await getMarketScreener(market, type);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch screener" });
  }
});

// 2. indexSummaryRoutes handles /api/index-summary
const indexSummaryRoutes = express.Router();
indexSummaryRoutes.get("/:symbol", async (req, res) => {
  try {
    const data = await getIndexSummary(req.params.symbol);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch index summary" });
  }
});

// 3. technicalRoutes handles /api/technical
const technicalRoutes = express.Router();
technicalRoutes.get("/:symbol", async (req, res) => {
  try {
    const data = await getTechnicalIndicators(req.params.symbol);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch technical indicators" });
  }
});

// 4. fundamentalsRoutes handles /api/fundamentals
const fundamentalsRoutes = express.Router();

fundamentalsRoutes.get("/batch/list", async (req, res) => {
  try {
    const symbolsQuery = req.query.symbols;
    if (!symbolsQuery) {
      return res.status(400).json({ error: "Missing symbols parameter" });
    }
    const symbols = String(symbolsQuery).split(",");
    const { fetchQuotesResilient } = await import("../yahooFinance.js");
    const quotes = await fetchQuotesResilient(symbols);
    
    const result = quotes.map(quote => {
      if (!quote) return null;
      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice ?? 0,
        changePercent: quote.regularMarketChangePercent ?? 0
      };
    }).filter(Boolean);

    res.json(result);
  } catch (error: any) {
    console.error("Error in batch list fundamentals:", error);
    res.status(500).json({ error: "Failed to fetch batch fundamentals" });
  }
});

fundamentalsRoutes.get("/:symbol", async (req, res) => {
  try {
    const data = await getFundamentals(req.params.symbol);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch fundamentals" });
  }
});

// 5. financialHealthRoutes handles /api/financial-health
const financialHealthRoutes = express.Router();
financialHealthRoutes.get("/:symbol", async (req, res) => {
  try {
    const data = await getFinancialHealth(req.params.symbol);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch financial health" });
  }
});

// 6. screenerRoutes handles /api/screener
const screenerRoutes = express.Router();
screenerRoutes.get("/", async (req, res) => {
  try {
    const market = String(req.query.market || "india");
    const type = String(req.query.type || "gainers");
    const data = await getMarketScreener(market, type);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch screener data" });
  }
});

screenerRoutes.get("/india", async (req, res) => {
  try {
    const type = String(req.query.type || "gainers");
    const data = await getDomesticScreener(type);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch domestic screener" });
  }
});

// 7. marketExplanationRoutes handles /api/market-explanation
const marketExplanationRoutes = express.Router();
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

marketExplanationRoutes.get("/", async (req, res) => {
  try {
    const cachedData = explanationCache.get("market-explanation");
    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "NEWS_SENTIMENT",
        topics: "financial_markets",
        sort: "LATEST",
        limit: 30,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    const feed = response.data.feed || [];
    const headlines = feed.map((item: any) => item.title);
    const text = headlines.join(" ").toLowerCase();

    const domestic: string[] = [];
    const global: string[] = [];

    if (text.includes("bank")) {
      domestic.push("Banking sector remains strong");
    }
    if (text.includes("india")) {
      domestic.push("Positive sentiment around Indian equities");
    }
    if (text.includes("nvidia") || text.includes("ai")) {
      global.push("AI-related stocks are driving gains");
    }
    if (text.includes("fed")) {
      global.push("Markets reacting to Federal Reserve commentary");
    }

    let macro = "No major macro event";
    if (text.includes("inflation") || text.includes("cpi")) {
      macro = "Inflation data remains a key market focus";
    }

    const result = {
      domestic: {
        index: "NIFTY 50",
        change: "+0.64%",
        reasons: domestic.length > 0 ? domestic : ["Domestic markets remain stable"]
      },
      global: {
        index: "S&P 500",
        change: "+1.20%",
        reasons: global.length > 0 ? global : ["Global sentiment remains positive"]
      },
      macro
    };

    explanationCache.set("market-explanation", result);
    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate market explanation" });
  }
});

export {
  globalMarketsRoutes,
  indexSummaryRoutes,
  technicalRoutes,
  fundamentalsRoutes,
  financialHealthRoutes,
  screenerRoutes,
  marketExplanationRoutes
};
