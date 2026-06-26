export async function getStockCandles(
  symbol: string,
  timeframe: string
) {
  let range = "1y";

  switch (timeframe) {
    case "1D":
      range = "1d";
      break;

    case "1W":
      range = "5d";
      break;

    case "1M":
      range = "1mo";
      break;

    case "6M":
      range = "6mo";
      break;

    case "1Y":
      range = "1y";
      break;

    case "MAX":
      range = "max";
      break;
  }

  const response = await fetch(
    `http://localhost:3000/api/charts/${symbol}?range=${range}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch chart data: ${response.status}`
    );
  }

  return response.json();
}

export async function searchAssets(
  query: string
) {

  if (!query.trim()) {
    return [];
  }

  const response =
    await fetch(
      `http://localhost:3000/api/search?q=${encodeURIComponent(
        query
      )}`
    );

  if (!response.ok) {
    throw new Error(
      `Search failed: ${response.status}`
    );
  }

  return response.json();
}

export async function getAISentiment() {
  const response = await fetch(
    "http://localhost:3000/api/news-sentiment/sentiment"
  );

  return response.json();
}

export async function getMarketExplanation() {
  const response =
    await fetch(
      "http://localhost:3000/api/market-explanation"
    );

  return response.json();
}

export async function getStockSentiment(
  symbol: string
) {
  const response =
    await fetch(
      `http://localhost:3000/api/stock-sentiment/${symbol}`
    );

  return response.json();
}

export async function getFundamentals(
  symbol: string
) {
  const response =
    await fetch(
      `http://localhost:3000/api/fundamentals/${symbol}`
    );

  return response.json();
}

export async function getFinancialHealth(
  symbol: string
) {
  const response =
    await fetch(
      `http://localhost:3000/api/financial-health/${symbol}`
    );

  return response.json();
}

export async function getTechnicals(
  symbol: string
) {
  const response =
    await fetch(
      `http://localhost:3000/api/technical/${symbol}`
    );

  return response.json();
}

export async function getAnalystConsensus(
  symbol: string
) {
  const response =
    await fetch(
      `http://localhost:3000/api/analyst/${symbol}`
    );

  return response.json();
}

export async function getCompanyNews(
  symbol: string
) {
  const response =
    await fetch(
      `http://localhost:3000/api/company-news/${symbol}`
    );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch company news"
    );
  }

  return response.json();
}

export async function getNewsSentiment(
  symbol: string
) {
  const response =
    await fetch(
      `http://localhost:3000/api/news-sentiment/${symbol}`
    );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch news sentiment"
    );
  }

  return response.json();
}

export async function getAIScore(
  symbol: string
) {
  const response =
    await fetch(
      `http://localhost:3000/api/ai-score/${symbol}`
    );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch AI score"
    );
  }

  return response.json();
}

export async function
fetchGlobalMarkets() {

  const response =
    await fetch(
      "http://localhost:3000/api/global-markets"
    );

  return response.json();
}

export async function getMarketHistory(
  symbol: string,
  range: string = "1mo"
) {
  const response =
    await fetch(
      `http://localhost:3000/api/global-markets/history/${encodeURIComponent(
        symbol
      )}?range=${range}`
    );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch market history"
    );
  }

  return response.json();
}

export async function getMarketScreener(
  market: string,
  type: string
) {
  const endpoint =
    market === "india"
      ? `/api/screener/india?type=${type}`
      : `/api/screener?market=us&type=${type}`;

  const response =
    await fetch(
      `http://localhost:3000${endpoint}`
    );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch screener"
    );
  }

  return response.json();
}

export async function getDomesticScreener(
  type: string
) {
  const response =
    await fetch(
      `http://localhost:3000/api/screener/india?type=${type}`
    );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch screener"
    );
  }

  return response.json();
}

export async function getIndexSummary(
  symbol: string
) {
  const response =
    await fetch(
      `http://localhost:3000/api/index-summary/${encodeURIComponent(
        symbol
      )}`
    );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch index summary"
    );
  }

  return response.json();
}