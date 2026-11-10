import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createMockPrisma } from './test_helper.js';

describe('3. Business Logic & Schema Boundary Conditions Tests (business_logic.test.js)', () => {
  describe('Schema Validation Constraints & Boundary Values', () => {
    test('should validate trade execution boundaries (shares > 0, price >= 0, valid market types)', () => {
      const validateTradeOrder = (order) => {
        const errors = [];
        if (!order.symbol || typeof order.symbol !== 'string' || order.symbol.trim() === '') {
          errors.push('Symbol is required');
        }
        if (typeof order.shares !== 'number' || order.shares <= 0 || !Number.isFinite(order.shares)) {
          errors.push('Shares must be a positive finite number');
        }
        if (typeof order.price !== 'number' || order.price < 0 || !Number.isFinite(order.price)) {
          errors.push('Price must be a non-negative finite number');
        }
        const validMarkets = ['domestic', 'us', 'crypto', 'metals', 'other'];
        if (!validMarkets.includes(order.marketId)) {
          errors.push(`Invalid marketId. Allowed: ${validMarkets.join(', ')}`);
        }
        return { valid: errors.length === 0, errors };
      };

      // Valid order
      const valid = validateTradeOrder({ symbol: 'AAPL', shares: 10, price: 175.50, marketId: 'us' });
      assert.equal(valid.valid, true);
      assert.equal(valid.errors.length, 0);

      // Invalid orders - boundary checks
      const zeroShares = validateTradeOrder({ symbol: 'AAPL', shares: 0, price: 175.50, marketId: 'us' });
      assert.equal(zeroShares.valid, false);
      assert.ok(zeroShares.errors.includes('Shares must be a positive finite number'));

      const negativeShares = validateTradeOrder({ symbol: 'AAPL', shares: -5, price: 175.50, marketId: 'us' });
      assert.equal(negativeShares.valid, false);

      const negativePrice = validateTradeOrder({ symbol: 'AAPL', shares: 10, price: -0.01, marketId: 'us' });
      assert.equal(negativePrice.valid, false);
      assert.ok(negativePrice.errors.includes('Price must be a non-negative finite number'));

      const invalidMarket = validateTradeOrder({ symbol: 'AAPL', shares: 10, price: 100, marketId: 'mars_exchange' });
      assert.equal(invalidMarket.valid, false);
    });

    test('should validate alert target price boundaries and valid alert types', () => {
      const validateAlert = (alert) => {
        const allowedTypes = ['PRICE', 'VOLUME', 'PERCENT_CHANGE'];
        const allowedDirections = ['ABOVE', 'BELOW'];

        if (!alert.ticker || typeof alert.ticker !== 'string') return false;
        if (typeof alert.targetPrice !== 'number' || alert.targetPrice <= 0) return false;
        if (!allowedTypes.includes(alert.type || 'PRICE')) return false;
        if (!allowedDirections.includes(alert.direction)) return false;
        return true;
      };

      assert.equal(validateAlert({ ticker: 'NVDA', targetPrice: 120.50, direction: 'ABOVE', type: 'PRICE' }), true);
      assert.equal(validateAlert({ ticker: 'NVDA', targetPrice: 0, direction: 'ABOVE' }), false);
      assert.equal(validateAlert({ ticker: 'NVDA', targetPrice: -50, direction: 'ABOVE' }), false);
      assert.equal(validateAlert({ ticker: 'NVDA', targetPrice: 100, direction: 'SIDEWAYS' }), false);
    });
  });

  describe('Unique Compound Indexes & Duplicate Record Prevention', () => {
    test('should enforce unique compound index on WatchlistItem (@@unique([watchlistId, symbol]))', async () => {
      const mockDb = createMockPrisma();
      const watchlist = await mockDb.watchlist.create({
        data: { userId: 'user_investor_1', name: 'Tech Giants' }
      });

      // Add AAPL for the first time -> Success
      const firstItem = await mockDb.watchlistItem.create({
        data: { watchlistId: watchlist.id, symbol: 'AAPL' }
      });
      assert.ok(firstItem.id);
      assert.equal(firstItem.symbol, 'AAPL');

      // Add AAPL second time to same watchlist -> Violates compound index
      await assert.rejects(
        async () => {
          await mockDb.watchlistItem.create({
            data: { watchlistId: watchlist.id, symbol: 'AAPL' }
          });
        },
        (err) => {
          assert.equal(err.code, 'P2002');
          assert.match(err.message, /watchlistId.*symbol/);
          return true;
        }
      );

      // Adding AAPL to a DIFFERENT watchlist should succeed (compound uniqueness is per watchlist)
      const watchlist2 = await mockDb.watchlist.create({
        data: { userId: 'user_investor_1', name: 'Dividends' }
      });
      const secondWatchlistItem = await mockDb.watchlistItem.create({
        data: { watchlistId: watchlist2.id, symbol: 'AAPL' }
      });
      assert.ok(secondWatchlistItem.id);
      assert.equal(secondWatchlistItem.watchlistId, watchlist2.id);
    });
  });

  describe('Portfolio P&L & Lifecycle Transitions', () => {
    test('should calculate exact weighted average cost basis and booked P&L on sequential buys & sells', () => {
      class HoldingPosition {
        constructor(ticker, marketId) {
          this.ticker = ticker;
          this.marketId = marketId;
          this.shares = 0;
          this.avgCost = 0;
          this.bookedPL = 0;
        }

        buy(shares, price) {
          const totalCost = this.shares * this.avgCost + shares * price;
          this.shares += shares;
          this.avgCost = totalCost / this.shares;
        }

        sell(shares, price) {
          if (shares > this.shares) {
            throw new Error(`Insufficient shares: requested ${shares}, available ${this.shares}`);
          }
          const gain = shares * (price - this.avgCost);
          this.bookedPL += gain;
          this.shares -= shares;
          if (this.shares === 0) {
            this.avgCost = 0;
          }
        }

        getUnrealizedPL(currentPrice) {
          return this.shares * (currentPrice - this.avgCost);
        }
      }

      const pos = new HoldingPosition('MSFT', 'us');

      // Buy 1: 100 shares @ $300
      pos.buy(100, 300);
      assert.equal(pos.shares, 100);
      assert.equal(pos.avgCost, 300);

      // Buy 2: 100 shares @ $400 -> Avg cost becomes $350
      pos.buy(100, 400);
      assert.equal(pos.shares, 200);
      assert.equal(pos.avgCost, 350);

      // Partial Sell: 50 shares @ $450 -> Gain = 50 * (450 - 350) = $5,000
      pos.sell(50, 450);
      assert.equal(pos.shares, 150);
      assert.equal(pos.avgCost, 350); // Avg cost remains 350
      assert.equal(pos.bookedPL, 5000);

      // Unrealized P&L at $380 = 150 * (380 - 350) = $4,500
      assert.equal(pos.getUnrealizedPL(380), 4500);

      // Reject over-selling
      assert.throws(() => pos.sell(200, 400), /Insufficient shares/);
    });

    test('should conform strictly to Alert Lifecycle State Machine (ACTIVE -> TRIGGERED -> ARCHIVED/MUTED)', () => {
      const AlertState = {
        ACTIVE: 'ACTIVE',
        TRIGGERED: 'TRIGGERED',
        MUTED: 'MUTED',
        ARCHIVED: 'ARCHIVED'
      };

      class AlertLifecycle {
        constructor(initialState = AlertState.ACTIVE) {
          this.state = initialState;
          this.triggeredAt = null;
        }

        trigger(currentPrice, targetPrice) {
          if (this.state !== AlertState.ACTIVE) {
            throw new Error(`Cannot trigger alert in state: ${this.state}`);
          }
          this.state = AlertState.TRIGGERED;
          this.triggeredAt = new Date();
        }

        mute() {
          if (this.state === AlertState.ARCHIVED) {
            throw new Error('Cannot mute an archived alert');
          }
          this.state = AlertState.MUTED;
        }

        reactivate() {
          if (this.state === AlertState.ARCHIVED) {
            throw new Error('Cannot reactivate an archived alert');
          }
          this.state = AlertState.ACTIVE;
        }

        archive() {
          this.state = AlertState.ARCHIVED;
        }
      }

      const alert = new AlertLifecycle();
      assert.equal(alert.state, AlertState.ACTIVE);

      // Transition: ACTIVE -> TRIGGERED
      alert.trigger(150, 145);
      assert.equal(alert.state, AlertState.TRIGGERED);
      assert.ok(alert.triggeredAt instanceof Date);

      // Invalid transition: Cannot re-trigger without reactivation
      assert.throws(() => alert.trigger(160, 145), /Cannot trigger alert in state: TRIGGERED/);

      // Transition: TRIGGERED -> ACTIVE (reactivation)
      alert.reactivate();
      assert.equal(alert.state, AlertState.ACTIVE);

      // Transition: ACTIVE -> MUTED -> ARCHIVED
      alert.mute();
      assert.equal(alert.state, AlertState.MUTED);

      alert.archive();
      assert.equal(alert.state, AlertState.ARCHIVED);

      // Invalid transition: Cannot mutate archived alert
      assert.throws(() => alert.reactivate(), /Cannot reactivate an archived alert/);
    });
  });
});

