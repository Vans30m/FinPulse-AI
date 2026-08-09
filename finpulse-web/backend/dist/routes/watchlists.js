import { Router } from 'express';
import { prisma } from '../prisma.js';
import { protect } from '../utils/auth.js';
const router = Router();
// GET /api/watchlists
router.get('/watchlists', protect, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        let watchlists = await prisma.watchlist.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { createdAt: 'asc' }
        });
        // If a person has no watchlist, automatically create "Watchlist 1"
        if (watchlists.length === 0) {
            const defaultWatchlist = await prisma.watchlist.create({
                data: {
                    userId,
                    name: 'Watchlist 1',
                },
                include: { items: true }
            });
            watchlists = [defaultWatchlist];
        }
        res.json(watchlists);
    }
    catch (error) {
        console.error('Failed to fetch watchlists:', error.message);
        res.status(500).json({ error: error.message });
    }
});
// POST /api/watchlists
router.post('/watchlists', protect, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Determine default name if not provided
        const existingCount = await prisma.watchlist.count({
            where: { userId }
        });
        const defaultName = `Watchlist ${existingCount + 1}`;
        const name = req.body.name || defaultName;
        const newWatchlist = await prisma.watchlist.create({
            data: {
                userId,
                name,
                isFavorite: req.body.isFavorite || false,
                tags: req.body.tags || null
            },
            include: { items: true }
        });
        res.status(201).json(newWatchlist);
    }
    catch (error) {
        console.error('Failed to create watchlist:', error.message);
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/watchlists/:id
router.delete('/watchlists/:id', protect, async (req, res) => {
    try {
        const userId = req.userId;
        const id = String(req.params.id);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const watchlist = await prisma.watchlist.findFirst({
            where: { id, userId }
        });
        if (!watchlist) {
            return res.status(404).json({ error: 'Watchlist not found' });
        }
        await prisma.watchlist.delete({
            where: { id }
        });
        res.json({ message: 'Watchlist deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete watchlist:', error.message);
        res.status(500).json({ error: error.message });
    }
});
// POST /api/watchlists/:listId/items
router.post('/watchlists/:listId/items', protect, async (req, res) => {
    try {
        const userId = req.userId;
        const listId = String(req.params.listId);
        const { symbol, notes, favorite, pinned } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required' });
        }
        // Verify ownership of the watchlist
        const watchlist = await prisma.watchlist.findFirst({
            where: { id: listId, userId }
        });
        if (!watchlist) {
            return res.status(404).json({ error: 'Watchlist not found' });
        }
        // Upsert or create item to avoid duplicate symbol in same watchlist
        const item = await prisma.watchlistItem.upsert({
            where: {
                watchlistId_symbol: {
                    watchlistId: listId,
                    symbol: symbol.toUpperCase()
                }
            },
            update: {
                notes: notes || undefined,
                favorite: favorite !== undefined ? favorite : undefined,
                pinned: pinned !== undefined ? pinned : undefined
            },
            create: {
                watchlistId: listId,
                symbol: symbol.toUpperCase(),
                notes: notes || null,
                favorite: favorite || false,
                pinned: pinned || false
            }
        });
        res.status(201).json(item);
    }
    catch (error) {
        console.error('Failed to add watchlist item:', error.message);
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/watchlists/items/:itemId
router.delete('/watchlists/items/:itemId', protect, async (req, res) => {
    try {
        const userId = req.userId;
        const itemId = String(req.params.itemId);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Find the item and verify ownership of its parent watchlist
        const item = await prisma.watchlistItem.findUnique({
            where: { id: itemId },
            include: { watchlist: true }
        });
        if (!item || item.watchlist.userId !== userId) {
            return res.status(404).json({ error: 'Watchlist item not found' });
        }
        await prisma.watchlistItem.delete({
            where: { id: itemId }
        });
        res.json({ message: 'Watchlist item removed successfully' });
    }
    catch (error) {
        console.error('Failed to remove watchlist item:', error.message);
        res.status(500).json({ error: error.message });
    }
});
export default router;
