import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
dotenv.config();
const app = express();
const prisma = new PrismaClient();
const rssParser = new Parser();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
// ==========================================
// 1. GLOBAL ASSET SEARCH (YAHOO FINANCE API)
// ==========================================
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || q.trim() === '') {
            return res.json([]);
        }
        // Use yahoo-finance2 to search for stocks, crypto, commodities, forex globally
        const results = await yahooFinance.search(q);
        // Map Yahoo Finance results to the standard format the frontend expects
        const formattedResults = results.quotes.slice(0, 15).map((item) => ({
            id: item.symbol,
            symbol: item.symbol, // e.g., "AAPL", "BTC-USD", "GC=F"
            name: item.shortname || item.longname || item.symbol,
            type: item.typeDisp || item.quoteType || 'Asset',
            exchange: item.exchDisp || item.exchange || 'GLOBAL'
        }));
        res.json(formattedResults);
    }
    catch (error) {
        console.error('Yahoo Search API Error:', error);
        res.status(500).json({ error: 'Internal server error during search' });
    }
});
// ==========================================
// 2. LIVE MARKET NEWS (FINNHUB API)
// ==========================================
app.get('/api/news', async (req, res) => {
    try {
        const apiKey = process.env.FINNHUB_API_KEY;
        const response = await axios.get(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`);
        // Return top 15
        const latestNews = response.data.slice(0, 15);
        res.json(latestNews);
    }
    catch (error) {
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
    }
    catch (error) {
        console.error("RSS Parsing Error:", error);
        res.status(500).json({ error: "Failed to fetch Google News RSS" });
    }
});
// ==========================================
// 4. PRICE ALERTS (POSTGRESQL DB)
// ==========================================
// Fetch active user alerts
app.get('/api/alerts', async (req, res) => {
    try {
        // Hardcoded user ID until Auth is wired
        const alerts = await prisma.alert.findMany({
            where: { userId: 'test_user_1' },
            orderBy: { createdAt: 'desc' }
        });
        res.json(alerts);
    }
    catch (error) {
        console.error("Error fetching alerts:", error);
        res.status(500).json({ error: "Failed to fetch alerts" });
    }
});
// Create a new price alert
app.post('/api/alerts', async (req, res) => {
    try {
        const { ticker, targetPrice, direction } = req.body;
        if (!ticker || !targetPrice || !direction) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const newAlert = await prisma.alert.create({
            data: {
                userId: 'test_user_1',
                ticker: ticker.toUpperCase(),
                targetPrice: parseFloat(targetPrice),
                direction: direction,
                isTriggered: false
            }
        });
        res.status(201).json(newAlert);
    }
    catch (error) {
        console.error("Error creating alert:", error);
        res.status(500).json({ error: "Failed to create alert" });
    }
});
// ==========================================
// SERVER START
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 FinPulse Backend running securely on port ${PORT}`);
});
//# sourceMappingURL=index.js.map