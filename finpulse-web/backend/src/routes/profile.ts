import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { protect, type AuthenticatedRequest } from '../utils/auth.js';
import { yahooFinance } from '../index.js';

const prisma = new PrismaClient();
const profileRoutes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'finpulse-secret-key-123456';

async function getOrCreateUser(req: AuthenticatedRequest) {
  let userId = req.userId;

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && !user.isDeleted) return user;
  }

  throw new Error('Unauthorized: Session is invalid or expired. Please sign in again.');
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

  // Look for an existing active session with same characteristics
  const existingSession = await prisma.session.findFirst({
    where: {
      userId,
      device,
      browser,
      ipAddress,
      expiresAt: { gt: new Date() }
    }
  });

  if (existingSession) {
    await prisma.session.update({
      where: { id: existingSession.id },
      data: { 
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
      }
    });
    return;
  }

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
      isDeleted: user.isDeleted,
      riskProfile: user.riskProfile,
      investmentGoal: user.investmentGoal,
      investmentHorizon: user.investmentHorizon,
      experienceLevel: user.experienceLevel,
      preferredExchange: user.preferredExchange,
      baseCurrency: user.baseCurrency,
      taxCountry: user.taxCountry,
      connectedAccounts: user.connectedAccounts ? JSON.parse(user.connectedAccounts) : null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /profile
