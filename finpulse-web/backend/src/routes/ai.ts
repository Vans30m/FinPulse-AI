import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

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
        temperature: 0.3
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
        // Clean up markdown code block if returned
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      }
    } catch (err) {
      console.warn('Gemini query failed, using static fallback...', err);
    }
  }

  // 4. Static mock fallback (Tertiary)
  return fallbackData;
}

// GET /api/ai/market-brief
router.get('/market-brief', async (req: Request, res: Response) => {
  const fallback = {
    marketMood: "Neutral",
    confidence: 65,
    riskLevel: "Medium",
    insights: [
      "Federal Reserve hints at interest rate stability amid cooling inflation data.",
      "Tech sector experiencing moderate consolidation ahead of major corporate earnings.",
      "Global energy markets showing volatility due to shipping channel disruptions."
    ],
    sectorStrength: [
      { sector: "Technology", score: 85, reason: "Consistent enterprise cloud spending and generative AI deployment" },
      { sector: "Healthcare", score: 78, reason: "Strong demand for medical devices and stable biotech earnings" },
      { sector: "Financials", score: 62, reason: "High net interest margins but loan growth starting to level off" },
      { sector: "Consumer Discretionary", score: 70, reason: "Resilient consumer spending on travel and luxury items" },
      { sector: "Energy", score: 68, reason: "Supply tight constraints globally due to shipping channel disruptions" },
      { sector: "Industrials", score: 58, reason: "Infrastructure bill spending offset by high manufacturing costs" },
      { sector: "Materials", score: 48, reason: "Slow global manufacturing output affects raw chemical demands" },
      { sector: "Consumer Defensive", score: 74, reason: "Steady pricing power on essential goods during macro consolidation" },
      { sector: "Utilities", score: 80, reason: "Strong rotation into defensive yield plays on rate cut expectations" },
      { sector: "Real Estate", score: 72, reason: "Housing sector recovers slightly as mortgage rates cool" },
      { sector: "Communication Services", score: 82, reason: "Robust ad spend trends and digital platform engagement" }
    ],
    todayRisk: "High volatility expected around the upcoming economic release window.",
    summary: "Markets are currently trading flat with a slight bias towards risk-off as investors digest the latest economic prints.",
    generatedAt: new Date().toISOString()
  };

  const prompt = `Generate a daily market brief in JSON format matching this schema:
  {
    "marketMood": "Bullish" | "Neutral" | "Bearish",
    "confidence": number (0-100),
    "riskLevel": "Low" | "Medium" | "High",
    "insights": string[],
    "sectorStrength": [{"sector": string, "score": number (0-100), "reason": string}],
    "todayRisk": string,
    "summary": string,
    "generatedAt": string (ISO timestamp)
  }
  IMPORTANT: You MUST generate entries for all 11 major global stock market sectors in the 'sectorStrength' array: Technology, Healthcare, Financials, Consumer Discretionary, Energy, Industrials, Materials, Consumer Defensive, Utilities, Real Estate, Communication Services. Reflect current global macroeconomic trends.`;

  const result = await queryLLM(prompt, fallback);
  result.generatedAt = new Date().toISOString();
  res.json(result);
});

// GET /api/ai/market-drivers
router.get('/market-drivers', async (req: Request, res: Response) => {
  const fallback = {
    question: "What is driving the market today?",
    analysis: [
      "Jobs data miss fuels expectations of a rate cut.",
      "Yield curve remains flat, suggesting cautious bond market sentiments."
    ],
    macroEvent: {
      title: "July Payrolls Report",
      impact: "High",
      description: "Payroll growth slowed more than expected, raising rate cut possibilities."
    },
    bullishFactors: [
      "Expected rate cuts lower cost of borrowing",
      "Robust retail consumer spending holds steady"
    ],
    bearishFactors: [
      "Geopolitical friction in Middle East channels",
      "Weakening manufacturing PMI prints"
    ],
    watchNext: [
      "Upcoming FOMC meeting minutes release",
      "Crude oil inventory announcements"
    ],
    summary: "Today's main driver is the soft payrolls report which signals economic cooling but increases rate cut odds.",
    generatedAt: new Date().toISOString()
  };

  const prompt = `Generate a JSON object describing the top market drivers of the day matching this schema:
  {
    "question": string,
    "analysis": string[],
    "macroEvent": {
      "title": string,
      "impact": "High" | "Medium" | "Low",
      "description": string
    },
    "bullishFactors": string[],
    "bearishFactors": string[],
    "watchNext": string[],
    "summary": string,
    "generatedAt": string (ISO timestamp)
  }`;

  const result = await queryLLM(prompt, fallback);
  result.generatedAt = new Date().toISOString();
  res.json(result);
});

// GET /api/ai/global-market-pulse
router.get('/global-market-pulse', async (req: Request, res: Response) => {
  const fallback = {
    sentiment: "Neutral",
    summary: "Broad indices are experiencing tight consolidation. US jobs data has triggered a reallocation from equities to defensive bonds.",
    insights: [
      "European indices open lower tracking minor Asian weakness.",
      "Crude oil prices steady after bouncing off support levels.",
      "Gold gains on safe-haven flows and softer dollar."
    ],
    generatedAt: new Date().toISOString()
  };

  const prompt = `Generate a global market pulse snapshot in JSON format matching this schema:
  {
    "sentiment": "Bullish" | "Neutral" | "Bearish",
    "summary": string,
    "insights": string[],
    "generatedAt": string (ISO timestamp)
  }`;

  const result = await queryLLM(prompt, fallback);
  result.generatedAt = new Date().toISOString();
  res.json(result);
});

