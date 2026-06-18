import express from "express";

import {
  getTechnicalIndicators,
} from "../services/yahooService.js";

const router =
  express.Router();

router.get(
  "/:symbol",
  async (req, res) => {
    try {
      const symbol =
        req.params.symbol;

      const indicators =
        await getTechnicalIndicators(
          symbol
        );

      res.json(
        indicators
      );
    } catch (error) {
      console.error(
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch technical indicators",
      });
    }
  }
);

export default router;