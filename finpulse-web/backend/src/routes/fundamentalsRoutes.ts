import express from "express";

import {
  getFundamentals,
} from "../services/yahooService.js";

const router =
  express.Router();

router.get(
  "/:symbol",
  async (req, res) => {
    try {
      const data =
        await getFundamentals(
          req.params.symbol
        );

      res.json(data);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Failed to fetch fundamentals",
      });
    }
  }
);

export default router;