// GET /api/ai/fear-greed
router.get('/fear-greed', async (req: Request, res: Response) => {
  const fallback = {
    score: 48,
    sentiment: "Neutral",
    description: "The index points to a neutral sentiment. Extreme market volatility has receded, but long-term momentum is capped.",
    investorTakeaways: [
      "Avoid chasing breakouts in high-beta tech names.",
      "Build positions in dividend-yielding defensive sectors."
    ],
    risk: "Valuation premiums in AI-centric stocks remain high.",
    opportunity: "Undervalued financial and health sector leaders present good entry points.",
    yesterday: 50,
    lastWeek: 45,
    lastMonth: 55,
    generatedAt: new Date().toISOString()
  };

  const prompt = `Generate a Fear and Greed Index report in JSON format matching this schema:
  {
    "score": number (0-100),
    "sentiment": string,
    "description": string,
    "investorTakeaways": string[],
    "risk": string,
    "opportunity": string,
    "yesterday": number (0-100),
    "lastWeek": number (0-100),
    "lastMonth": number (0-100),
    "generatedAt": string (ISO timestamp)
  }`;

  const result = await queryLLM(prompt, fallback);
  result.generatedAt = new Date().toISOString();
  res.json(result);
});

// GET /api/ai/pick-of-the-day
router.get('/pick-of-the-day', async (req: Request, res: Response) => {
  const fallback = {
    symbol: "MSFT",
    company: "Microsoft Corporation",
    recommendation: "BUY",
    confidence: 85,
    aiScore: 88,
    currentPrice: 420.55,
    target: 460.00,
    stopLoss: 405.00,
    holdingPeriod: "3-6 Months",
    risk: "Medium",
    summary: "Microsoft presents a strong opportunity as Azure AI growth accelerates and Office Copilot monetization scales.",
    bullishReasons: [
      "Azure growth exceeding expectations on AI workloads",
      "Robust balance sheet protects against macro shocks",
      "Consistent recurring enterprise SaaS revenue streams"
    ],
    risks: [
      "Increasing capital expenditure on data centers",
      "Stiff competition in generative AI space from competitors"
    ],
    generatedAt: new Date().toISOString()
  };

  const prompt = `Generate a stock Pick of the Day in JSON format matching this schema:
  {
    "symbol": string,
    "company": string,
    "recommendation": "BUY" | "SELL" | "HOLD",
    "confidence": number (0-100),
    "aiScore": number (0-100),
    "currentPrice": number,
    "target": number,
    "stopLoss": number,
    "holdingPeriod": string,
    "risk": "Low" | "Medium" | "High",
    "summary": string,
    "bullishReasons": string[],
    "risks": string[],
    "generatedAt": string (ISO timestamp)
  }`;

  const result = await queryLLM(prompt, fallback);
  result.generatedAt = new Date().toISOString();
  res.json(result);
});

// GET /api/ai/sector-momentum
router.get('/sector-momentum', async (req: Request, res: Response) => {
  const fallback = {
    topRally: [
      { sector: "Utilities", days: 5, momentumScore: 82, reason: "Defensive rotation into high dividend yield stocks" },
      { sector: "Real Estate", days: 3, momentumScore: 75, reason: "Mortgage rates cool down on rate cut expectations" },
      { sector: "Healthcare", days: 2, momentumScore: 68, reason: "Safe-haven flows and strong corporate earnings" },
      { sector: "Communication Services", days: 2, momentumScore: 65, reason: "Tech rebound in mega-cap streaming and search giants" },
      { sector: "Consumer Defensive", days: 1, momentumScore: 60, reason: "Inflation cooling supports defensive business models" }
    ],
    topDecline: [
      { sector: "Technology", days: 4, momentumScore: -68, reason: "Short-term valuation profit taking in semiconductor sector" },
      { sector: "Materials", days: 2, momentumScore: -45, reason: "Slowing global industrial manufacturing demands" },
      { sector: "Energy", days: 2, momentumScore: -40, reason: "Crude supply levels surpass expectations, lowering oil prices" },
      { sector: "Industrials", days: 1, momentumScore: -35, reason: "Capital expenditure cuts by large commercial shipping lines" },
      { sector: "Financials", days: 1, momentumScore: -30, reason: "Yield curve flattening limits bank margin expansion" },
      { sector: "Consumer Discretionary", days: 1, momentumScore: -25, reason: "Consumer sentiment dips slightly on jobs data revisions" }
    ],
    generatedAt: new Date().toISOString()
  };

  const prompt = `Generate daily sector momentum analysis in JSON format matching this schema:
  {
    "topRally": [{"sector": string, "days": number, "momentumScore": number, "reason": string}],
    "topDecline": [{"sector": string, "days": number, "momentumScore": number, "reason": string}],
    "generatedAt": string (ISO timestamp)
  }
  IMPORTANT: You MUST include analysis for all 11 major global stock market sectors divided appropriately between 'topRally' (positive score) and 'topDecline' (negative score): Technology, Healthcare, Financials, Consumer Discretionary, Energy, Industrials, Materials, Consumer Defensive, Utilities, Real Estate, Communication Services.`;

  const result = await queryLLM(prompt, fallback);
  result.generatedAt = new Date().toISOString();
  res.json(result);
});

export default router;
