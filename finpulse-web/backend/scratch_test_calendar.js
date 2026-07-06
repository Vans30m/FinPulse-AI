import axios from 'axios';
import 'dotenv/config';

const apiKey = "d8dud89r01qhm4ahd0v0d8dud89r01qhm4ahd0vg";
const dateStr = "2026-07-06";

async function test() {
  try {
    const url = `https://finnhub.io/api/v1/calendar/economic?from=${dateStr}&to=${dateStr}&token=${apiKey}`;
    console.log("Fetching URL:", url);
    const response = await axios.get(url);
    console.log("Response Keys:", Object.keys(response.data));
    console.log("Response Type:", typeof response.data);
    console.log("Is Array:", Array.isArray(response.data));
    console.log("First item:", JSON.stringify(response.data[0] || response.data.economicCalendar?.[0], null, 2));
    console.log("Total items:", response.data.length || response.data.economicCalendar?.length);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
