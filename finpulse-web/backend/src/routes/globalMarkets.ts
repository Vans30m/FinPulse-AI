import express from "express";
import {
  getAllGlobalMarkets,
  getMarketHistory,
  getMarketScreener,
}
from "../services/yahooService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data =
      await getAllGlobalMarkets();

    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get(
  "/history/:symbol",
  async (req, res) => {
    try {
      const history =
        await getMarketHistory(
          req.params.symbol,
          String(
            req.query.range ||
            "1mo"
          )
        );

      res.json(history);
    } catch (err) {
      console.error(err);

      res
        .status(500)
        .json({
          error:
            "Failed to fetch history",
        });
    }
  }
);

router.get(
  "/screener",
  async (req, res) => {
    try {
      const market =
        String(
          req.query.market ||
          "india"
        );

      const type =
        String(
          req.query.type ||
          "gainers"
        );

      const data =
        await getMarketScreener(
          market,
          type
        );

      res.json(data);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Failed to fetch screener",
      });
    }
  }
);

export default router;