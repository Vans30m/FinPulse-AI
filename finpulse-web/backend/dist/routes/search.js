// src/routes/search.ts
//
// Backend for StockSearch.tsx — implements GET /api/search?q=<query>
// Uses the unofficial Yahoo Finance search endpoint via `yahoo-finance2`.
//
// Install:
//   npm install yahoo-finance2 express-rate-limit
//
// Mount in src/index.ts:
//   import searchRoutes from './routes/search';
//   app.use('/api', searchRoutes);
import { Router } from 'express';
import YahooFinance from 'yahoo-finance2';
import rateLimit from 'express-rate-limit';
const router = Router();
const yahooFinance = new YahooFinance();
// --- In-memory cache -------------------------------------------------
// Cheap protection against hammering Yahoo for the same query repeatedly.
// Swap for Redis if you run multiple server instances.
const CACHE_TTL_MS = 60 * 1000; // 1 minute
const cache = new Map();
function getFromCache(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
function setCache(key, data) {
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    if (cache.size > 500) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey)
            cache.delete(oldestKey);
    }
}
// --- Rate limiting -----------------------------------------------------
const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60, // 60 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many search requests, please slow down.' },
});
// --- Yahoo quote-type -> frontend "type" mapping ------------------------
function mapQuoteType(quoteType) {
    switch (quoteType) {
        case 'EQUITY':
            return 'Stocks';
        case 'INDEX':
            return 'Indices';
        case 'CRYPTOCURRENCY':
            return 'Crypto';
        case 'CURRENCY':
            return 'Forex';
        case 'FUTURE':
            return 'Commodities';
        case 'ETF':
            return 'Stocks';
        default:
            return 'Stocks';
    }
}
router.get('/search', searchLimiter, async (req, res) => {
    const q = (req.query.q || '').toString().trim();
    if (!q) {
        return res.json([]);
    }
    if (q.length > 100) {
        return res.status(400).json({ error: 'Query too long' });
    }
    const cacheKey = q.toLowerCase();
    const cached = getFromCache(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    try {
        const result = await yahooFinance.search(q, {
            quotesCount: 15,
            newsCount: 0,
        });
        const mapped = (result.quotes || [])
            .filter((item) => item.symbol && (item.shortname || item.longname))
            .map((item) => ({
            symbol: item.symbol,
            yahooSymbol: item.symbol,
            name: item.shortname || item.longname,
            exchange: item.exchDisp || item.exchange || 'GLOBAL',
            type: mapQuoteType(item.quoteType),
        }));
        setCache(cacheKey, mapped);
        return res.json(mapped);
    }
    catch (err) {
        console.error('Yahoo Finance search failed:', err);
        return res.status(502).json({ error: 'Search provider unavailable' });
    }
});
export default router;
