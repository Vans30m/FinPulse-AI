import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = 'finpulse-test-secret-key-987654';

describe('1. Authentication & Session Lifecycle Tests (auth.test.js)', () => {
  describe('JWT Token Creation, Payload Verification, and Expiration', () => {
    test('should generate valid JWT with correct claims (id, email, role) and verify signature', () => {
      const payload = {
        userId: 'usr_enterprise_101',
        email: 'trader@finpulse.ai',
        role: 'USER'
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      assert.ok(typeof token === 'string', 'Token should be a string');
      assert.equal(token.split('.').length, 3, 'JWT should contain header, payload, signature');

      const decoded = jwt.verify(token, JWT_SECRET);
      assert.equal(decoded.userId, payload.userId);
      assert.equal(decoded.email, payload.email);
      assert.equal(decoded.role, payload.role);
      assert.ok(decoded.exp > decoded.iat, 'Expiration timestamp must be after issuance');
    });

    test('should reject expired tokens with TokenExpiredError', () => {
      const token = jwt.sign({ id: 'usr_123' }, JWT_SECRET, { expiresIn: '-1s' });
      assert.throws(
        () => jwt.verify(token, JWT_SECRET),
        (err) => {
          assert.equal(err.name, 'TokenExpiredError');
          return true;
        }
      );
    });

    test('should reject token signed with unauthorized secret key', () => {
      const forgedToken = jwt.sign({ id: 'usr_123', role: 'ADMIN' }, 'attacker-malicious-secret');
      assert.throws(
        () => jwt.verify(forgedToken, JWT_SECRET),
        (err) => {
          assert.equal(err.name, 'JsonWebTokenError');
          return true;
        }
      );
    });

    test('should reject malformed or tampered token payloads', () => {
      const validToken = jwt.sign({ id: 'usr_123', role: 'USER' }, JWT_SECRET);
      const parts = validToken.split('.');
      // Tamper with payload segment
      const tamperedPayload = Buffer.from(JSON.stringify({ id: 'usr_123', role: 'ADMIN' })).toString('base64url');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      assert.throws(
        () => jwt.verify(tamperedToken, JWT_SECRET),
        (err) => {
          assert.equal(err.name, 'JsonWebTokenError');
          return true;
        }
      );
    });
  });

  describe('Password Hashing & Cryptographic Verification', () => {
    test('should securely salt and hash password with bcrypt', async () => {
      const rawPassword = 'EnterpriseP@ssw0rd!2026';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(rawPassword, salt);

      assert.notEqual(hash, rawPassword);
      assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Should use bcrypt prefix');
      
      const isMatch = await bcrypt.compare(rawPassword, hash);
      assert.equal(isMatch, true, 'Original password should verify against hash');

      const isMismatch = await bcrypt.compare('WrongPassword!123', hash);
      assert.equal(isMismatch, false, 'Invalid password must fail verification');
    });

    test('should produce distinct salts and hashes for identical passwords', async () => {
      const password = 'IdenticalPassword#1';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      assert.notEqual(hash1, hash2, 'Salt must make each hash unique even for identical input');
      assert.equal(await bcrypt.compare(password, hash1), true);
      assert.equal(await bcrypt.compare(password, hash2), true);
    });

    test('should verify HMAC-SHA256 device PIN cryptography', () => {
      const pin = '482910';
      const hashedPin = crypto.createHmac('sha256', JWT_SECRET).update(pin).digest('hex');

      assert.equal(hashedPin.length, 64, 'HMAC-SHA256 hex digest must be 64 characters');

      const verifyHash = crypto.createHmac('sha256', JWT_SECRET).update(pin).digest('hex');
      assert.equal(hashedPin, verifyHash, 'Deterministic verification matches');

      const wrongHash = crypto.createHmac('sha256', JWT_SECRET).update('111111').digest('hex');
      assert.notEqual(hashedPin, wrongHash, 'Wrong PIN produces different hash');
    });
  });

  describe('Refresh Token Rotation, Token Family Tracking & Reuse Detection', () => {
    class MockTokenFamilyManager {
      constructor() {
        this.families = new Map(); // familyId -> { currentToken, revoked: boolean, userId }
      }

      issueInitialToken(userId) {
        const familyId = `fam_${Date.now()}_${Math.random()}`;
        const refreshToken = `rt_1_${Math.random().toString(36).substring(2)}`;
        this.families.set(familyId, { currentToken: refreshToken, revoked: false, userId });
        return { familyId, refreshToken };
      }

      rotateToken(familyId, presentedToken) {
        const family = this.families.get(familyId);
        if (!family) {
          throw new Error('TOKEN_FAMILY_NOT_FOUND');
        }

        if (family.revoked) {
          throw new Error('TOKEN_FAMILY_REVOKED_ATTACK_DETECTED');
        }

        // Token reuse detection: if client presents an old/used token in the family
        if (family.currentToken !== presentedToken) {
          // Compromise detected: revoke entire family immediately
          family.revoked = true;
          throw new Error('TOKEN_REUSE_DETECTED');
        }

        // Issue new token in same family
        const newToken = `rt_next_${Math.random().toString(36).substring(2)}`;
        family.currentToken = newToken;
        return { familyId, refreshToken: newToken };
      }

      isFamilyActive(familyId) {
        const family = this.families.get(familyId);
        return family ? !family.revoked : false;
      }
    }

    test('should rotate refresh token successfully under normal flow', () => {
      const manager = new MockTokenFamilyManager();
      const initial = manager.issueInitialToken('user_alpha');

      const rotation1 = manager.rotateToken(initial.familyId, initial.refreshToken);
      assert.notEqual(rotation1.refreshToken, initial.refreshToken);
      assert.equal(manager.isFamilyActive(initial.familyId), true);

      const rotation2 = manager.rotateToken(initial.familyId, rotation1.refreshToken);
      assert.notEqual(rotation2.refreshToken, rotation1.refreshToken);
      assert.equal(manager.isFamilyActive(initial.familyId), true);
    });

    test('should detect token reuse, revoke entire token family, and block subsequent access', () => {
      const manager = new MockTokenFamilyManager();
      const initial = manager.issueInitialToken('user_beta');

      // Valid rotation
      const rotation1 = manager.rotateToken(initial.familyId, initial.refreshToken);

      // Malicious or replayed attempt using the old (initial) token
      assert.throws(
        () => manager.rotateToken(initial.familyId, initial.refreshToken),
        (err) => {
          assert.equal(err.message, 'TOKEN_REUSE_DETECTED');
          return true;
        }
      );

      // Entire family is now revoked
      assert.equal(manager.isFamilyActive(initial.familyId), false);

      // Even the legitimate holder of rotation1 is now blocked
      assert.throws(
        () => manager.rotateToken(initial.familyId, rotation1.refreshToken),
        (err) => {
          assert.equal(err.message, 'TOKEN_FAMILY_REVOKED_ATTACK_DETECTED');
          return true;
        }
      );
    });
  });

  describe('Multi-Device Session Revocation & Logout Logic', () => {
    test('should track active device sessions and support single-device logout', () => {
      const sessions = new Map();
      const createSession = (id, userId, device) => {
        sessions.set(id, { id, userId, device, active: true });
      };

      createSession('s1', 'u_1', 'MacBook Chrome');
      createSession('s2', 'u_1', 'iPhone Safari');
      createSession('s3', 'u_1', 'Windows Firefox');

      assert.equal(sessions.size, 3);

      // Single logout (e.g. s2)
      sessions.delete('s2');
      assert.equal(sessions.has('s2'), false);
      assert.equal(sessions.has('s1'), true);
      assert.equal(sessions.has('s3'), true);
    });

    test('should enforce multi-device global logout (kill all active sessions)', () => {
      const sessions = new Map();
      sessions.set('s1', { userId: 'u_target' });
      sessions.set('s2', { userId: 'u_target' });
      sessions.set('s3', { userId: 'u_other' });

      // Revoke all sessions for u_target
      for (const [id, sess] of sessions.entries()) {
        if (sess.userId === 'u_target') {
          sessions.delete(id);
        }
      }

      assert.equal(sessions.has('s1'), false);
      assert.equal(sessions.has('s2'), false);
      assert.equal(sessions.has('s3'), true, 'Other user sessions must remain intact');
    });

    test('should enforce session concurrency cap (FIFO eviction of oldest session when limit is 5)', () => {
      const maxSessions = 5;
      const userSessions = [
        { id: 's1', timestamp: 100 },
        { id: 's2', timestamp: 200 },
        { id: 's3', timestamp: 300 },
        { id: 's4', timestamp: 400 },
        { id: 's5', timestamp: 500 }
      ];

      // Add a 6th session
      const newSession = { id: 's6', timestamp: 600 };
      userSessions.push(newSession);

      // Evict oldest if exceeding limit
      if (userSessions.length > maxSessions) {
        userSessions.sort((a, b) => b.timestamp - a.timestamp); // newest first
        const evicted = userSessions.splice(maxSessions);
        assert.equal(evicted.length, 1);
        assert.equal(evicted[0].id, 's1', 'Oldest session s1 must be evicted');
      }

      assert.equal(userSessions.length, 5);
      assert.ok(userSessions.some(s => s.id === 's6'), 'New session must be present');
    });
  });
});

