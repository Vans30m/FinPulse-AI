import axios from "axios";

const API_KEY =
process.env.FINNHUB_API_KEY;

export async function getCompanyNews(
  symbol: string
) {
  const today =
    new Date();

  const from =
    new Date(
      Date.now() -
      7 * 24 * 60 * 60 * 1000
    );

  const response =
    await axios.get(
      "https://finnhub.io/api/v1/company-news",
      {
        params: {
          symbol,
          from:
            from
              .toISOString()
              .split("T")[0],
          to:
            today
              .toISOString()
              .split("T")[0],
          token: API_KEY,
        },
      }
    );

  return response.data;
}