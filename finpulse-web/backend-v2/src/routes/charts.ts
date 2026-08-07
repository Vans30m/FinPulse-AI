import express from "express";
import {
  getYahooCandles,
} from "../services/yahooService.js";

const router =
  express.Router();

router.get(
  "/:symbol",
  async (req, res) => {
    try {
      const symbol =
        req.params.symbol;

      const range =
        String(
          req.query.range ||
          "1y"
        );

      const interval =
        String(
          req.query.interval ||
          "1d"
        );

      const data =
        await getYahooCandles(
          symbol,
          range,
          interval
        );

      // ── Data source confirmation ─────────────────────────────────────────
      const source = data?.meta?.source || 'yahoo';
      const candleCount = data?.quotes?.length ?? 0;
      const lastCandle = data?.quotes?.[candleCount - 1];
      const lastTime = lastCandle?.date
        ? new Date(lastCandle.date).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })
        : 'N/A';
      const lastPrice = lastCandle?.close?.toFixed(2) ?? 'N/A';
      console.log(
        `\n📊 [Chart] ${symbol} | range=${range} interval=${interval}` +
        `\n   ✅ Source  : ${source.toUpperCase()}` +
        `\n   📈 Candles : ${candleCount}` +
        `\n   🕐 Last    : ${lastTime} IST  @ $${lastPrice}\n`
      );
      // ─────────────────────────────────────────────────────────────────────

      res.json(data);
    } catch (error: any) {
      res.status(500).json({
        message:
          error?.message,
      });
    }
  }
);

export default router;