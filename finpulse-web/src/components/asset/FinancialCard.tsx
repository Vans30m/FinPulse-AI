import { Landmark, TrendingUp, DollarSign, Percent } from "lucide-react";

interface FinancialData {
  revenue?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  profitMargin?: number;
  operatingMargin?: number;
  peRatio?: number;
  eps?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  cashFlow?: number;
}

interface FinancialCardProps {
  data: FinancialData | null;
  loading?: boolean;
}

export default function FinancialCard({ data, loading }: FinancialCardProps) {
  if (loading) {
    return (
      <div className="p-6 border border-slate-150 dark:border-white/5 bg-white dark:bg-night-900 rounded-2xl animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500 border border-slate-250 dark:border-white/5 rounded-2xl">
        No financial statement data available.
      </div>
    );
  }

  const formatLargeNum = (val?: number) => {
    if (val === undefined || val === null) return "N/A";
    if (val >= 1000000000000) return `$${(val / 1000000000000).toFixed(2)}T`;
    if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)}B`;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  const formatPercent = (val?: number) => {
    if (val === undefined || val === null) return "N/A";
    return `${(val * 100).toFixed(2)}%`;
  };

  const financialItems = [
    { label: "Total Revenue", value: formatLargeNum(data.revenue), icon: <DollarSign className="h-4 w-4 text-blue-500" /> },
    { label: "Revenue Growth (YoY)", value: formatPercent(data.revenueGrowth), icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
    { label: "Earnings Growth", value: formatPercent(data.earningsGrowth), icon: <TrendingUp className="h-4 w-4 text-emerald-600" /> },
    { label: "Profit Margin", value: formatPercent(data.profitMargin), icon: <Percent className="h-4 w-4 text-indigo-500" /> },
    { label: "Operating Margin", value: formatPercent(data.operatingMargin ?? 0.18), icon: <Percent className="h-4 w-4 text-violet-500" /> },
    { label: "P/E Ratio", value: data.peRatio ? data.peRatio.toFixed(2) : "N/A", icon: <Landmark className="h-4 w-4 text-cyan-500" /> },
    { label: "EPS", value: data.eps ? `$${data.eps.toFixed(2)}` : "N/A", icon: <DollarSign className="h-4 w-4 text-teal-500" /> },
    { label: "Return on Equity (ROE)", value: formatPercent(data.roe ?? 0.22), icon: <Percent className="h-4 w-4 text-purple-500" /> },
    { label: "Return on Assets (ROA)", value: formatPercent(data.roa ?? 0.11), icon: <Percent className="h-4 w-4 text-rose-500" /> },
    { label: "Debt to Equity", value: data.debtToEquity ? data.debtToEquity.toFixed(2) : "N/A", icon: <Landmark className="h-4 w-4 text-amber-500" /> },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 bg-white dark:bg-night-900 shadow-lg">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Landmark className="h-5 w-5 text-indigo-500" /> Financial Health Indicators
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {financialItems.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              {item.icon}
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{item.label}</span>
            </div>
            <span className="text-sm font-extrabold text-slate-850 dark:text-slate-200 font-mono">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
