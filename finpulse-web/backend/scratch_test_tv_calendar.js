import axios from 'axios';

async function test() {
  try {
    const url = 'https://economic-calendar.tradingview.com/events';
    const params = {
      from: '2026-07-06T00:00:00.000Z',
      to: '2026-07-06T23:59:59.000Z',
      countries: 'US,IN,GB,EU,JP,CA,AU,CH'
    };
    const headers = {
      'Origin': 'https://www.tradingview.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    console.log("Fetching TradingView Economic Calendar JSON:", url);
    const response = await axios.get(url, { headers, params });
    console.log("Success! Keys in response:", Object.keys(response.data));
    console.log("Response Type:", typeof response.data);
    console.log("First item:", JSON.stringify(response.data.result?.[0] || response.data?.[0], null, 2));
    console.log("Total items:", response.data.result?.length || response.data?.length);
  } catch (err) {
    console.error("Error details:", err.response?.data || err.message);
  }
}

test();
