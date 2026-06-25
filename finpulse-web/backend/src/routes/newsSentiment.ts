import express from "express";
import YahooFinance from "yahoo-finance2";

const router = express.Router();

const yahooFinance =
  new YahooFinance();

router.get(
  "/:symbol",
  async (req, res) => {
    try {
      const result =
        await yahooFinance.search(
          req.params.symbol,
          {
            newsCount: 10,
          }
        );

      const news =
        result.news || [];

      let score = 50;

      const bullishWords = [
        "buy",
        "growth",
        "beat",
        "record",
        "strong",
        "surge",
        "upgrade",
        "bullish",
        "outperform",
      ];

      const bearishWords = [
        "sell",
        "drop",
        "weak",
        "miss",
        "decline",
        "downgrade",
        "bearish",
        "risk",
      ];

      news.forEach((item: any) => {
        const title =
          item.title?.toLowerCase() ||
          "";

        bullishWords.forEach(
          (word) => {
            if (
              title.includes(word)
            )
              score += 5;
          }
        );

        bearishWords.forEach(
          (word) => {
            if (
              title.includes(word)
            )
              score -= 5;
          }
        );
      });

      score = Math.max(
        0,
        Math.min(100, score)
      );

      let sentiment =
        "Neutral";

      if (score >= 65)
        sentiment = "Bullish";

      if (score <= 35)
        sentiment = "Bearish";

      res.json({
        sentiment,
        score,
        headlines:
          news.map(
            (n: any) =>
              n.title
          ),
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Failed to calculate sentiment",
      });
    }
  }
);

export default router;