profileRoutes.put('/', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const { 
      name, username, phone, country, timezone, currency, bio, occupation, avatar,
      riskProfile, investmentGoal, investmentHorizon, experienceLevel, preferredExchange, baseCurrency, taxCountry, connectedAccounts
    } = req.body;

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
        occupation,
        avatar,
        riskProfile,
        investmentGoal,
        investmentHorizon,
        experienceLevel,
        preferredExchange,
        baseCurrency,
        taxCountry,
        connectedAccounts: connectedAccounts !== undefined ? JSON.stringify(connectedAccounts) : undefined
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updated,
        preferences: updated.preferences ? JSON.parse(updated.preferences) : null,
        notificationSettings: updated.notificationSettings ? JSON.parse(updated.notificationSettings) : null,
        connectedAccounts: updated.connectedAccounts ? JSON.parse(updated.connectedAccounts) : null
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
      orderBy: { updatedAt: 'desc' }
    });

    // Unique-fy by device, browser, and ipAddress to prevent duplicate UI rows
    const uniqueSessions = [];
    const seen = new Set<string>();
    for (const s of sessions) {
      const key = `${s.device}-${s.browser}-${s.ipAddress}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSessions.push(s);
      }
    }

    res.json(uniqueSessions);
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

// GET /profile/watchlist-summary
profileRoutes.get('/watchlist-summary', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: { items: true }
    });

    const totalWatchlists = watchlists.length;
    let totalAssets = 0;
    const symbols = new Set<string>();

    for (const w of watchlists) {
      for (const item of w.items) {
        symbols.add(item.symbol);
      }
    }
    totalAssets = symbols.size;

    let stocks = 0;
    let etfs = 0;
    let crypto = 0;
    let forex = 0;
    let commodities = 0;

    // Helper to categorize asset types based on symbol
    for (const symbol of symbols) {
      const upper = symbol.toUpperCase();
      if (upper.endsWith("-USD") || upper.includes("BTC") || upper.includes("ETH") || upper.includes("SOL") || upper.includes("USDT")) {
        crypto++;
      } else if (upper.includes("=X") || (upper.length === 6 && !upper.includes("."))) {
        forex++;
      } else if (upper.includes("=F") || upper.endsWith("=F") || ["GC=F", "CL=F", "SI=F"].includes(upper)) {
        commodities++;
      } else if (upper.includes("ETF") || upper.includes("INAV") || ["SPY", "VOO", "IVV", "QQQ", "IWM"].includes(upper)) {
        etfs++;
      } else {
        stocks++;
      }
    }

    // Calculate Average Gain/Loss today using yahoo-finance2
    let totalChangePercent = 0;
    let countWithQuotes = 0;
    
    if (symbols.size > 0) {
      try {
        const symbolArray = Array.from(symbols);
        const quotes = await yahooFinance.quote(symbolArray);
        for (const quote of quotes) {
          if (quote && typeof quote.regularMarketChangePercent === 'number') {
            totalChangePercent += quote.regularMarketChangePercent;
            countWithQuotes++;
          }
        }
      } catch (err) {
        console.error("Failed to fetch yahoo quotes for watchlist summary:", err);
      }
    }

    const averageGainLoss = countWithQuotes > 0 ? totalChangePercent / countWithQuotes : 0;

    res.json({
      totalWatchlists,
      totalAssets,
      stocks,
      etfs,
      crypto,
      forex,
      commodities,
      averageGainLoss
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /profile/export
profileRoutes.get('/export', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const format = String(req.query.format || 'json').toLowerCase();

    // Gather all personal data
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: user.id },
      include: { holdings: true, transactions: true }
    });

    const watchlists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: { items: true }
    });

    const alerts = await prisma.alert.findMany({
      where: { userId: user.id }
    });

    const aiSessions = await prisma.aiSession.findMany({
      where: { userId: user.id },
      include: { histories: true }
    });

    const data = {
      profile: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        occupation: user.occupation,
        country: user.country,
        timezone: user.timezone,
        currency: user.currency,
        createdAt: user.createdAt,
        riskProfile: user.riskProfile,
        investmentGoal: user.investmentGoal,
        investmentHorizon: user.investmentHorizon,
        experienceLevel: user.experienceLevel,
        preferredExchange: user.preferredExchange,
        baseCurrency: user.baseCurrency,
        taxCountry: user.taxCountry
      },
      portfolios,
      watchlists,
      alerts,
      aiReports: aiSessions
    };

    if (format === 'csv') {
      let csvContent = "";
      
      // Profile Section
      csvContent += "=== PROFILE DATA ===\n";
      csvContent += "Field,Value\n";
      Object.entries(data.profile).forEach(([key, val]) => {
        csvContent += `"${key}","${String(val || '').replace(/"/g, '""')}"\n`;
      });

      // Portfolios Section
      csvContent += "\n=== PORTFOLIOS ===\n";
      csvContent += "ID,Name,Description,Visibility\n";
      portfolios.forEach(p => {
        csvContent += `"${p.id}","${p.name}","${p.description || ''}","${p.visibility}"\n`;
      });

      // Holdings
      csvContent += "\n=== PORTFOLIO HOLDINGS ===\n";
      csvContent += "PortfolioID,Symbol,Name,Shares,AvgCost\n";
      portfolios.forEach(p => {
        p.holdings.forEach(h => {
          csvContent += `"${p.id}","${h.symbol}","${h.name}","${h.shares}","${h.avgCost}"\n`;
        });
      });

      // Transactions
      csvContent += "\n=== PORTFOLIO TRANSACTIONS ===\n";
      csvContent += "PortfolioID,Symbol,Type,Shares,Price,Date\n";
      portfolios.forEach(p => {
        p.transactions.forEach(t => {
          csvContent += `"${p.id}","${t.symbol}","${t.type}","${t.shares}","${t.price}","${t.date}"\n`;
        });
      });

      // Watchlists
      csvContent += "\n=== WATCHLISTS ===\n";
      csvContent += "WatchlistID,Name,Favorite\n";
      watchlists.forEach(w => {
        csvContent += `"${w.id}","${w.name}","${w.isFavorite}"\n`;
        w.items.forEach(item => {
          csvContent += `,,Symbol: ${item.symbol},Notes: ${item.notes || ''}\n`;
        });
      });

      // Alerts
      csvContent += "\n=== ALERTS ===\n";
      csvContent += "Ticker,TargetPrice,Direction,Type,Status\n";
      alerts.forEach(a => {
        csvContent += `"${a.ticker}","${a.targetPrice}","${a.direction}","${a.type}","${a.status}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=finpulse_export_${user.username || 'user'}.csv`);
      return res.send(csvContent);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=finpulse_export_${user.username || 'user'}.json`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default profileRoutes;
