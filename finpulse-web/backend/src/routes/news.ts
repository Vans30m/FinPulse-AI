import { Router, Request, Response } from 'express';
import Parser from 'rss-parser';
import axios from 'axios';

const router = Router();
const parser = new Parser();

// Helper to clean Google News titles and extract publisher
function parseGoogleNewsTitle(rawTitle: string) {
  let headline = rawTitle || '';
  let source = 'Google News';
  const lastDashIndex = headline.lastIndexOf(' - ');
  if (lastDashIndex !== -1) {
    source = headline.substring(lastDashIndex + 3).trim();
    headline = headline.substring(0, lastDashIndex).trim();
  }
  return { headline, source };
}

// GET /api/company-news/:symbol
router.get('/company-news/:symbol', async (req: Request, res: Response) => {
  const { symbol } = req.params;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  try {
    const query = `${symbol} stock news`;
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await axios.get(feedUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const feed = await parser.parseString(response.data);

    const newsItems = (feed.items || []).slice(0, 10).map((item: any, idx: number) => {
      const { headline, source } = parseGoogleNewsTitle(item.title);
      return {
        uuid: item.guid || `news-${symbol}-${idx}`,
        title: headline,
        link: item.link,
        publisher: source,
        providerPublishTime: item.pubDate ? Date.parse(item.pubDate) : Date.now(),
      };
    });

    return res.json(newsItems);
  } catch (err) {
    console.error(`Failed to fetch news for ${symbol}:`, err);
    return res.status(502).json({ error: 'Failed to retrieve news from provider' });
  }
});

// GET /api/news (Finnhub news, fallback to Google Business News)
router.get('/news', async (req: Request, res: Response) => {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (apiKey) {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`);
      if (Array.isArray(response.data)) {
        const mapped = response.data.slice(0, 25).map((item: any) => ({
          id: item.id,
          headline: item.headline,
          source: item.source,
          datetime: item.datetime, // Finnhub returns unix timestamp in seconds
          url: item.url,
          summary: item.summary,
        }));
        return res.json(mapped);
      }
    } catch (err) {
      console.warn('Finnhub news fetch failed, falling back to Google News:', err);
    }
  }

  // Fallback to Google News RSS
  try {
    const feedUrl = `https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en`;
    const response = await axios.get(feedUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const feed = await parser.parseString(response.data);
    const mapped = (feed.items || []).slice(0, 25).map((item: any, idx: number) => {
      const { headline, source } = parseGoogleNewsTitle(item.title);
      return {
        id: item.guid || `google-fallback-${idx}`,
        headline,
        source,
        datetime: item.pubDate ? Math.floor(Date.parse(item.pubDate) / 1000) : Math.floor(Date.now() / 1000),
        url: item.link,
        summary: item.contentSnippet || item.content || '',
      };
    });
    return res.json(mapped);
  } catch (err) {
    console.error('Failed to retrieve fallback news:', err);
    return res.status(502).json({ error: 'Failed to retrieve news feed' });
  }
});

// GET /api/news/google
router.get('/news/google', async (req: Request, res: Response) => {
  try {
    const feedUrl = `https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en`;
    const response = await axios.get(feedUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const feed = await parser.parseString(response.data);
    const mapped = (feed.items || []).slice(0, 25).map((item: any, idx: number) => {
      const { headline, source } = parseGoogleNewsTitle(item.title);
      return {
        id: item.guid || `google-${idx}`,
        headline,
        source,
        datetime: item.pubDate ? Math.floor(Date.parse(item.pubDate) / 1000) : Math.floor(Date.now() / 1000),
        url: item.link,
        summary: item.contentSnippet || item.content || '',
        type: 'google' as const,
      };
    });
    return res.json(mapped);
  } catch (err) {
    console.error('Failed to retrieve Google news:', err);
    return res.status(502).json({ error: 'Failed to retrieve Google news feed' });
  }
});

function getSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// GET /api/economic-calendar
router.get('/economic-calendar', (req: Request, res: Response) => {
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const seed = getSeed(dateStr);
  const dayOfWeek = new Date(dateStr).getDay(); // 0 is Sunday, 6 is Saturday

  // If it's a weekend, usually fewer/no major events, but we can return 1-2 minor ones
  const count = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : (3 + (seed % 4)); // 3 to 6 events on weekdays

  const eventPool = [
    { event: "CPI Inflation Rate (YoY)", currency: "USD", impact: "High", baseVal: 3.2, suffix: "%" },
    { event: "Fed Interest Rate Decision", currency: "USD", impact: "High", baseVal: 5.25, suffix: "%" },
    { event: "GDP Growth Rate (QoQ)", currency: "USD", impact: "High", baseVal: 2.1, suffix: "%" },
    { event: "Unemployment Rate", currency: "USD", impact: "High", baseVal: 3.8, suffix: "%" },
    { event: "Non-Farm Payrolls (NFP)", currency: "USD", impact: "High", baseVal: 180, suffix: "K" },
    { event: "Core Inflation Rate (YoY)", currency: "EUR", impact: "High", baseVal: 2.9, suffix: "%" },
    { event: "ECB Interest Rate Decision", currency: "EUR", impact: "High", baseVal: 4.25, suffix: "%" },
    { event: "BoE Interest Rate Decision", currency: "GBP", impact: "High", baseVal: 5.0, suffix: "%" },
    { event: "Initial Jobless Claims", currency: "USD", impact: "Medium", baseVal: 215, suffix: "K" },
    { event: "Retail Sales (MoM)", currency: "USD", impact: "Medium", baseVal: 0.4, suffix: "%" },
    { event: "CB Consumer Confidence", currency: "USD", impact: "Medium", baseVal: 104.5, suffix: "" },
    { event: "Services PMI", currency: "GBP", impact: "Medium", baseVal: 51.2, suffix: "" },
    { event: "Manufacturing PMI", currency: "EUR", impact: "Medium", baseVal: 47.8, suffix: "" },
    { event: "Trade Balance", currency: "EUR", impact: "Low", baseVal: 18.2, suffix: "B" },
    { event: "API Crude Oil Stock Change", currency: "USD", impact: "Low", baseVal: -1.2, suffix: "M" }
  ];

  const timesPool = ["08:30", "10:00", "13:45", "14:00", "14:30", "16:00", "20:00"];

  const events = [];
  const selectedIndexes = new Set<number>();

  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 7) % eventPool.length;
    if (selectedIndexes.has(idx)) continue;
    selectedIndexes.add(idx);

    const template = eventPool[idx];
    const time = timesPool[(seed + i * 3) % timesPool.length];

    // Compute deterministic numbers
    const forecastOffset = ((seed + i * 13) % 20 - 10) / 100; // -0.1 to 0.1
    const actualOffset = ((seed + i * 29) % 30 - 15) / 100;   // -0.15 to 0.15
    const previousOffset = ((seed + i * 47) % 20 - 10) / 100; // -0.1 to 0.1

    let forecastNum = template.baseVal + (template.baseVal * forecastOffset);
    let actualNum = template.baseVal + (template.baseVal * actualOffset);
    let previousNum = template.baseVal + (template.baseVal * previousOffset);

    // Format outputs
    const fixDigits = template.baseVal > 10 ? 1 : 2;
    const forecast = `${forecastNum.toFixed(fixDigits)}${template.suffix}`;
    const actual = `${actualNum.toFixed(fixDigits)}${template.suffix}`;
    const previous = `${previousNum.toFixed(fixDigits)}${template.suffix}`;

    events.push({
      time,
      currency: template.currency,
      impact: template.impact,
      event: template.event,
      actual,
      forecast,
      previous
    });
  }

  // Sort by time
  events.sort((a, b) => a.time.localeCompare(b.time));

  res.json(events);
});

export default router;
