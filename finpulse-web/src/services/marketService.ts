export async function getStockCandles(
  symbol: string,
  timeframe: string
) {
  let interval = "1day";
  let outputsize = 500;

  switch (timeframe) {
    case "1D":
      interval = "5min";
      outputsize = 300;
      break;

    case "5D":
      interval = "15min";
      outputsize = 500;
      break;

    case "1M":
      interval = "1day";
      outputsize = 30;
      break;

    case "6M":
      interval = "1day";
      outputsize = 180;
      break;

    case "1Y":
      interval = "1day";
      outputsize = 365;
      break;

    case "MAX":
      interval = "1day";
      outputsize = 5000;
      break;
  }

  const response = await fetch(
    `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=5000&apikey=${import.meta.env.VITE_TWELVEDATA_API_KEY}`
  );

  const data = await response.json();

  console.log("TWELVE DATA", data);

  return data;
}