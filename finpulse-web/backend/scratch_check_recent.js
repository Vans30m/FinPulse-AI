import axios from 'axios';

async function main() {
  const symbol = 'HDFCBANK.NS';
  try {
    const res = await axios.get(`http://localhost:3000/api/charts/${symbol}?range=30d&interval=5m`);
    const quotes = res.data.quotes || [];
    const dates = quotes.map(q => q.date.split('T')[0]);
    const uniqueDates = Array.from(new Set(dates));
    console.log("Unique dates in HDFCBANK.NS 5m chart data:", uniqueDates);
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

main();
