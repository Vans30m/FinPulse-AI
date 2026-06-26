import express from "express";
import axios from "axios";

const router = express.Router();

const API_KEY =
  process.env.ALPHA_VANTAGE_API_KEY;

router.get("/", async (req, res) => {
  try {
    const response =
      await axios.get(
        "https://www.alphavantage.co/query",
        {
          params: {
            function: "NEWS_SENTIMENT",
            topics: "financial_markets",
            sort: "LATEST",
            limit: 30,
            apikey: API_KEY,
          },
        }
      );

    const feed =
      response.data.feed || [];

    const headlines =
      feed.map(
        (item: any) =>
          item.title
      );

    const text =
      headlines
        .join(" ")
        .toLowerCase();

    const domestic: string[] = [];
    const global: string[] = [];

    if (
      text.includes("bank")
    ) {
      domestic.push(
        "Banking sector remains strong"
      );
    }

    if (
      text.includes("india")
    ) {
      domestic.push(
        "Positive sentiment around Indian equities"
      );
    }

    if (
      text.includes("nvidia") ||
      text.includes("ai")
    ) {
      global.push(
        "AI-related stocks are driving gains"
      );
    }

    if (
      text.includes("fed")
    ) {
      global.push(
        "Markets reacting to Federal Reserve commentary"
      );
    }

    let macro =
      "No major macro event";

    if (
      text.includes("inflation") ||
      text.includes("cpi")
    ) {
      macro =
        "Inflation data remains a key market focus";
    }

    res.json({
      domestic: {
        index: "NIFTY 50",
        change: "+0.64%",
        reasons:
          domestic.length > 0
            ? domestic
            : [
                "Domestic markets remain stable"
              ],
      },

      global: {
        index: "S&P 500",
        change: "+1.20%",
        reasons:
          global.length > 0
            ? global
            : [
                "Global sentiment remains positive"
              ],
      },

      macro,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to generate market explanation",
    });
  }
});

export default router;