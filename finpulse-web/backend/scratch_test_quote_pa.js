import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const quote = await yahooFinance.quote('PA=F');
    console.log('PA=F QUOTE SUCCESS:', quote.symbol, quote.regularMarketPrice);
  } catch (err) {
    console.error('PA=F QUOTE FAILED:', err);
  }
}

test();
