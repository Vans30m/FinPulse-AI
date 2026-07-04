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