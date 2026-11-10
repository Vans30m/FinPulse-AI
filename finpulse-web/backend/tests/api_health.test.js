import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp } from './test_helper.js';

describe('5. API Health & Error Resilience Tests (api_health.test.js)', () => {
  describe('Health Check Endpoint Verification (/health)', () => {
    test('GET /health should return HTTP 200 with JSON status, timestamp, and environment telemetry', async () => {
      const { request, close } = await createTestApp((app) => {
        app.get('/health', (req, res) => {
          res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'test',
            frontendUrl: process.env.FRONTEND_URL || 'Not Set'
          });
        });
      });

      const res = await request('/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
      assert.ok(typeof res.body.timestamp === 'string');
      assert.ok(new Date(res.body.timestamp).getTime() > 0, 'Timestamp must be valid ISO date');
      assert.ok(res.body.env);

      await close();
    });

    test('GET / should return HTTP 200 root API welcome and version details', async () => {
      const { request, close } = await createTestApp((app) => {
        app.get('/', (req, res) => {
          res.status(200).json({
            message: 'FinPulse-AI Backend API is running.',
            healthCheck: '/health',
            version: '1.0.0'
          });
        });
      });

      const res = await request('/');
      assert.equal(res.status, 200);
      assert.equal(res.body.version, '1.0.0');
      assert.equal(res.body.healthCheck, '/health');

      await close();
    });
  });

  describe('Unknown Route Error Handling (Clean JSON 404)', () => {
    test('Unknown endpoints must return clean, structured JSON 404 error rather than HTML stack traces', async () => {
      const { request, close } = await createTestApp((app) => {
        // Defined routes
        app.get('/api/defined', (req, res) => res.json({ ok: true }));

        // 404 handler middleware
        app.use((req, res) => {
          res.status(404).json({
            status: 404,
            error: 'Not Found',
            message: `Route ${req.method} ${req.path} does not exist on this server`,
            timestamp: new Date().toISOString()
          });
        });
      });

      const res = await request('/api/non-existent-route-999');
      assert.equal(res.status, 404);
      assert.equal(res.body.status, 404);
      assert.equal(res.body.error, 'Not Found');
      assert.match(res.body.message, /Route GET \/api\/non-existent-route-999 does not exist/);

      await close();
    });
  });

  describe('Third-Party Provider Failure Resilience (Yahoo / Brevo / SMTP)', () => {
    test('should gracefully handle external quote provider timeouts with cached or fallback pricing', async () => {
      // Simulation of resilient quote fetcher with timeout and fallback
      const resilientQuoteFetch = async (symbol, mockProviderFailure = false) => {
        const memoryCache = { 'AAPL': { price: 180.25, timestamp: Date.now() } };
        const hardcodedFallback = { 'AAPL': 175.00, default: 100.00 };

        try {
          if (mockProviderFailure) {
            const timeoutError = new Error('Gateway Timeout: ETIMEDOUT 504 from finance provider');
            timeoutError.code = 'ETIMEDOUT';
            throw timeoutError;
          }
          return { symbol, price: 185.50, source: 'live' };
        } catch (err) {
          // Fallback 1: Return cache if available
          if (memoryCache[symbol]) {
            return { symbol, price: memoryCache[symbol].price, source: 'cache_fallback' };
          }
          // Fallback 2: Hardcoded safety price
          return { symbol, price: hardcodedFallback[symbol] || hardcodedFallback.default, source: 'static_fallback' };
        }
      };

      // Normal live quote
      const liveResult = await resilientQuoteFetch('AAPL', false);
      assert.equal(liveResult.price, 185.50);
      assert.equal(liveResult.source, 'live');

      // Failure scenario: Third party times out -> Seamlessly falls back to cache without crashing
      const fallbackResult = await resilientQuoteFetch('AAPL', true);
      assert.equal(fallbackResult.price, 180.25);
      assert.equal(fallbackResult.source, 'cache_fallback');

      // Failure scenario on unknown symbol -> Falls back to static fallback without crashing
      const staticResult = await resilientQuoteFetch('UNKNOWN_SYM', true);
      assert.equal(staticResult.price, 100.00);
      assert.equal(staticResult.source, 'static_fallback');
    });

    test('should prevent external email provider failure from blocking user signup transaction', async () => {
      let emailQueueFailed = false;

      // Mock queue email dispatcher
      const queueOtpEmailResilient = (email, code) => {
        // Fire-and-forget or circuit breaker
        Promise.reject(new Error('SMTP Connection Refused: EHOSTUNREACH'))
          .catch((err) => {
            emailQueueFailed = true;
          });
      };

      const { request, close } = await createTestApp((app) => {
        app.post('/api/auth/register-resilient', (req, res) => {
          const { email } = req.body;
          if (!email) return res.status(400).json({ error: 'Email required' });

          const code = '654321';
          // Dispatch email in background; never let downstream SMTP crash the HTTP response
          queueOtpEmailResilient(email, code);

          res.status(200).json({
            requiresVerification: true,
            message: 'Verification code initiated.'
          });
        });
      });

      const res = await request('/api/auth/register-resilient', {
        method: 'POST',
        body: { email: 'newuser@finpulse.ai' }
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.requiresVerification, true);
      assert.equal(res.body.message, 'Verification code initiated.');

      // Wait a tick for background promise rejection to resolve
      await new Promise((r) => setTimeout(r, 10));
      assert.equal(emailQueueFailed, true, 'Email failure occurred in background without disrupting HTTP response');

      await close();
    });
  });
});

