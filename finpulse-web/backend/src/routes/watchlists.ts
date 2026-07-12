import express from 'express';
import { PrismaClient } from '@prisma/client';
import type { WatchlistItem, Watchlist, WatchlistNote, WatchlistTag } from '@prisma/client';
import { protect, type AuthenticatedRequest } from '../utils/auth.js';
import { yahooFinance } from '../index.js';
import { getAIScore } from '../services/yahooService.js';

const prisma = new PrismaClient();
const watchlistsRouter = express.Router();

// Helper: race a promise against a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

// Helper to seed/retrieve default user
async function getUserId(req: AuthenticatedRequest) {
  if (req.userId) return req.userId;
  throw new Error('Unauthorized: User ID is required');
}

// GET /api/watchlists - Fetch all watchlists for user (price data only — AI scores are separate)
watchlistsRouter.get('/', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const lists = await prisma.watchlist.findMany({
      where: { userId: userId },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: { watchlistNotes: true }
        },
        watchlistTags: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const populatedLists = await Promise.all(
      lists.map(async (list) => {
        const populatedItems = await Promise.all(
          list.items.map(async (item) => {
            // Only fetch price quote here — AI scores are computed by a separate endpoint
            const quoteResult = await withTimeout(
              yahooFinance.quote(item.symbol),
              8000,
              null as any
            ).catch(() => null);

            const q = quoteResult;

            const changePercent = q?.regularMarketChangePercent !== undefined
              ? `${q.regularMarketChangePercent >= 0 ? '+' : ''}${q.regularMarketChangePercent.toFixed(2)}%`
              : '0.00%';
            const price = q?.regularMarketPrice !== undefined
              ? `${q.currency === 'INR' ? '\u20b9' : '$'}${q.regularMarketPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'N/A';

            return {
              ...item,
              price,
              changePercent,
              name: q?.longName || q?.shortName || item.symbol,
            };
          })
        );
        return { ...list, items: populatedItems };
      })
    );

    res.json(populatedLists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/watchlists/:id/ai-rankings - Dedicated AI ranking endpoint (called lazily by frontend)
watchlistsRouter.get('/:id/ai-rankings', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const list = await prisma.watchlist.findFirst({
      where: { id: id as string, userId: userId as string },
      include: { items: { orderBy: { position: 'asc' } } }
    });

    if (!list) return res.status(404).json({ error: 'Watchlist not found' });

    const items = list.items || [];
    if (items.length === 0) return res.json([]);

    // Compute AI scores for all items in parallel, each with its own 12s timeout and fallback
    const rankingResults = await Promise.all(
      items.map(async (item) => {
        try {
          const aiData = await withTimeout(
            getAIScore(item.symbol),
            12000,
            { score: 50 } as any
          );
          const scoreVal: number = (aiData as any)?.score ?? 50;
          let reason = 'No analysis available';
          if (scoreVal >= 80) {
            reason = 'Strong Buy — Bullish technical indicators and solid financials.';
          } else if (scoreVal >= 65) {
            reason = 'Buy — Supported by positive market sentiment and analyst targets.';
          } else if (scoreVal >= 50) {
            reason = 'Hold — Neutral technicals and stable financials.';
          } else {
            reason = 'Sell — Underperforming indicators and bearish sentiment.';
          }
          return { symbol: item.symbol, score: scoreVal, reason };
        } catch {
          return { symbol: item.symbol, score: 50, reason: 'No analysis available' };
        }
      })
    );

    // Sort descending by score
    const sorted = rankingResults.sort((a, b) => b.score - a.score);
    res.json(sorted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// POST /api/watchlists - Create new watchlist
watchlistsRouter.post('/', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { name, isFavorite, tags } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newList = await prisma.watchlist.create({
      data: {
        userId,
        name,
        isFavorite: !!isFavorite,
        tags
      },
      include: {
        items: {
          include: { watchlistNotes: true }
        },
        watchlistTags: true
      }
    });
    res.json(newList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/watchlists/:id - Update watchlist properties
watchlistsRouter.put('/:id', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;
    const { name, isFavorite, tags } = req.body;

    const list = await prisma.watchlist.findFirst({ where: { id: id as string, userId: userId as string } });
    if (!list) return res.status(404).json({ error: 'Watchlist not found' });

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (isFavorite !== undefined) dataToUpdate.isFavorite = !!isFavorite;
    if (tags !== undefined) dataToUpdate.tags = tags;

    const updated = await prisma.watchlist.update({
      where: { id: id as string },
      data: dataToUpdate,
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: { watchlistNotes: true }
        },
        watchlistTags: true
      }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/watchlists/:id - Delete watchlist
watchlistsRouter.delete('/:id', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const list = await prisma.watchlist.findFirst({ where: { id: id as string, userId: userId as string } });
    if (!list) return res.status(404).json({ error: 'Watchlist not found' });

    await prisma.watchlist.delete({ where: { id: id as string } });
    res.json({ message: 'Watchlist deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/watchlists/:id/items - Add item to watchlist
watchlistsRouter.post('/:id/items', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;
    const { symbol, notes, pinned } = req.body;

    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    const list = await prisma.watchlist.findFirst({ where: { id: id as string, userId: userId as string } });
    if (!list) return res.status(404).json({ error: 'Watchlist not found' });

    // Find current max position to place new item at end
    const lastItem = await prisma.watchlistItem.findFirst({
      where: { watchlistId: id as string },
      orderBy: { position: 'desc' }
    });
    const nextPos = lastItem ? lastItem.position + 1 : 0;

    const newItem = await prisma.watchlistItem.create({
      data: {
        watchlistId: id as string,
        symbol,
        notes,
        pinned: !!pinned,
        position: nextPos
      },
      include: { watchlistNotes: true }
    });
    res.json(newItem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/watchlists/items/:itemId - Update item properties
watchlistsRouter.put('/items/:itemId', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { itemId } = req.params;
    const { notes, pinned, favorite } = req.body;

    const item = await prisma.watchlistItem.findUnique({
      where: { id: itemId as string },
      include: { watchlist: true }
    }) as (WatchlistItem & { watchlist: Watchlist }) | null;

    if (!item || item.watchlist.userId !== userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const dataToUpdate: any = {};
    if (notes !== undefined) dataToUpdate.notes = notes;
    if (pinned !== undefined) dataToUpdate.pinned = !!pinned;
    if (favorite !== undefined) dataToUpdate.favorite = !!favorite;

    const updated = await prisma.watchlistItem.update({
      where: { id: itemId as string },
      data: dataToUpdate,
      include: { watchlistNotes: true }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/watchlists/items/:itemId - Remove item from watchlist
watchlistsRouter.delete('/items/:itemId', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { itemId } = req.params;

    const item = await prisma.watchlistItem.findUnique({
      where: { id: itemId as string },
      include: { watchlist: true }
    }) as (WatchlistItem & { watchlist: Watchlist }) | null;

    if (!item || item.watchlist.userId !== userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await prisma.watchlistItem.delete({ where: { id: itemId as string } });
    res.json({ message: 'Watchlist item removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/watchlists/:id/reorder - Reorder items
watchlistsRouter.put('/:id/reorder', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;
    const { itemIds } = req.body;

    if (!Array.isArray(itemIds)) {
      return res.status(400).json({ error: 'itemIds array is required' });
    }

    const list = await prisma.watchlist.findFirst({ where: { id: id as string, userId: userId as string } });
    if (!list) return res.status(404).json({ error: 'Watchlist not found' });

    await prisma.$transaction(
      itemIds.map((itemId, idx) =>
        prisma.watchlistItem.update({
          where: { id: itemId },
          data: { position: idx }
        })
      )
    );

    res.json({ message: 'Watchlist reordered successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/watchlists/:id/analytics - Watchlist analytics
watchlistsRouter.get('/:id/analytics', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const list = await prisma.watchlist.findFirst({
      where: { id: id as string, userId: userId as string },
      include: { items: true }
    });

    if (!list) return res.status(404).json({ error: 'Watchlist not found' });

    const items = list.items || [];
    if (items.length === 0) {
      return res.json({
        averageDailyReturn: 0,
        bestPerformer: null,
        worstPerformer: null,
        sectorDistribution: {},
        exchangeDistribution: {}
      });
    }

    const quotes = await Promise.all(
      items.map(async (item) => {
        try {
          const q = await yahooFinance.quote(item.symbol);
          return {
            symbol: item.symbol,
            changePercent: q.regularMarketChangePercent || 0,
            price: q.regularMarketPrice || 0,
            marketCap: q.regularMarketCap || 0,
            exchange: q.exchangeName || 'GLOBAL',
            sector: q.quoteType || 'Equities' // Placeholder since sector is not always on direct quote
          };
        } catch {
          return null;
        }
      })
    );

    const validQuotes = quotes.filter(Boolean) as any[];

    if (validQuotes.length === 0) {
      return res.json({
        averageDailyReturn: 0,
        bestPerformer: null,
        worstPerformer: null,
        sectorDistribution: {},
        exchangeDistribution: {}
      });
    }

    const dailyReturns = validQuotes.map(q => q.changePercent);
    const averageDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

    const sortedByReturn = [...validQuotes].sort((a, b) => b.changePercent - a.changePercent);
    const bestPerformer = sortedByReturn[0];
    const worstPerformer = sortedByReturn[sortedByReturn.length - 1];

    const sectorDistribution: Record<string, number> = {};
    const exchangeDistribution: Record<string, number> = {};

    validQuotes.forEach((q) => {
      sectorDistribution[q.sector] = (sectorDistribution[q.sector] || 0) + 1;
      exchangeDistribution[q.exchange] = (exchangeDistribution[q.exchange] || 0) + 1;
    });

    res.json({
      averageDailyReturn,
      bestPerformer: { symbol: bestPerformer.symbol, changePercent: bestPerformer.changePercent },
      worstPerformer: { symbol: worstPerformer.symbol, changePercent: worstPerformer.changePercent },
      sectorDistribution,
      exchangeDistribution
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/watchlists/items/:itemId/notes - Fetch notes
watchlistsRouter.get('/items/:itemId/notes', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { itemId } = req.params;

    const item = await prisma.watchlistItem.findUnique({
      where: { id: itemId as string },
      include: { watchlist: true }
    }) as (WatchlistItem & { watchlist: Watchlist }) | null;

    if (!item || item.watchlist.userId !== userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const notes = await prisma.watchlistNote.findMany({
      where: { itemId: itemId as string },
      orderBy: { createdAt: 'desc' }
    });

    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/watchlists/items/:itemId/notes - Create note
watchlistsRouter.post('/items/:itemId/notes', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { itemId } = req.params;
    const { title, description, pinned } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const item = await prisma.watchlistItem.findUnique({
      where: { id: itemId as string },
      include: { watchlist: true }
    }) as (WatchlistItem & { watchlist: Watchlist }) | null;

    if (!item || item.watchlist.userId !== userId) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newNote = await prisma.watchlistNote.create({
      data: {
        itemId: itemId as string,
        title,
        description,
        pinned: !!pinned
      }
    });

    res.json(newNote);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/watchlists/items/notes/:noteId - Update note
watchlistsRouter.put('/items/notes/:noteId', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { noteId } = req.params;
    const { title, description, pinned } = req.body;

    const note = await prisma.watchlistNote.findUnique({
      where: { id: noteId as string },
      include: { item: { include: { watchlist: true } } }
    }) as (WatchlistNote & { item: WatchlistItem & { watchlist: Watchlist } }) | null;

    if (!note || note.item.watchlist.userId !== userId) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (pinned !== undefined) dataToUpdate.pinned = !!pinned;

    const updated = await prisma.watchlistNote.update({
      where: { id: noteId as string },
      data: dataToUpdate
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/watchlists/items/notes/:noteId - Delete note
watchlistsRouter.delete('/items/notes/:noteId', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { noteId } = req.params;

    const note = await prisma.watchlistNote.findUnique({
      where: { id: noteId as string },
      include: { item: { include: { watchlist: true } } }
    }) as (WatchlistNote & { item: WatchlistItem & { watchlist: Watchlist } }) | null;

    if (!note || note.item.watchlist.userId !== userId) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await prisma.watchlistNote.delete({ where: { id: noteId as string } });
    res.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/watchlists/:id/tags - Fetch tags
watchlistsRouter.get('/:id/tags', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const list = await prisma.watchlist.findFirst({
      where: { id: id as string, userId: userId as string }
    });

    if (!list) return res.status(404).json({ error: 'Watchlist not found' });

    const tags = await prisma.watchlistTag.findMany({
      where: { watchlistId: id as string }
    });

    res.json(tags);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/watchlists/:id/tags - Create tag
watchlistsRouter.post('/:id/tags', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Tag name is required' });

    const list = await prisma.watchlist.findFirst({
      where: { id: id as string, userId: userId as string }
    });

    if (!list) return res.status(404).json({ error: 'Watchlist not found' });

    const tag = await prisma.watchlistTag.create({
      data: {
        watchlistId: id as string,
        name: name.trim()
      }
    });

    res.json(tag);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/watchlists/tags/:tagId - Delete tag
watchlistsRouter.delete('/tags/:tagId', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { tagId } = req.params;

    const tag = await prisma.watchlistTag.findUnique({
      where: { id: tagId as string },
      include: { watchlist: true }
    }) as (WatchlistTag & { watchlist: Watchlist }) | null;

    if (!tag || tag.watchlist.userId !== userId) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await prisma.watchlistTag.delete({ where: { id: tagId as string } });
    res.json({ message: 'Tag deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default watchlistsRouter;
