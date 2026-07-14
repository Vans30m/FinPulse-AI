// Re-export facade to expose modularized services and maintain backward compatibility
export {
  getAssetsHistoricalGrowth,
  getYahooCandles,
  getMarketHistory,
  getHistoricalChart
} from './chartService.js';

export {
  getTechnicalIndicators,
  getFinancialHealth,
  getAnalystConsensus,
  getAIScore
} from './technicalAnalysisService.js';

export {
  getGlobalMarketQuote,
  getAllGlobalMarkets,
  getIndexSummary
} from './globalMarketService.js';

export {
  getMarketScreener,
  getDomesticScreener,
  getUpcomingEarnings,
  getUpcomingEarningsForMarket,
  getAssetEvents
} from './screenerService.js';

export {
  getCompanyNews,
  getFundamentals
} from './companyService.js';