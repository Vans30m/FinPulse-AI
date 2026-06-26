import { useEffect, useState } from "react";
import { TrendingUp, Globe, AlertTriangle } from "lucide-react";
import { getMarketExplanation } from "../../../services/marketService";

interface MarketData {
  index: string;
  change: string;
  reasons: string[];
}

interface ExplanationData {
  domestic: MarketData;
  global: MarketData;
  macro: string;
}

export default function MarketExplanation() {
  const [data, setData] = useState<ExplanationData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await getMarketExplanation();
      setData(result);
    } catch (error) {
      console.error(error);
    }
  };

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0B1220] text-slate-600 dark:text-slate-400">
        Loading Market Explanation...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0B1220]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Why Are Markets Moving?
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            AI-generated drivers based on market sentiment
          </p>
        </div>
      </div>

      {/* Market Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Domestic */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">🇮🇳 Domestic Markets</h3>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
              Bullish
            </span>
          </div>

          <div className="mt-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">{data.domestic.index}</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {data.domestic.change}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {data.domestic.reasons.map((reason: string, index: number) => (
              <div key={index} className="text-sm text-slate-700 dark:text-slate-300">
                • {reason}
              </div>
            ))}
          </div>
        </div>

        {/* Global */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Global Markets
            </h3>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
              Bullish
            </span>
          </div>

          <div className="mt-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">{data.global.index}</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {data.global.change}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {data.global.reasons.map((reason: string, index: number) => (
              <div key={index} className="text-sm text-slate-700 dark:text-slate-300">
                • {reason}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Macro Event */}
      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Key Macro Event</h3>
        </div>
        <p className="mt-3 text-amber-700 dark:text-amber-300">{data.macro}</p>
      </div>
    </div>
  );
}