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

      const data =
        await getYahooCandles(
          symbol,
          range
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