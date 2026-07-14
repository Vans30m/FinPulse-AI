import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const summary = await yahooFinance.quoteSummary('^CNXIT', {
      modules: ['summaryDetail', 'defaultKeyStatistics', 'price']
    });
    console.log('SUMMARY DETAIL:', summary.summaryDetail);
    console.log('DEFAULT KEY STATS:', summary.defaultKeyStatistics);
    console.log('PRICE:', summary.price);
  } catch (err) {
    console.error('SUMMARY FAILED:', err);
  }
}

test();
