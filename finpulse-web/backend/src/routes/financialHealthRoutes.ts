import express from "express";

import {
  getFinancialHealth,
} from "../services/yahooService.js";

const router =
  express.Router();

router.get(
  "/:symbol",
  async (req, res) => {
    try {
      const data =
        await getFinancialHealth(
          req.params.symbol
        );

      res.json(data);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Failed to fetch financial health",
      });
    }
  }
);

export default router;