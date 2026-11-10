import express from 'express';
import http from 'http';

/**
 * Lightweight in-memory test HTTP harness.
 * Starts an ephemeral server on port 0 and queries with Node's native fetch.
 */
export async function createTestApp(setupFn) {
  const app = express();
  app.use(express.json());

  if (setupFn) {
    setupFn(app);
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = async (path, options = {}) => {
    const url = `${baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const config = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    } else if (options.body) {
      config.body = options.body;
    }

    const response = await fetch(url, config);
    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (err) {
        data = null;
      }
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      headers: response.headers,
      body: data
    };
  };

  const close = async () => {
    return new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  };

  return { app, server, baseUrl, request, close };
}

/**
 * In-memory Mock Prisma Client for deterministic offline testing.
 */
export function createMockPrisma() {
  const users = new Map();
  const sessions = new Map();
  const otps = new Map();
  const watchlists = new Map();
  const watchlistItems = new Map();
  const holdings = new Map();
  const portfolios = new Map();
  const alerts = new Map();

  return {
    users,
    sessions,
    otps,
    watchlists,
    watchlistItems,
    holdings,
    portfolios,
    alerts,
    user: {
      findUnique: async ({ where }) => {
        if (where.email) {
          for (const u of users.values()) {
            if (u.email === where.email && !u.isDeleted) return { ...u };
          }
        }
        if (where.id) {
          const u = users.get(where.id);
          if (u && !u.isDeleted) return { ...u };
        }
        return null;
      },
      findFirst: async ({ where }) => {
        for (const u of users.values()) {
          if (where.username && u.username === where.username) return { ...u };
          if (where.email && u.email === where.email) return { ...u };
        }
        return null;
      },
      create: async ({ data }) => {
        const id = data.id || `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const record = {
          id,
          email: data.email,
          name: data.name || null,
          username: data.username || null,
          role: data.role || 'USER',
          status: data.status || 'ACTIVE',
          passwordHash: data.passwordHash || null,
          devicePin: data.devicePin || null,
          phone: data.phone || null,
          currency: data.currency || 'USD',
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data
        };
        users.set(id, record);
        return { ...record };
      },
      update: async ({ where, data }) => {
        let record = null;
        if (where.id) record = users.get(where.id);
        if (where.email) {
          for (const u of users.values()) {
            if (u.email === where.email) record = u;
          }
        }
        if (!record) throw new Error('User not found for update');
        const updated = { ...record, ...data, updatedAt: new Date() };
        users.set(updated.id, updated);
        return { ...updated };
      }
    },
    session: {
      findMany: async ({ where }) => {
        const result = [];
        for (const s of sessions.values()) {
          if (s.userId === where.userId) result.push({ ...s });
        }
        return result;
      },
      findFirst: async ({ where }) => {
        for (const s of sessions.values()) {
          if (s.userId === where.userId && s.device === where.device) return { ...s };
        }
        return null;
      },
      create: async ({ data }) => {
        const id = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const record = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        sessions.set(id, record);
        return { ...record };
      },
      update: async ({ where, data }) => {
        const record = sessions.get(where.id);
        if (!record) throw new Error('Session not found');
        const updated = { ...record, ...data, updatedAt: new Date() };
        sessions.set(where.id, updated);
        return { ...updated };
      },
      deleteMany: async ({ where }) => {
        let deletedCount = 0;
        if (where?.id?.in) {
          for (const id of where.id.in) {
            if (sessions.delete(id)) deletedCount++;
          }
        } else if (where?.userId) {
          for (const [id, s] of sessions.entries()) {
            if (s.userId === where.userId) {
              sessions.delete(id);
              deletedCount++;
            }
          }
        }
        return { count: deletedCount };
      }
    },
    watchlist: {
      findMany: async ({ where }) => {
        const res = [];
        for (const w of watchlists.values()) {
          if (w.userId === where.userId) {
            const items = [];
            for (const item of watchlistItems.values()) {
              if (item.watchlistId === w.id) items.push(item);
            }
            res.push({ ...w, items });
          }
        }
        return res;
      },
      create: async ({ data }) => {
        const id = `wl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const rec = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        watchlists.set(id, rec);
        return { ...rec };
      }
    },
    watchlistItem: {
      findUnique: async ({ where }) => {
        if (where.watchlistId_symbol) {
          const key = `${where.watchlistId_symbol.watchlistId}_${where.watchlistId_symbol.symbol}`;
          return watchlistItems.get(key) || null;
        }
        return null;
      },
      create: async ({ data }) => {
        const key = `${data.watchlistId}_${data.symbol}`;
        if (watchlistItems.has(key)) {
          const err = new Error('Unique constraint failed on the fields: (`watchlistId`,`symbol`)');
          err.code = 'P2002';
          throw err;
        }
        const id = `wli_${Date.now()}`;
        const rec = { id, ...data };
        watchlistItems.set(key, rec);
        return { ...rec };
      }
    },
    portfolio: {
      findMany: async ({ where }) => {
        const res = [];
        for (const p of portfolios.values()) {
          if (p.userId === where.userId) res.push({ ...p });
        }
        return res;
      },
      create: async ({ data }) => {
        const id = `port_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const rec = { id, ...data };
        portfolios.set(id, rec);
        return { ...rec };
      }
    },
    holding: {
      findMany: async ({ where }) => {
        const res = [];
        for (const h of holdings.values()) {
          if (h.userId === where.userId) res.push({ ...h });
        }
        return res;
      },
      create: async ({ data }) => {
        const id = `hold_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const rec = { id, ...data };
        holdings.set(id, rec);
        return { ...rec };
      }
    }
  };
}
