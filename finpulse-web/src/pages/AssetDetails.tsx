import { useParams, useLocation, useNavigate } from "react-router-dom";
import CandlestickChart from "../components/charts/CandlestickChart";
import TimeframeSelector from "../components/charts/TimeframeSelector";
import { useState, useEffect } from "react";
import { getFundamentals, getFinancialHealth } from "../services/marketService";
import { ArrowLeft, Landmark, BarChart3, Activity, Globe } from "lucide-react";
import IndexStatistics from "../components/asset/IndexStatistics";
import { useIndexSummary } from "../hooks/useIndexSummary";
import IndexPerformance
from "../components/asset/IndexPerformance";

import {
  useIndexPerformance,
} from "../hooks/useIndexPerformance";

interface Fundamentals {
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

interface FinancialHealth {
  revenue: number;
  revenueGrowth: number;
  earningsGrowth: number;
  profitMargin: number;
}

export default function AssetDetails() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  console.log(location.state);

  const assetName = location.state?.name || symbol;

  const DISPLAY_NAMES: Record<string, string> = {
    "^NSEI": "NIFTY 50",
    "^BSESN": "SENSEX",
    "^NSEBANK": "NIFTY BANK",
    "^CNXAUTO": "NIFTY AUTO",
    "^CNXIT": "NIFTY IT",
    "^CNXPHARMA": "NIFTY PHARMA",
    "^CNXFMCG": "NIFTY FMCG",
    "^CNXMETAL": "NIFTY METAL",
    "^DJI": "DOW JONES",
    "^GSPC": "S&P 500",
    "^IXIC": "NASDAQ",
    "^RUT": "RUSSELL 2000",
  };

  const displayName = DISPLAY_NAMES[symbol || ""] || symbol;

  const [timeframe, setTimeframe] = useState("1D");
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null);

  useEffect(() => {
    loadFundamentals();
    loadFinancialHealth();
  }, [symbol]);

  const loadFundamentals = async () => {
    try {
      if (!symbol) return;
      const data = await getFundamentals(symbol);
      setFundamentals(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadFinancialHealth = async () => {
    try {
      if (!symbol) return;
      const data = await getFinancialHealth(symbol);
      setFinancialHealth(data);
    } catch (error) {
      console.error(error);
    }
  };

  const isIndex = symbol?.startsWith("^");
  const { data: indexSummary } = useIndexSummary(symbol || "");

  const {
  data: performanceHistory =
    [],
} =
  useIndexPerformance(
    symbol || ""
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Header Profile Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {location.state?.name ? assetName : displayName}
            </h1>
            
            {/* Meta tags layout row */}
            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Symbol:</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-sm tracking-wide font-semibold text-blue-600 dark:text-cyan-400">
                  {symbol}
                </span>
              </div>

              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-6">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Exchange:</span>
                <span className="font-semibold">
                  Exchange:
{
  location.state?.exchange ||
  "GLOBAL"
}
Asset Type:
{
  location.state?.type ||
  "Asset"
}
                </span>
              </div>

              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-6">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Asset Type:</span>
                <span className="font-semibold">
                  {symbol?.startsWith("^") ? "Index" : "Stock"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Dashboard Wrapper */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold tracking-tight">Market Valuation</h2>
          </div>
          <TimeframeSelector selected={timeframe} onChange={setTimeframe} />
        </div>

        <div className="w-full bg-slate-50 dark:bg-slate-950/40 rounded-xl overflow-hidden p-2">
          <CandlestickChart symbol={symbol || "AAPL"} timeframe={timeframe} />
        </div>
      </div>

      {/* Dual Column Financial Readouts Grid */}
      {isIndex ? (
  <div className="grid lg:grid-cols-2 gap-6">

    <IndexStatistics
      data={indexSummary}
    />

    <IndexPerformance
      history={
        performanceHistory
      }
    />

  </div>
) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Fundamentals Metric Block */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
              <Landmark className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-bold tracking-tight">Key Fundamentals</h2>
            </div>

            {!fundamentals ? (
              <div className="py-6 text-center text-sm text-slate-400 animate-pulse">
                Syncing basic fundamental arrays...
              </div>
            ) : (
              <dl className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center py-0.5">
                  <dt className="text-slate-500 dark:text-slate-400">Market Cap</dt>
                  <dd className="font-semibold tracking-tight">
                    ${(fundamentals.marketCap / 1000000000).toFixed(1)}B
                  </dd>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <dt className="text-slate-500 dark:text-slate-400">P/E Ratio</dt>
                  <dd className="font-mono font-semibold">{fundamentals.peRatio}</dd>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <dt className="text-slate-500 dark:text-slate-400">EPS</dt>
                  <dd className="font-mono font-semibold">${fundamentals.eps}</dd>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <dt className="text-slate-500 dark:text-slate-400">Dividend Yield</dt>
                  <dd className="font-semibold">{(fundamentals.dividendYield * 100).toFixed(2)}%</dd>
                </div>

                <div className="flex justify-between items-center py-0.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <dt className="text-slate-500 dark:text-slate-400">52W High</dt>
                  <dd className="font-semibold text-emerald-600 dark:text-emerald-400">${fundamentals.fiftyTwoWeekHigh}</dd>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <dt className="text-slate-500 dark:text-slate-400">52W Low</dt>
                  <dd className="font-semibold text-rose-600 dark:text-rose-400">${fundamentals.fiftyTwoWeekLow}</dd>
                </div>
              </dl>
            )}
          </div>

          {/* Financial Health Scoring & Metrics Block */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
                <Activity className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-bold tracking-tight">Financial Health</h2>
              </div>

              {financialHealth && (
                <div className="mb-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Financial Health Score
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {Math.round(
                        (financialHealth.profitMargin * 100 +
                          financialHealth.revenueGrowth * 100 +
                          financialHealth.earningsGrowth * 100) /
                          3
                      )}
                      <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-0.5">/100</span>
                    </div>
                  </div>
                  <Globe className="h-8 w-8 text-slate-300 dark:text-slate-700 shrink-0" />
                </div>
              )}

              {!financialHealth ? (
                <div className="py-6 text-center text-sm text-slate-400 animate-pulse">
                  Analyzing structural health telemetry...
                </div>
              ) : (
                <dl className="space-y-3.5 text-sm">
                  <div className="flex justify-between items-center py-0.5">
                    <dt className="text-slate-500 dark:text-slate-400">Revenue</dt>
                    <dd className="font-semibold tracking-tight">
                      ${(financialHealth.revenue / 1000000000).toFixed(1)}B
                    </dd>
                  </div>

                  <div className="flex justify-between items-center py-0.5">
                    <dt className="text-slate-500 dark:text-slate-400">Revenue Growth</dt>
                    <dd className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{(financialHealth.revenueGrowth * 100).toFixed(1)}%
                    </dd>
                  </div>

                  <div className="flex justify-between items-center py-0.5">
                    <dt className="text-slate-500 dark:text-slate-400">Earnings Growth</dt>
                    <dd className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{(financialHealth.earningsGrowth * 100).toFixed(1)}%
                    </dd>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <dt className="text-slate-500 dark:text-slate-400">Profit Margin</dt>
                    <dd className="text-cyan-600 dark:text-cyan-400 font-semibold">
                      {(financialHealth.profitMargin * 100).toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
        </div>
      )}
    </div>  
  );
}