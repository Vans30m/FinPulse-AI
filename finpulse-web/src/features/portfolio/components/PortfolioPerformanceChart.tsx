import { useMemo } from "react";
import CandlestickChart from "../../../components/charts/CandlestickChart";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, TrendingDown, DollarSign } from "lucide-react";

interface Props {
  data: {
    month: string;
    value: number;
    invested: number;
    profit: number;
  }[];
  currencySymbol?: string;
}

export default function PortfolioPerformanceChart({
  data: initialData,
  currencySymbol = "$",
}: Props) {
  const hasNoData = !initialData || initialData.length === 0;

  if (hasNoData) {
    return (
      <div className="glass-panel p-6 flex flex-col justify-center items-center py-20 text-center">
        <TrendingUp className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
        <h3 className="font-extrabold text-base text-slate-750 dark:text-white">
          Portfolio Performance History
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
          No transaction history found. Your performance chart will generate automatically once you add your first transaction.
        </p>
      </div>
    );
  }

  // Calculate summary stats using the last available data point
  const lastPoint = initialData[initialData.length - 1];
  const totalInvested = lastPoint?.invested ?? 0;
  const currentValue = lastPoint?.value ?? 0;
  const totalProfit = lastPoint?.profit ?? (currentValue - totalInvested);
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const isProfit = totalProfit >= 0;

  // Map month strings to sequential date strings for lightweight-charts compatibility
  const mappedChartData = useMemo(() => {
    return initialData.map((d, index) => {
      const date = new Date("2026-01-01");
      date.setDate(date.getDate() + index);
      const timeStr = date.toISOString().split("T")[0];
      return {
        time: timeStr,
        invested: d.invested,
        value: d.value
      };
    });
  }, [initialData]);

  const seriesKeys = useMemo(() => [
    { key: "invested", color: "#3b82f6" }, // Blue line for how much is invested
    { key: "value", color: "#10b981" }      // Green line for how much is made (current value)
  ], []);

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Portfolio Performance
          </h2>
        </div>
        
        {/* Performance Legend & Quick Stats */}
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Invested Amount</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Current Value (Made)</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Invested */}
        <div className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Total Invested</span>
            <h3 className="text-lg font-black text-slate-850 dark:text-white mt-1">
              {currencySymbol}{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        {/* Current Value */}
        <div className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Current Value (Made)</span>
            <h3 className="text-lg font-black text-slate-850 dark:text-white mt-1">
              {currencySymbol}{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Total Profit / Return</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className={`text-lg font-black ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
                {isProfit ? "+" : "-"}{currencySymbol}{Math.abs(totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className={`text-xs font-bold flex items-center ${isProfit ? "text-emerald-500" : "text-rose-500"}`}>
                {isProfit ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {profitPercentage.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${isProfit ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
            {isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <CandlestickChart
          customMultiData={mappedChartData}
          seriesKeys={seriesKeys}
          chartType="multiline"
          height={320}
        />
      </div>
    </div>
  );
}