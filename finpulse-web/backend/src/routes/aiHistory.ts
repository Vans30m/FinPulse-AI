import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, type AuthenticatedRequest } from '../utils/auth.js';

const prisma = new PrismaClient();
const aiHistoryRouter = express.Router();

async function getUserId(req: AuthenticatedRequest) {
  if (req.userId) return req.userId;
  throw new Error('Unauthorized: User ID is required');
}

// GET /api/ai/history - Fetch AI chat session logs
aiHistoryRouter.get('/history', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const history = await prisma.aiSession.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/history - Save AI interaction prompt response pair
aiHistoryRouter.post('/history', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { prompt, response } = req.body;
    if (!prompt || !response) return res.status(400).json({ error: 'Prompt and response are required' });

    const saved = await prisma.aiSession.create({
      data: {
        userId,
        prompt,
        response
      }
    });
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/ai/history/:id - Toggle pinned/favorite attributes
aiHistoryRouter.put('/history/:id', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;
    const { isFavorite, pinned } = req.body;

    const exists = await prisma.aiSession.findFirst({ where: { id: id as string, userId: userId as string } });
    if (!exists) return res.status(404).json({ error: 'History record not found' });

    const dataToUpdate: any = {};
    if (isFavorite !== undefined) dataToUpdate.isFavorite = !!isFavorite;
    if (pinned !== undefined) dataToUpdate.pinned = !!pinned;

    const updated = await prisma.aiSession.update({
      where: { id: id as string },
      data: dataToUpdate
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/ai/history/:id - Delete single history log
aiHistoryRouter.delete('/history/:id', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const exists = await prisma.aiSession.findFirst({ where: { id: id as string, userId: userId as string } });
    if (!exists) return res.status(404).json({ error: 'History record not found' });

    await prisma.aiSession.delete({ where: { id: id as string } });
    res.json({ message: 'History record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/ai/history - Clear all user history logs
aiHistoryRouter.delete('/history', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    await prisma.aiSession.deleteMany({ where: { userId: userId } });
    res.json({ message: 'AI history cleared successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default aiHistoryRouter;
