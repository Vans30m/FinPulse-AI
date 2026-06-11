import express from "express";
import {
  getAIScore,
} from "../services/yahooService.js";

const router =
  express.Router();

router.get(
  "/:symbol",
  async (req, res) => {
    try {
      const data =
        await getAIScore(
          req.params.symbol
        );

      res.json(data);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Failed to calculate AI score",
      });
    }
  }
);

export default router;