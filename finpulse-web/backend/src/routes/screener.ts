import express from "express";
import axios from "axios";
import {
  getDomesticScreener,
} from "../services/yahooService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const market =
      String(req.query.market || "us");

    const type =
      String(req.query.type || "gainers");

    let predefinedId = "";

    if (market === "us") {
  let predefinedId = "";

  if (type === "gainers") {
    predefinedId = "day_gainers";
  }

  if (type === "losers") {
    predefinedId = "day_losers";
  }

  if (type === "active") {
    predefinedId = "most_actives";
  }

  const response = await axios.get(
    `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?count=25&scrIds=${predefinedId}`
  );

  const quotes =
    response.data.finance.result[0].quotes;

  return res.json(
    quotes.map((stock: any) => ({
      symbol: stock.symbol,
      name:
        stock.longName ||
        stock.shortName ||
        stock.symbol,
      price:
        stock.regularMarketPrice,
      change:
        stock.regularMarketChange,
      changePercent:
        stock.regularMarketChangePercent,
      volume:
        stock.regularMarketVolume,
      exchange:
        stock.fullExchangeName,
    }))
  );
}

if (market === "india") {
  const response = await axios.post(
    "https://query1.finance.yahoo.com/v1/finance/screener",
    {
      offset: 0,
      size: 25,
      sortField:
        type === "active"
          ? "dayvolume"
          : "percentchange",

      sortType:
        type === "losers"
          ? "ASC"
          : "DESC",

      quoteType: "EQUITY",

      query: {
        operator: "AND",
        operands: [
          {
            operator: "eq",
            operands: [
              "region",
              "in",
            ],
          },
        ],
      },
    },
    {
      headers: {
        "Content-Type":
          "application/json",
      },
    }
  );

  const quotes =
    response.data.finance.result[0].quotes;

  return res.json(
    quotes.map((stock: any) => ({
      symbol: stock.symbol,
      name:
        stock.longName ||
        stock.shortName ||
        stock.symbol,
      price:
        stock.regularMarketPrice,
      change:
        stock.regularMarketChange,
      changePercent:
        stock.regularMarketChangePercent,
      volume:
        stock.regularMarketVolume,
      exchange:
        stock.fullExchangeName,
    }))
  );
}

    const response =
  await axios.get(
    `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?count=25&scrIds=${predefinedId}`
  );

const quotes =
  response.data.finance.result[0].quotes;

const data = quotes.map((stock: any) => ({
  symbol: stock.symbol,
  name:
    stock.longName ||
    stock.shortName ||
    stock.symbol,

  price:
    stock.regularMarketPrice,

  change:
    stock.regularMarketChange,

  changePercent:
    stock.regularMarketChangePercent,

  volume:
    stock.regularMarketVolume,

  exchange:
    stock.fullExchangeName,
}));

res.json(data);
  } catch (error: any) {
    console.log(
  error.response?.status
);

console.log(
  error.response?.data
);

    res.status(500).json({
      error:
        error.message ||
        "Yahoo screener failed",
    });
  }
});

router.get(
  "/india",
  async (req, res) => {
    try {
      const type =
        String(
          req.query.type ||
          "gainers"
        );

      const data =
        await getDomesticScreener(
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