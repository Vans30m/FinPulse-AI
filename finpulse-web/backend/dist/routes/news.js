import { Router } from 'express';
import Parser from 'rss-parser';
import axios from 'axios';
const router = Router();
const parser = new Parser();
// Helper to clean Google News titles and extract publisher
function parseGoogleNewsTitle(rawTitle) {
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
router.get('/company-news/:symbol', async (req, res) => {
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
        const newsItems = (feed.items || []).slice(0, 10).map((item, idx) => {
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
    }
    catch (err) {
        console.error(`Failed to fetch news for ${symbol}:`, err);
        return res.status(502).json({ error: 'Failed to retrieve news from provider' });
    }
});
// GET /api/news (Finnhub news, fallback to Google Business News)
router.get('/news', async (req, res) => {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (apiKey) {
        try {
            const response = await axios.get(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`);
            if (Array.isArray(response.data)) {
                const mapped = response.data.slice(0, 25).map((item) => ({
                    id: item.id,
                    headline: item.headline,
                    source: item.source,
                    datetime: item.datetime, // Finnhub returns unix timestamp in seconds
                    url: item.url,
                    summary: item.summary,
                }));
                return res.json(mapped);
            }
        }
        catch (err) {
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
        const mapped = (feed.items || []).slice(0, 25).map((item, idx) => {
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
    }
    catch (err) {
        console.error('Failed to retrieve fallback news:', err);
        return res.status(502).json({ error: 'Failed to retrieve news feed' });
    }
});
// GET /api/news/google
router.get('/news/google', async (req, res) => {
    try {
        const feedUrl = `https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en`;
        const response = await axios.get(feedUrl, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const feed = await parser.parseString(response.data);
        const mapped = (feed.items || []).slice(0, 25).map((item, idx) => {
            const { headline, source } = parseGoogleNewsTitle(item.title);
            return {
                id: item.guid || `google-${idx}`,
                headline,
                source,
                datetime: item.pubDate ? Math.floor(Date.parse(item.pubDate) / 1000) : Math.floor(Date.now() / 1000),
                url: item.link,
                summary: item.contentSnippet || item.content || '',
                type: 'google',
            };
        });
        return res.json(mapped);
    }
    catch (err) {
        console.error('Failed to retrieve Google news:', err);
        return res.status(502).json({ error: 'Failed to retrieve Google news feed' });
    }
});
export default router;
