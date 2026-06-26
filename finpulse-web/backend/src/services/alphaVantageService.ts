import axios from "axios";

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export async function getNewsSentiment() {
  const response = await axios.get(
    "https://www.alphavantage.co/query",
    {
      params: {
        function: "NEWS_SENTIMENT",
        topics: "financial_markets",
        sort: "LATEST",
        limit: 20,
        apikey: API_KEY,
      },
    }
  );

  return response.data;
}