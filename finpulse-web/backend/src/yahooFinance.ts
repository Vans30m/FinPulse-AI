import YahooFinance from 'yahoo-finance2';

export const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  validation: {
    logErrors: false
  },
  fetchOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  }
});

// Monkey-patch _moduleExec to globally disable result schema validation.
// This prevents FailedYahooValidationError from crashing the backend when Yahoo's API response structure varies.
const originalModuleExec = (yahooFinance as any)._moduleExec;
(yahooFinance as any)._moduleExec = function (opts: any) {
  if (!opts.moduleOptions) {
    opts.moduleOptions = {};
  }
  opts.moduleOptions.validateResult = false;
  return originalModuleExec.call(this, opts);
};
