import YahooFinance from 'yahoo-finance2';

export const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  validation: {
    logErrors: false
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
