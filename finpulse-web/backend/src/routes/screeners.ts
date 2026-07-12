import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, type AuthenticatedRequest } from '../utils/auth.js';

const prisma = new PrismaClient();
const customScreenerRouter = express.Router();

async function getUserId(req: AuthenticatedRequest) {
  if (req.userId) return req.userId;
  throw new Error('Unauthorized: User ID is required');
}

// GET /api/saved-screeners
customScreenerRouter.get('/', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const screeners = await prisma.savedScreener.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(screeners);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/saved-screeners
customScreenerRouter.post('/', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { name, filters } = req.body;
    if (!name || !filters) return res.status(400).json({ error: 'Name and filters are required' });

    const saved = await prisma.savedScreener.create({
      data: {
        userId,
        name,
        filters: typeof filters === 'string' ? filters : JSON.stringify(filters)
      }
    });
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/saved-screeners/:id
customScreenerRouter.delete('/:id', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const exists = await prisma.savedScreener.findFirst({ where: { id: id as string, userId: userId as string } });
    if (!exists) return res.status(404).json({ error: 'Screener not found' });

    await prisma.savedScreener.delete({ where: { id: id as string } });
    res.json({ message: 'Screener deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default customScreenerRouter;
