import express from 'express';
import { PrismaClient, AlertStatus, AlertType } from '@prisma/client';
import { protect, type AuthenticatedRequest } from '../utils/auth.js';

const prisma = new PrismaClient();
const alertsRouter = express.Router();

async function getUserId(req: AuthenticatedRequest) {
  if (req.userId) return req.userId;
  throw new Error('Unauthorized: User ID is required');
}

// GET /api/alerts/history - Fetch alert history (Define BEFORE /:id parameter)
alertsRouter.get('/history', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const history = await prisma.alertHistory.findMany({
      where: {
        alert: {
          userId: userId
        }
      },
      include: {
        alert: true
      },
      orderBy: {
        triggeredAt: 'desc'
      }
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/alerts - Fetch all alerts for user
alertsRouter.get('/', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const alerts = await prisma.alert.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/alerts - Create alert
alertsRouter.post('/', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { ticker, targetPrice, direction, type, notes, expiresAt, repeat } = req.body;

    if (!ticker || targetPrice === undefined || !direction) {
      return res.status(400).json({ error: 'All fields (ticker, targetPrice, direction) are required' });
    }

    const newAlert = await prisma.alert.create({
      data: {
        userId,
        ticker,
        targetPrice: parseFloat(targetPrice),
        direction,
        type: type ? (type as AlertType) : AlertType.PRICE,
        notes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        repeat: !!repeat,
        enabled: true,
        status: AlertStatus.ACTIVE
      }
    });
    res.json(newAlert);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/alerts/:id - Update alert
alertsRouter.put('/:id', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;
    const { ticker, targetPrice, direction, type, notes, expiresAt, repeat, enabled, status } = req.body;

    const alert = await prisma.alert.findFirst({ where: { id: id as string, userId: userId as string } });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const dataToUpdate: any = {};
    if (ticker !== undefined) dataToUpdate.ticker = ticker;
    if (targetPrice !== undefined) dataToUpdate.targetPrice = parseFloat(targetPrice);
    if (direction !== undefined) dataToUpdate.direction = direction;
    if (type !== undefined) dataToUpdate.type = type as AlertType;
    if (notes !== undefined) dataToUpdate.notes = notes;
    if (expiresAt !== undefined) dataToUpdate.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (repeat !== undefined) dataToUpdate.repeat = !!repeat;
    if (enabled !== undefined) dataToUpdate.enabled = !!enabled;
    if (status !== undefined) dataToUpdate.status = status as AlertStatus;

    const updated = await prisma.alert.update({
      where: { id: id as string },
      data: dataToUpdate
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/alerts/:id/status - Toggle Alert Status (Pause/Resume)
alertsRouter.patch('/:id/status', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;
    const { enabled, status } = req.body;

    const alert = await prisma.alert.findFirst({ where: { id: id as string, userId: userId as string } });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const dataToUpdate: any = {};
    if (enabled !== undefined) dataToUpdate.enabled = !!enabled;
    if (status !== undefined) dataToUpdate.status = status as AlertStatus;

    const updated = await prisma.alert.update({
      where: { id: id as string },
      data: dataToUpdate
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/alerts/:id - Delete alert
alertsRouter.delete('/:id', protect, async (req, res) => {
  try {
    const userId = await getUserId(req);
    const { id } = req.params;

    const alert = await prisma.alert.findFirst({ where: { id: id as string, userId: userId as string } });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    await prisma.alert.delete({ where: { id: id as string } });
    res.json({ message: 'Alert deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default alertsRouter;
