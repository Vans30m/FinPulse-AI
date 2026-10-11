import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { protect, type AuthenticatedRequest } from '../utils/auth.js';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import PDFDocument from 'pdfkit';

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

async function enforceSessionLimit(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });

  if (sessions.length > 5) {
    const sessionsToDelete = sessions.slice(5);
    const idsToDelete = sessionsToDelete.map(s => s.id);
    await prisma.session.deleteMany({
      where: {
        id: { in: idsToDelete }
      }
    });
  }
}

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
  } else {
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

  await enforceSessionLimit(userId);
}

// GET /profile
profileRoutes.get('/', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);

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
    const isAuthError = error.message?.toLowerCase().includes('unauthorized') || error.message?.toLowerCase().includes('session');
    res.status(isAuthError ? 401 : 500).json({ error: error.message });
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
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar data is required' });
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

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashed }
    });

    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

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

    await prisma.user.update({
      where: { id: user.id },
      data: { isDeleted: true }
    });

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

    res.json({
      totalWatchlists,
      totalAssets,
      stocks,
      etfs,
      crypto,
      forex,
      commodities
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /profile/export
profileRoutes.get('/export', protect, async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const format = String(req.query.format || 'pdf').toLowerCase();

    const portfolios = await prisma.portfolio.findMany({
      where: { userId: user.id }
    });

    const holdings = await prisma.holding.findMany({
      where: { 
        userId: user.id,
        shares: { gt: 0 }
      }
    });

    const watchlists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: { items: true }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const fileNameBase = `finpulse_${user.username || 'user'}_${dateStr}`;

    const buildDocx = async () => {
      // Group holdings by marketId for display
      const holdingsByMarket = holdings.reduce((acc, h) => {
        const market = h.marketId || 'other';
        if (!acc[market]) acc[market] = [];
        acc[market].push(h);
        return acc;
      }, {} as Record<string, typeof holdings>);

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'FinPulse Data Export', bold: true, size: 32, color: '2563EB' }),
                ],
              }),
              new Paragraph({ text: '' }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Generated for: ', bold: true, size: 22 }),
                  new TextRun({ text: `${user.name || user.username || 'User'} (${user.email})`, size: 22 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Export Date: ', bold: true, size: 22 }),
                  new TextRun({ text: new Date().toLocaleDateString(), size: 22 }),
                ],
              }),
              new Paragraph({ text: '' }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'PORTFOLIO HOLDINGS', bold: true, size: 26, color: '1E40AF' }),
                ],
              }),
              new Paragraph({ text: '' }),
              ...(holdings.length > 0
                ? Object.entries(holdingsByMarket).flatMap(([market, items]) => [
                    new Paragraph({
                      children: [new TextRun({ text: `Market: ${market.toUpperCase()}`, bold: true, size: 24 })],
                    }),
                    new Paragraph({ text: '' }),
                    new Table({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      rows: [
                        new TableRow({
                          children: [
                            'Symbol', 'Name', 'Shares', 'Avg Cost', 'Market', 'Current Price', 'Market Value'
                          ].map((header) =>
                            new TableCell({
                              children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, size: 18 })] })],
                              shading: { fill: '2563EB' },
                            })
                          ),
                        }),
                        ...items.map((item) => {
                          const shares = Number(item.shares);
                          const avgCost = Number(item.avgCost);
                          const currentPrice = typeof (item as any).currentPrice === 'number' ? (item as any).currentPrice : avgCost;
                          const marketValue = shares * currentPrice;
                          return new TableRow({
                            children: [
                              item.ticker,
                              item.name,
                              shares.toString(),
                              avgCost.toFixed(2),
                              item.marketId,
                              currentPrice.toFixed(2),
                              marketValue.toFixed(2),
                            ].map((cell) =>
                              new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: cell, size: 16 })] })],
                              })
                            ),
                          });
                        }),
                      ],
                    }),
                    new Paragraph({ text: '' }),
                  ])
                : [
                    new Paragraph({
                      children: [new TextRun({ text: 'No portfolio holdings found.', italics: true, size: 20 })],
                    }),
                    new Paragraph({ text: '' }),
                  ]),
              new Paragraph({
                children: [
                  new TextRun({ text: 'WATCHLISTS', bold: true, size: 26, color: '1E40AF' }),
                ],
              }),
              new Paragraph({ text: '' }),
              ...(watchlists.length > 0
                ? watchlists.flatMap((watchlist) => [
                    new Paragraph({
                      children: [new TextRun({ text: `Watchlist: ${watchlist.name}`, bold: true, size: 24 })],
                    }),
                    new Paragraph({ text: '' }),
                    new Table({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      rows: [
                        new TableRow({
                          children: ['Symbol', 'Notes'].map((header) =>
                            new TableCell({
                              children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, size: 18 })] })],
                              shading: { fill: '2563EB' },
                            })
                          ),
                        }),
                        ...watchlist.items.map((item) =>
                          new TableRow({
                            children: [
                              item.symbol,
                              item.notes || '',
                            ].map((cell) =>
                              new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: cell, size: 16 })] })],
                              })
                            ),
                          })
                        ),
                      ],
                    }),
                    new Paragraph({ text: '' }),
                  ])
                : [
                    new Paragraph({
                      children: [new TextRun({ text: 'No watchlists found.', italics: true, size: 20 })],
                    }),
                    new Paragraph({ text: '' }),
                  ]),
            ],
          },
        ],
      });

      return await Packer.toBuffer(doc);
    };

    const buildPdf = () => {
      // Group holdings by marketId for display
      const holdingsByMarket = holdings.reduce((acc, h) => {
        const market = h.marketId || 'other';
        if (!acc[market]) acc[market] = [];
        acc[market].push(h);
        return acc;
      }, {} as Record<string, typeof holdings>);

      return new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(24).fillColor('#2563EB').text('FinPulse Data Export', { align: 'center' });
        doc.moveDown();

        // User info
        doc.fontSize(12).fillColor('#333').text(`Generated for: ${user.name || user.username || 'User'} (${user.email})`);
        doc.text(`Export Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown(2);

        // Portfolio Holdings
        doc.fontSize(16).fillColor('#1E40AF').text('PORTFOLIO HOLDINGS', { underline: true });
        doc.moveDown();

        if (holdings.length > 0) {
          Object.entries(holdingsByMarket).forEach(([market, items]) => {
            doc.font('Helvetica-Bold').fontSize(13).fillColor('#333').text(`Market: ${market.toUpperCase()}`);
            doc.moveDown(0.5);

            if (items.length > 0) {
              // Table header
              const colWidths = [70, 110, 50, 65, 65, 75, 85];
              const headers = ['Symbol', 'Name', 'Shares', 'Avg Cost', 'Market', 'Curr Price', 'Mkt Value'];
              let x = doc.page.margins.left;
              const y = doc.y;

              doc.font('Helvetica-Bold').fontSize(9).fillColor('white');
              headers.forEach((header, i) => {
                doc.rect(x, y, colWidths[i], 20).fill('#2563EB');
                doc.fillColor('white').text(header, x + 2, y + 4, { width: colWidths[i] - 4, align: 'center' });
                x += colWidths[i];
              });
              doc.y = y + 20;

              items.forEach((item, rowIdx) => {
                const shares = Number(item.shares);
                const avgCost = Number(item.avgCost);
                const currentPrice = typeof (item as any).currentPrice === 'number' ? (item as any).currentPrice : avgCost;
                const marketValue = shares * currentPrice;

                const cells = [
                  item.ticker,
                  item.name.substring(0, 25),
                  shares.toString(),
                  avgCost.toFixed(2),
                  item.marketId,
                  currentPrice.toFixed(2),
                  marketValue.toFixed(2),
                ];

                x = doc.page.margins.left;
                const rowY = doc.y;
                const isEven = rowIdx % 2 === 0;

                doc.font('Helvetica').fontSize(8).fillColor('#333');
                if (isEven) {
                  doc.rect(x, rowY, colWidths.reduce((a, b) => a + b, 0), 18).fill('#F3F4F6');
                }

                cells.forEach((cell, i) => {
                  doc.fillColor('#333').text(cell, x + 2, rowY + 3, { width: colWidths[i] - 4, align: i === 0 ? 'left' : 'center' });
                  x += colWidths[i];
                });
                doc.y = rowY + 18;

                if (doc.y > doc.page.height - 80) {
                  doc.addPage();
                }
              });
            } else {
              doc.font('Helvetica-Oblique').fontSize(11).fillColor('#666').text('No holdings in this market.');
            }
            doc.moveDown(1.5);
          });
        } else {
          doc.font('Helvetica-Oblique').fontSize(11).fillColor('#666').text('No portfolio holdings found.');
          doc.moveDown(1.5);
        }

        // Watchlists
        doc.fontSize(16).fillColor('#1E40AF').text('WATCHLISTS', { underline: true });
        doc.moveDown();

        if (watchlists.length > 0) {
          watchlists.forEach((watchlist) => {
            doc.font('Helvetica-Bold').fontSize(13).fillColor('#333').text(`Watchlist: ${watchlist.name}`);
            doc.moveDown(0.5);

            if (watchlist.items.length > 0) {
              const colWidths = [150, 350];
              const headers = ['Symbol', 'Notes'];
              let x = doc.page.margins.left;
              const y = doc.y;

              doc.font('Helvetica-Bold').fontSize(9).fillColor('white');
              headers.forEach((header, i) => {
                doc.rect(x, y, colWidths[i], 20).fill('#2563EB');
                doc.fillColor('white').text(header, x + 2, y + 4, { width: colWidths[i] - 4, align: 'center' });
                x += colWidths[i];
              });
              doc.y = y + 20;

              watchlist.items.forEach((item, rowIdx) => {
                const cells = [item.symbol, item.notes || ''];
                x = doc.page.margins.left;
                const rowY = doc.y;
                const isEven = rowIdx % 2 === 0;

                doc.font('Helvetica').fontSize(8).fillColor('#333');
                if (isEven) {
                  doc.rect(x, rowY, colWidths.reduce((a, b) => a + b, 0), 18).fill('#F3F4F6');
                }

                cells.forEach((cell, i) => {
                  doc.fillColor('#333').text(cell, x + 2, rowY + 3, { width: colWidths[i] - 4, align: 'left' });
                  x += colWidths[i];
                });
                doc.y = rowY + 18;

                if (doc.y > doc.page.height - 80) {
                  doc.addPage();
                }
              });
            } else {
              doc.font('Helvetica-Oblique').fontSize(11).fillColor('#666').text('No items in this watchlist.');
            }
            doc.moveDown(1.5);
          });
        } else {
          doc.font('Helvetica-Oblique').fontSize(11).fillColor('#666').text('No watchlists found.');
          doc.moveDown(1.5);
        }

        doc.end();
      });
    };

    if (format === 'docx' || format === 'doc') {
      const buffer = await buildDocx();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileNameBase}.docx"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const buffer = await buildPdf();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileNameBase}.pdf"`);
      return res.send(buffer);
    }

    if (format === 'csv') {
      let csvContent = '';
      csvContent += '=== PORTFOLIO HOLDINGS ===\n';
      csvContent += 'Market,Symbol,Name,Shares,Avg Cost,Market,Current Price,Market Value,Total Gain,Gain %\n';
      holdings.forEach((item) => {
        const shares = Number(item.shares);
        const avgCost = Number(item.avgCost);
        const currentPrice = typeof (item as any).currentPrice === 'number' ? (item as any).currentPrice : avgCost;
        const marketValue = Math.abs(shares) * currentPrice;
        const costBasis = Math.abs(shares) * avgCost;
        const totalGain = shares < 0 ? costBasis - marketValue : marketValue - costBasis;
        const gainPercent = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;
        csvContent += `"${item.marketId}","${item.ticker}","${item.name}",${shares},${avgCost.toFixed(2)},"${item.marketId}",${currentPrice.toFixed(2)},${marketValue.toFixed(2)},${totalGain.toFixed(2)},${gainPercent.toFixed(2)}%\n`;
      });

      csvContent += '\n=== WATCHLISTS ===\n';
      csvContent += 'Watchlist,Symbol,Notes\n';
      watchlists.forEach((watchlist) => {
        watchlist.items.forEach((item) => {
          csvContent += `"${watchlist.name}","${item.symbol}","${item.notes || ''}"\n`;
        });
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileNameBase}.csv"`);
      return res.send(csvContent);
    }

    // Default JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileNameBase}.json"`);
    return res.json({ holdings, watchlists });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default profileRoutes;
