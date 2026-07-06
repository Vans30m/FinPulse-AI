import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const quote = await yahooFinance.quote('AAPL');
    console.log('AAPL QUOTE SUCCESS:', quote.symbol, quote.regularMarketPrice);
  } catch (err) {
    console.error('AAPL QUOTE FAILED:', err);
  }

  try {
    const quote = await yahooFinance.quote('BTC-USD');
    console.log('BTC-USD QUOTE SUCCESS:', quote.symbol, quote.regularMarketPrice);
  } catch (err) {
    console.error('BTC-USD QUOTE FAILED:', err);
  }
}

test();
