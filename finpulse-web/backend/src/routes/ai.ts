import { Router, Request, Response } from 'express';
import axios from 'axios';
import { getAiCache, setAiCache } from '../utils/aiCache.js';

const router = Router();

// Robustly extract the best JSON object/array from an LLM response.
// Strategy: strip <think> blocks, collect ALL complete JSON structures via
// stack-based bracket tracking, then return the LAST one.
function extractJSON(raw: string): string {
  // Step 1: strip think blocks (closed and unclosed)
  let text = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Step 2: collect ALL top-level JSON structures via stack-based tracking
  const candidates: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '{' || ch === '[') {
      const start = i;
      const stack: string[] = [];
      let inStr = false;
      let esc = false;
      let closed = false;

      for (let j = i; j < text.length; j++) {
        const c = text[j];
        if (esc) { esc = false; continue; }
        if (c === '\\' && inStr) { esc = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;

        if (c === '{' || c === '[') {
          stack.push(c);
        } else if (c === '}' || c === ']') {
          const top = stack[stack.length - 1];
          if ((c === '}' && top === '{') || (c === ']' && top === '[')) {
            stack.pop();
            if (stack.length === 0) {
              candidates.push(text.slice(start, j + 1));
              i = j; // fast forward outer index
              closed = true;
              break;
            }
          }
        }
      }
      if (!closed) break; // unclosed bracket — stop scanning
    }
    i++;
  }

  // Step 3: pick the best candidate — prefer the last one (actual data, not schema)
  let best = '';
  if (candidates.length > 0) {
    best = candidates[candidates.length - 1];
  } else {
    // Greedy match fallback
    const m = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    best = m ? m[1] : text;
  }

  // Step 4: strip ellipsis placeholders qwen/LLMs use in schema examples
  best = best
    .replace(/\[\s*\.{2,}\s*\]/g, '[]')        // [ ... ] -> []
    .replace(/\{\s*\.{2,}\s*\}/g, '{}')        // { ... } -> {}
    .replace(/:\s*\.{2,}/gm, ': null')          // "key": ... -> "key": null
    .replace(/,\s*\.{2,}\s*(?=[,\]\}])/g, '')  // , ... , or , ... ]
    .replace(/\.{2,}/g, '')                      // any remaining dot sequences
    .replace(/\u2026/g, '')                       // Unicode ellipsis
    .replace(/,\s*([}\]])/g, '$1')               // trailing commas
    .replace(/,\s*,/g, ',');                      // double commas

  return best;
}

function repairJSON(jsonStr: string): string {
  let str = jsonStr.trim().replace(/,\s*$/, '');
  const stack: string[] = [];
  let inStr = false;
  let esc = false;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;

    if (c === '{' || c === '[') {
      stack.push(c);
    } else if (c === '}' || c === ']') {
      const top = stack[stack.length - 1];
      if ((c === '}' && top === '{') || (c === ']' && top === '[')) {
        stack.pop();
      }
    }
  }

  if (inStr) {
    str += '"';
  }
  str = str.replace(/,\s*$/, '');

  while (stack.length > 0) {
    const top = stack.pop();
    if (top === '{') str += '}';
    else if (top === '[') str += ']';
  }

  return str;
}

function safeParseJSON(rawText: string): any {
  const extracted = extractJSON(rawText);
  try {
    return JSON.parse(extracted);
  } catch (err) {
    const repaired = repairJSON(extracted);
    return JSON.parse(repaired);
  }
}

