import express from 'express';
import { prisma } from '../prisma.js';
import { protect, type AuthenticatedRequest } from '../utils/auth.js';

const recentRouter = express.Router();

async function getUserId(req: AuthenticatedRequest) {
  if (req.userId) return req.userId;
  throw new Error('Unauthorized: User ID is required');
}

// GET /api/recent/searches - Get recent searches
recentRouter.get('/searches', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const searches = await prisma.recentSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    res.json(searches);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/recent/searches - Add search item
recentRouter.post('/searches', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query parameter required' });

    // Deduplicate
    await prisma.recentSearch.deleteMany({ where: { userId, query } });

    const newSearch = await prisma.recentSearch.create({
      data: { userId, query }
    });
    res.json(newSearch);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/recent/searches - Clear searches
recentRouter.delete('/searches', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    await prisma.recentSearch.deleteMany({ where: { userId } });
    res.json({ message: 'Search history cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/recent/viewed - Get recently viewed assets
recentRouter.get('/viewed', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const viewed = await prisma.recentlyViewedAsset.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 10
    });
    res.json(viewed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/recent/viewed - Add recently viewed asset
recentRouter.post('/viewed', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { symbol, name } = req.body;
    if (!symbol) return res.status(400).json({ error: 'Symbol parameter required' });

    // Deduplicate
    await prisma.recentlyViewedAsset.deleteMany({ where: { userId, symbol } });

    const newAsset = await prisma.recentlyViewedAsset.create({
      data: { userId, symbol, name: name || symbol }
    });
    res.json(newAsset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/recent/viewed - Clear viewed assets
recentRouter.delete('/viewed', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    await prisma.recentlyViewedAsset.deleteMany({ where: { userId } });
    res.json({ message: 'Viewed assets history cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default recentRouter;
