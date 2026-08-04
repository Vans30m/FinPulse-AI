import express from "express";
import axios from "axios";
import {
  getTechnicalIndicators,
  getFundamentals,
  getFinancialHealth,
  getMarketHistory
} from "../services/yahooService.js";
import { callGeminiWithOllamaFallback } from "./ai.js";

// 1. technicalRoutes handles /api/technical
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

// 2. fundamentalsRoutes handles /api/fundamentals
const fundamentalsRoutes = express.Router();

fundamentalsRoutes.get("/:symbol", async (req, res) => {
  try {
    const data = await getFundamentals(req.params.symbol);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch fundamentals" });
  }
});

// 3. financialHealthRoutes handles /api/financial-health
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

// 4. screenerRoutes handles /api/screener
const screenerRoutes = express.Router();
screenerRoutes.get("/global", async (req, res) => {
  try {
    const type = req.query.type === "losers" ? "day_losers" : "day_gainers";
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
    res.status(500).json({ error: "Failed to fetch global screener data" });
  }
});

// 5. marketExplanationRoutes handles /api/market-explanation
const marketExplanationRoutes = express.Router();
marketExplanationRoutes.get("/", async (req, res) => {
  try {
    const prompt = `Analyze where financial markets are moving today. Focus on domestic (India, e.g., NIFTY 50) and global (US, e.g., S&P 500) markets.
    Provide a brief summary and reasons.
    
    Respond ONLY with valid JSON matching this schema exactly. Do NOT wrap it in any markdown code blocks:
    {
      "domestic": {
        "index": "NIFTY 50",
        "change": "+0.64%",
        "reasons": ["Reason 1", "Reason 2"]
      },
      "global": {
        "index": "S&P 500",
        "change": "+1.20%",
        "reasons": ["Reason 1", "Reason 2"]
      },
      "macro": "Short macro sentiment summary sentence."
    }`;

    const responseText = await callGeminiWithOllamaFallback(prompt, true);
    const parsed = JSON.parse(responseText.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Failed to generate market explanation:", error.message);
    // Return structured fallback if LLM times out or rate limits
    res.json({
      domestic: {
        index: "NIFTY 50",
        change: "+0.35%",
        reasons: ["Domestic index trades steadily supported by metal and banking sectors."]
      },
      global: {
        index: "S&P 500",
        change: "+0.55%",
        reasons: ["Global tech stocks show consolidation ahead of economic prints."]
      },
      macro: "Global markets await central bank inflation commentaries."
    });
  }
});
// 6. globalMarketsRoutes handles /api/global-markets
const globalMarketsRoutes = express.Router();
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

export {
  technicalRoutes,
  fundamentalsRoutes,
  financialHealthRoutes,
  screenerRoutes,
  marketExplanationRoutes,
  globalMarketsRoutes
};