// Centralized LLM fetcher helper
async function queryLLM(prompt: string, fallbackData: any): Promise<any> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiKeySecondary = process.env.GEMINI_API_KEY_SECONDARY;

  // 1. Try Gemini Primary
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
          timeout: 5000
        }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return safeParseJSON(rawText);
      }
    } catch (err: any) {
      console.warn('Gemini primary query failed, trying secondary...', err.message);
    }
  }

  // 2. Try Gemini Secondary
  if (geminiKeySecondary && geminiKeySecondary.trim() !== '') {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKeySecondary}`,
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
          timeout: 5000
        }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return safeParseJSON(rawText);
      }
    } catch (err: any) {
      console.warn('Gemini secondary query failed, trying Groq...', err.message);
    }
  }

  // 3. Try Groq
  const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_SECONDARY;
  if (groqKey && groqKey.trim() !== '') {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'qwen/qwen3.6-27b',
          messages: [
            {
              role: 'system',
              content: 'You are a professional financial AI assistant. After your reasoning, output ONLY a valid raw JSON object with no markdown, no backticks, no extra text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4096
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          timeout: 15000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) {
        return safeParseJSON(content);
      }
    } catch (err: any) {
      console.warn('Groq query failed, using static fallback...', err.message);
    }
  }

  // 4. Static mock fallback
  return fallbackData;
}

// GET /api/ai/market-brief
router.get('/market-brief', async (req: Request, res: Response) => {
  const cacheKey = 'ai:market-brief';
  const cached = getAiCache(cacheKey);
  if (cached) return res.json(cached);
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

  const prompt = `You are a financial market analyst. Return a single valid JSON object. Do NOT use "..." or ellipsis or any placeholder — write out every item in full.
{
  "marketMood": "Bullish",
  "confidence": 72,
  "riskLevel": "Medium",
  "insights": ["Fed signals rate pause amid cooling inflation.", "Tech earnings beat estimates broadly.", "Energy sector pressured by supply surplus."],
  "sectorStrength": [
    {"sector": "Technology", "score": 85, "reason": "AI spending drives cloud growth."},
    {"sector": "Healthcare", "score": 78, "reason": "Strong biotech pipeline results."},
    {"sector": "Financials", "score": 65, "reason": "Net interest margins solid but loan growth slows."},
    {"sector": "Consumer Discretionary", "score": 70, "reason": "Travel and luxury spending resilient."},
    {"sector": "Energy", "score": 60, "reason": "Crude supply surplus pressures oil prices."},
    {"sector": "Industrials", "score": 55, "reason": "Capital expenditure cuts weigh on sector."},
    {"sector": "Materials", "score": 48, "reason": "Slowing global manufacturing dampens demand."},
    {"sector": "Consumer Defensive", "score": 74, "reason": "Pricing power on essentials supports margins."},
    {"sector": "Utilities", "score": 80, "reason": "Defensive rotation on rate cut expectations."},
    {"sector": "Real Estate", "score": 68, "reason": "Housing recovers as mortgage rates cool."},
    {"sector": "Communication Services", "score": 76, "reason": "Robust ad spend and streaming engagement."}
  ],
  "todayRisk": "Watch for CPI print volatility at market open.",
  "summary": "Markets are biased bullish with tech leading. Inflation cooling supports rate-cut bets.",
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
Replace ALL values above with REAL, CURRENT, insightful data. All 11 sectors MUST appear in sectorStrength. Return ONLY the raw JSON object. No markdown, no backticks, no extra text, no ellipsis.`;

  const result = await queryLLM(prompt, fallback);
  result.generatedAt = new Date().toISOString();
  res.json(result);
});



// GET /api/ai/global-market-pulse
router.get('/global-market-pulse', async (req: Request, res: Response) => {
  const cacheKey = 'ai:global-market-pulse';
  const cached = getAiCache(cacheKey);
  if (cached) return res.json(cached);
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

  const prompt = `You are a financial market analyst. Return a single valid JSON object (no extra text, no markdown) with exactly these keys and value types shown in the example:
{
  "sentiment": "Bullish",
  "summary": "Global indices trade cautiously as investors await Fed minutes. Asian markets closed mixed.",
  "insights": ["European indices softer on energy drag.", "Crude oil rebounds from support.", "Gold gains on safe-haven demand."],
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
Replace ALL example values with real, current data. Return only the JSON object.`;

  const result = await queryLLM(prompt, fallback);
  result.generatedAt = new Date().toISOString();
  res.json(result);
});

// GET /api/ai/fear-greed
router.get('/fear-greed', async (req: Request, res: Response) => {
  const cacheKey = 'ai:global-market-pulse';
  const cached = getAiCache(cacheKey);
  if (cached) return res.json(cached);
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

  const prompt = `You are a financial market analyst. Return a single valid JSON object (no extra text, no markdown) with exactly these keys and value types shown in the example:
{
  "score": 52,
  "sentiment": "Neutral",
  "description": "Markets show balanced sentiment. Volatility has eased but long-term momentum is capped by macro headwinds.",
  "investorTakeaways": ["Avoid chasing high-beta tech breakouts.", "Accumulate dividend-yielding defensive names."],
  "risk": "AI valuation premiums remain stretched.",
  "opportunity": "Undervalued financials and healthcare leaders offer entry points.",
  "yesterday": 50,
  "lastWeek": 46,
  "lastMonth": 55,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
Replace ALL example values with real, current data. Return only the JSON object.`;

  const result = await queryLLM(prompt, fallback);
  result.generatedAt = new Date().toISOString();
  res.json(result);
});

// GET /api/ai/pick-of-the-day
router.get('/pick-of-the-day', async (req: Request, res: Response) => {
  const cacheKey = 'ai:pick-of-the-day';
  const cached = getAiCache(cacheKey);
  if (cached) return res.json(cached);
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

// GET /api/ai/portfolio-advisor
router.get('/portfolio-advisor', async (req: Request, res: Response) => {
  const cacheKey = 'ai:portfolio-advisor';
  const cached = getAiCache(cacheKey);
  if (cached) return res.json(cached);

  const fallback = {
    healthScore: 78,
    healthGrade: "A-",
    diversification: {
      score: 82,
      status: "Well Diversified",
      sectorExposure: "Technology (28%), Financials (18%), Healthcare (12%)",
      suggestedAllocation: "Increase defensive assets like Utilities or Consumer Staples by 5%",
      confidence: 85,
      reason: "Your portfolio has a solid mix of sectors, but tech exposure is slightly high."
    },
    riskAnalysis: {
      score: 45,
      risk: "Medium",
      confidence: 80,
      suggestedAction: "Hedge with gold or short-term treasury bills",
      reason: "Overall beta is close to 1.1. Market volatility may impact short-term returns."
    },
    bestOpportunity: {
      symbol: "NVDA",
      company: "NVIDIA Corporation",
      recommendation: "BUY",
      currentPrice: 120.50,
      targetPrice: 145.00,
      expectedUpside: 20.3,
      confidence: 75,
      reason: "Strong demand for next-generation AI chips and cloud infrastructure spending."
    },
    portfolioHealth: {
      outlook: "Bullish",
      strengths: [
        "Strong allocation to high-growth tech leaders",
        "Consistent dividend yield from financial holdings",
        "Low exposure to highly speculative penny stocks"
      ],
      weaknesses: [
        "Overly concentrated in US equities",
        "Slightly low cash reserves for market downturns"
      ],
      risks: [
        "Semiconductor sector cyclicality",
        "Interest rate fluctuations affecting growth stock valuations"
      ],
      recommendations: [
        "Consider adding 5% exposure to emerging markets",
        "Set trailing stop-losses on high-gain positions to lock in profits",
        "Reallocate dividend payouts into defensive dividend Aristocrats"
      ]
    },
    rebalanceSuggestions: [
      { action: "BUY", asset: "VTI", reason: "Increase broad market diversification" },
      { action: "SELL", asset: "NVDA", reason: "Trim position to lock in profits and reduce single-stock risk" }
    ],
    generatedAt: new Date().toISOString()
  };

  const prompt = `Generate a portfolio advisor analysis in JSON format matching this schema:
  {
    "healthScore": number (0-100),
    "healthGrade": string,
    "diversification": {
      "score": number (0-100),
      "status": string,
      "sectorExposure": string,
      "suggestedAllocation": string,
      "confidence": number (0-100),
      "reason": string
    },
    "riskAnalysis": {
      "score": number (0-100),
      "risk": "Low" | "Medium" | "High",
      "confidence": number (0-100),
      "suggestedAction": string,
      "reason": string
    },
    "bestOpportunity": {
      "symbol": string,
      "company": string,
      "recommendation": string,
      "currentPrice": number,
      "targetPrice": number,
      "expectedUpside": number,
      "confidence": number (0-100),
      "reason": string
    },
    "portfolioHealth": {
      "outlook": "Bullish" | "Bearish" | "Neutral",
      "strengths": string[],
      "weaknesses": string[],
      "risks": string[],
      "recommendations": string[]
    },
    "rebalanceSuggestions": [
      { "action": "BUY" | "SELL" | "HOLD", "asset": string, "reason": string }
    ],
    "generatedAt": string (ISO timestamp)
  }
  Reflect professional and realistic asset management suggestions.`;

  const result = await queryLLM(prompt, fallback);
  result.generatedAt = new Date().toISOString();

  // Set cache for future requests
  setAiCache(cacheKey, result);
  res.json(result);
});

export default router;



