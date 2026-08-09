import axios from 'axios';

async function test() {
  try {
    const symbol = 'BTC-USD';
    const range = '5y';
    const interval = '1d';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    const chartResult = response.data?.chart?.result?.[0];
    if (chartResult && chartResult.timestamp) {
      const timestamps = chartResult.timestamp;
      const quote = chartResult.indicators?.quote?.[0];

      const mappedCandles = timestamps.map((ts, i) => {
        return {
          time: ts, // simulating unix timestamp in seconds
          open: quote?.open?.[i] ?? null,
          close: quote?.close?.[i] ?? null,
        };
      }).filter((q) => q.open !== null && q.close !== null);

      let isStrictlyIncreasing = true;
      let duplicateCount = 0;
      const seenTimes = new Set();

      for (let i = 0; i < mappedCandles.length; i++) {
        const t = mappedCandles[i].time;
        if (seenTimes.has(t)) {
          duplicateCount++;
        }
        seenTimes.add(t);

        if (i > 0 && t <= mappedCandles[i - 1].time) {
          isStrictlyIncreasing = false;
        }
      }

      console.log("Total candles:", mappedCandles.length);
      console.log("Strictly increasing:", isStrictlyIncreasing);
      console.log("Duplicate timestamps:", duplicateCount);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
