import express from "express";
import YahooFinance from "yahoo-finance2";

const router = express.Router();

const yahooFinance =
  new YahooFinance();

router.get("/:symbol", async (req, res) => {
  try {
    const result: any =
      await yahooFinance.search(
        req.params.symbol
      );

      console.log(
  JSON.stringify(
    result,
    null,
    2
  )
);

    res.json(
      result.news?.slice(0, 10) || []
    );
  } catch (error) {
    console.error(
      "Company news error:",
      error
    );

    res.status(500).json({
      error:
        "Failed to fetch company news",
    });
  }
});

export default router;