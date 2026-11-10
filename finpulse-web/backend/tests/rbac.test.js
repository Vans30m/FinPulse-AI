import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createTestApp, createMockPrisma } from './test_helper.js';

const JWT_SECRET = 'finpulse-test-secret-key-987654';

describe('2. Role-Based Access Control & Authorization Tests (rbac.test.js)', () => {
  // Middleware under test
  function createRbacMiddleware(requiredRole) {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required' });
      }

      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        if (requiredRole && decoded.role !== requiredRole) {
          return res.status(403).json({
            error: 'Forbidden: Insufficient privileges for this resource',
            requiredRole,
            currentRole: decoded.role
          });
        }
        next();
      } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }
    };
  }

  describe('Administrative Endpoint Protection (HTTP 403 Forbidden)', () => {
    test('should allow ADMIN users to access administrative system telemetry endpoint', async () => {
      const adminToken = jwt.sign({ userId: 'admin_1', role: 'ADMIN' }, JWT_SECRET);
      
      const { request, close } = await createTestApp((app) => {
        app.get('/api/admin/system-stats', createRbacMiddleware('ADMIN'), (req, res) => {
          res.status(200).json({ systemHealth: 'Optimal', activeConnections: 42 });
        });
      });

      const res = await request('/api/admin/system-stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.systemHealth, 'Optimal');
      await close();
    });

    test('should return HTTP 403 Forbidden when regular USER attempts administrative action', async () => {
      const userToken = jwt.sign({ userId: 'user_norm', role: 'USER' }, JWT_SECRET);

      const { request, close } = await createTestApp((app) => {
        app.get('/api/admin/users/purge', createRbacMiddleware('ADMIN'), (req, res) => {
          res.status(200).json({ purged: true });
        });
      });

      const res = await request('/api/admin/users/purge', {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.requiredRole, 'ADMIN');
      assert.equal(res.body.currentRole, 'USER');
      await close();
    });

    test('should return HTTP 401 when unauthenticated request attempts access to protected route', async () => {
      const { request, close } = await createTestApp((app) => {
        app.get('/api/admin/audit-logs', createRbacMiddleware('ADMIN'), (req, res) => {
          res.json({ logs: [] });
        });
      });

      const res = await request('/api/admin/audit-logs');
      assert.equal(res.status, 401);
      await close();
    });
  });

  describe('Multi-Tenant & Organization Boundary Separation', () => {
    test('should prevent User A from reading or modifying User B resources (Tenant Isolation)', async () => {
      const mockDb = createMockPrisma();
      
      // Seed user 1 and user 2 portfolios
      const user1Portfolio = await mockDb.portfolio.create({
        data: { userId: 'user_alpha', name: 'Alpha Growth Fund' }
      });
      const user2Portfolio = await mockDb.portfolio.create({
        data: { userId: 'user_beta', name: 'Beta Value Fund' }
      });

      const { request, close } = await createTestApp((app) => {
        // Multi-tenant guarded route
        app.get('/api/portfolios/:id', createRbacMiddleware(), async (req, res) => {
          const portfolio = mockDb.portfolios.get(req.params.id);
          if (!portfolio) {
            return res.status(404).json({ error: 'Portfolio not found' });
          }

          // Enforce ownership boundary
          if (portfolio.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden: Access to another tenant resource denied' });
          }

          res.json(portfolio);
        });
      });

      const user1Token = jwt.sign({ userId: 'user_alpha', role: 'USER' }, JWT_SECRET);
      
      // User 1 accesses their own portfolio -> OK (200)
      const ownRes = await request(`/api/portfolios/${user1Portfolio.id}`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });
      assert.equal(ownRes.status, 200);
      assert.equal(ownRes.body.name, 'Alpha Growth Fund');

      // User 1 attempts accessing User 2 portfolio -> Blocked (403)
      const foreignRes = await request(`/api/portfolios/${user2Portfolio.id}`, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });
      assert.equal(foreignRes.status, 403);
      assert.equal(foreignRes.body.error, 'Forbidden: Access to another tenant resource denied');

      await close();
    });
  });

  describe('Role Elevation Defense (Prevent Privilege Modification in Profile Update)', () => {
    test('should silently strip or strictly block unauthorized role elevation payloads', async () => {
      const mockDb = createMockPrisma();
      const user = await mockDb.user.create({
        data: { id: 'usr_reg', email: 'regular@test.com', role: 'USER', name: 'Regular Trader' }
      });

      const { request, close } = await createTestApp((app) => {
        app.put('/api/profile', createRbacMiddleware(), async (req, res) => {
          const targetUser = await mockDb.user.findUnique({ where: { id: req.user.userId } });
          if (!targetUser) return res.status(404).json({ error: 'User not found' });

          const { name, bio, role, status } = req.body;

          // DEFENSE: Disallow standard users from modifying their role or account status
          if (role && role !== targetUser.role) {
            return res.status(403).json({ error: 'Unauthorized: Modifying user role is strictly restricted to SuperAdmins' });
          }
          if (status && status !== targetUser.status) {
            return res.status(403).json({ error: 'Unauthorized: Modifying account status is strictly restricted' });
          }

          const updated = await mockDb.user.update({
            where: { id: targetUser.id },
            data: { name: name || targetUser.name, bio: bio || targetUser.bio }
          });

          res.json({ success: true, user: updated });
        });
      });

      const userToken = jwt.sign({ userId: 'usr_reg', role: 'USER' }, JWT_SECRET);

      // Attempt privilege escalation: Regular user sends { role: 'ADMIN' }
      const escalateRes = await request('/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
        body: { role: 'ADMIN', name: 'Hacker King' }
      });

      assert.equal(escalateRes.status, 403);
      assert.match(escalateRes.body.error, /Modifying user role is strictly restricted/);

      // Verify in DB that role was NOT elevated
      const dbUser = await mockDb.user.findUnique({ where: { id: 'usr_reg' } });
      assert.equal(dbUser.role, 'USER');

      // Valid profile update without role elevation -> OK (200)
      const validRes = await request('/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
        body: { name: 'Legit Trader' }
      });
      assert.equal(validRes.status, 200);
      assert.equal(validRes.body.user.name, 'Legit Trader');
      assert.equal(validRes.body.user.role, 'USER');

      await close();
    });
  });
});

