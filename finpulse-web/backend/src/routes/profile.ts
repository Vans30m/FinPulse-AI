import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { protect, type AuthenticatedRequest } from '../utils/auth.js';

const prisma = new PrismaClient();
const profileRoutes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'finpulse-secret-key-123456';

// Helper to seed a dummy user for the requests if none exists (to ensure frictionless login and execution)
async function getOrCreateUser(req: AuthenticatedRequest) {
  let userId = req.userId;
  let userEmail = req.userEmail || 'google_user@gmail.com';

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && !user.isDeleted) return user;
  }

  // Fallback to first non-deleted user or create default
  let user = await prisma.user.findFirst({ where: { isDeleted: false } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        name: 'Vans',
        username: 'vans_finpulse',
        phone: '+919999999999',
        country: 'India',
        timezone: 'Asia/Kolkata',
        currency: 'INR (₹)',
        bio: 'Wealth Manager & Portfolio Designer',
        occupation: 'Software Engineer',
        preferences: JSON.stringify({
          theme: 'dark',
          language: 'English',
          currency: 'INR (₹)',
          region: 'India',
          defaultDashboard: 'Portfolio'
        }),
        notificationSettings: JSON.stringify({
          priceAlerts: true,
          earnings: true,
          news: true,
          portfolio: true,
          aiInsights: true,
          weeklySummary: true,
          monthlyReport: true,
          productUpdates: true
        }),
        passwordHash: await bcrypt.hash('Finpulse@123', 10),
        lastLogin: new Date()
      }
    });
  }
  return user;
}

// Helper to log user session activity
async function logSession(userId: string, req: AuthenticatedRequest) {
  const userAgent = req.headers['user-agent'] || 'Unknown Browser / Windows';
  let device = 'Windows PC';
  if (/mobile/i.test(userAgent)) device = 'Mobile Device';
  else if (/tablet/i.test(userAgent)) device = 'Tablet';

  let browser = 'Chrome';
  if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/edge/i.test(userAgent)) browser = 'Edge';

  const ipAddress = (req.ip || req.socket.remoteAddress || '127.0.0.1').replace('::ffff:', '');

  // Generate fake refresh token or simulated JWT refresh token
  const refreshToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });

  await prisma.session.create({
    data: {
      userId,
      device,
      browser,
      ipAddress,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
}

// GET /profile
profileRoutes.get('/', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    
    // Update lastLogin on fetch to simulate login audit if not set recently
    if (!user.lastLogin || Date.now() - user.lastLogin.getTime() > 60000) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
      await logSession(user.id, req);
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      phone: user.phone,
      country: user.country,
      timezone: user.timezone,
      currency: user.currency,
      bio: user.bio,
      occupation: user.occupation,
      preferences: user.preferences ? JSON.parse(user.preferences) : null,
      notificationSettings: user.notificationSettings ? JSON.parse(user.notificationSettings) : null,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      isDeleted: user.isDeleted
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /profile
profileRoutes.put('/', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const { name, username, phone, country, timezone, currency, bio, occupation } = req.body;

    // Check unique username if changing
    if (username && username !== user.username) {
      const existing = await prisma.user.findFirst({
        where: { username, isDeleted: false }
      });
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        username,
        phone,
        country,
        timezone,
        currency,
        bio,
        occupation
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updated,
        preferences: updated.preferences ? JSON.parse(updated.preferences) : null,
        notificationSettings: updated.notificationSettings ? JSON.parse(updated.notificationSettings) : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /profile/avatar
profileRoutes.put('/avatar', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const { avatar } = req.body; // Can be a URL or a base64 encoded string representing the picture

    if (!avatar) {
      return res.status(450).json({ error: 'Avatar data is required' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar }
    });

    res.json({ message: 'Avatar updated successfully', avatar });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /profile/preferences
profileRoutes.put('/preferences', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const { preferences, notificationSettings } = req.body;

    const dataToUpdate: any = {};
    if (preferences) {
      dataToUpdate.preferences = JSON.stringify(preferences);
    }
    if (notificationSettings) {
      dataToUpdate.notificationSettings = JSON.stringify(notificationSettings);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate
    });

    res.json({
      message: 'Preferences updated successfully',
      preferences: updated.preferences ? JSON.parse(updated.preferences) : null,
      notificationSettings: updated.notificationSettings ? JSON.parse(updated.notificationSettings) : null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /profile/change-password
profileRoutes.put('/change-password', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    if (user.passwordHash) {
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return res.status(400).json({ error: 'Invalid current password' });
      }
    }

    // Hash and update password
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashed }
    });

    // Invalidate refresh tokens / delete other sessions
    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    // Create current device session again
    await logSession(user.id, req);

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /profile/sessions
profileRoutes.get('/sessions', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /profile/session/:id
profileRoutes.delete('/session/:id', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const sessionId = String(req.params.id || '');

    await prisma.session.deleteMany({
      where: {
        id: sessionId,
        userId: user.id
      }
    });

    res.json({ message: 'Session revoked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /profile/sessions (all other devices)
profileRoutes.delete('/sessions', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    // Find current session (e.g. latest one or we preserve matching userAgent/IP)
    const currentSession = await prisma.session.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (currentSession) {
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          id: { not: currentSession.id }
        }
      });
    } else {
      await prisma.session.deleteMany({
        where: { userId: user.id }
      });
    }

    res.json({ message: 'All other active sessions revoked' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /profile (Soft Delete account)
profileRoutes.delete('/', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    
    // Soft Delete: mark as deleted
    await prisma.user.update({
      where: { id: user.id },
      data: { isDeleted: true }
    });

    // Invalidate sessions
    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default profileRoutes;
