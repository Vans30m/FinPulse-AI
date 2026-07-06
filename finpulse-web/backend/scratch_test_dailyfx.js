import axios from 'axios';

async function test() {
  try {
    const url = 'https://www.dailyfx.com/calendar/calendar.json';
    console.log("Fetching DailyFX Calendar JSON:", url);
    const response = await axios.get(url);
    console.log("Success! Keys in response:", Object.keys(response.data).slice(0, 10));
    console.log("Response Type:", typeof response.data);
    console.log("Is Array:", Array.isArray(response.data));
    console.log("First item:", JSON.stringify(response.data[0], null, 2));
    console.log("Total items:", response.data.length);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
