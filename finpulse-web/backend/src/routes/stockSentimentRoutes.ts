import express from "express";
import axios from "axios";

const router = express.Router();

const API_KEY =
  process.env.ALPHA_VANTAGE_API_KEY;

router.get("/:symbol", async (req, res) => {
  try {
    const symbol =
      req.params.symbol;

    const response =
      await axios.get(
        "https://www.alphavantage.co/query",
        {
          params: {
            function: "NEWS_SENTIMENT",
            tickers: symbol,
            limit: 20,
            sort: "LATEST",
            apikey: API_KEY,
          },
        }
      );

    const feed =
      response.data.feed || [];

    if (!feed.length) {
      return res.json({
        symbol,
        sentiment: "Neutral",
        score: 50,
        reason:
          "Insufficient news data."
      });
    }

    const avgScore =
      feed.reduce(
        (
          sum: number,
          item: any
        ) =>
          sum +
          Number(
            item.overall_sentiment_score || 0
          ),
        0
      ) / feed.length;

    const score =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            50 + avgScore * 50
          )
        )
      );

    let sentiment =
      "Neutral";

    if (score >= 65)
      sentiment = "Bullish";

    if (score <= 40)
      sentiment = "Bearish";

    const topHeadline =
      feed[0]?.title ||
      "No major catalyst.";

    res.json({
      symbol,
      sentiment,
      score,
      reason: topHeadline,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to fetch stock sentiment",
    });
  }
});

export default router;