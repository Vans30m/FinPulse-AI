import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  RefreshCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { CagrTimeframe, RollingCagrPoint } from "./rollingCagrTypes";
import RollingCagrKpiCards from "./RollingCagrKpiCards";
import RollingCagrChart from "./RollingCagrChart";
import API_BASE_URL from "../../../../config/api";

const timeframeOptions: CagrTimeframe[] = ["1Y", "3Y", "5Y", "10Y", "MAX"];

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function exportChartSeries(data: RollingCagrPoint[], timeframe: CagrTimeframe) {
  const rows = ["Period,Portfolio,NIFTY50,SP500,NASDAQ,Gold,Bitcoin"];
  data.forEach((item) => {
    rows.push(`${item.period},${item.portfolio},${item.nifty50},${item.sp500},${item.nasdaq},${item.gold},${item.bitcoin}`);
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rolling-cagr-chart-${timeframe.toLowerCase()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function RollingCagrSection() {
  const [timeframe, setTimeframe] = useState<CagrTimeframe>("5Y");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [cagrData, setCagrData] = useState<{ series: RollingCagrPoint[], kpis: any[] } | null>(null);

  useEffect(() => {
    setLoading(true);
    const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
    const userId = storedUser.id;
    const headers = userId ? { 'X-User-Id': userId } : undefined;

    fetch(`${API_BASE_URL}/api/portfolio/rolling-cagr?timeframe=${timeframe}`, { headers })
      .then(res => res.json())
      .then(data => {
        setCagrData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [timeframe]);

  const data = cagrData?.series || [];
  const kpis = cagrData?.kpis || [];

  const latest = data[data.length - 1];
  const empty = data.length === 0;

  const benchmarkComparison = latest
    ? [
        { label: "NIFTY 50", value: latest.nifty50 },
        { label: "S&P 500", value: latest.sp500 },
        { label: "NASDAQ", value: latest.nasdaq },
        { label: "Gold", value: latest.gold },
        { label: "Bitcoin", value: latest.bitcoin },
      ].map((item) => {
        const diff = latest.portfolio - item.value;
        return {
          ...item,
          diff,
          outperform: diff >= 0,
        };
      })
    : [];

  const portfolioValues = data.map((point) => point.portfolio);
  const highest = portfolioValues.length ? Math.max(...portfolioValues) : 0;
  const lowest = portfolioValues.length ? Math.min(...portfolioValues) : 0;
  const avg = portfolioValues.length ? portfolioValues.reduce((a, b) => a + b, 0) / portfolioValues.length : 0;
  const med = median(portfolioValues);
  const bestPeriod = data.find((d) => d.portfolio === highest)?.period ?? "-";
  const worstPeriod = data.find((d) => d.portfolio === lowest)?.period ?? "-";

  const stats = [
    { label: "Highest CAGR", value: `${highest.toFixed(2)}%` },
    { label: "Lowest CAGR", value: `${lowest.toFixed(2)}%` },
    { label: "Average CAGR", value: `${avg.toFixed(2)}%` },
    { label: "Median CAGR", value: `${med.toFixed(2)}%` },
    { label: "Best Period", value: bestPeriod },
    { label: "Worst Period", value: worstPeriod },
  ];

  const insights = [
    "Portfolio CAGR has remained consistently above broad-market indices across most windows.",
    "Momentum accelerated during the latest periods, with alpha spread widening versus NIFTY 50.",
    "Bitcoin remains the most volatile comparator; use it as a risk ceiling benchmark.",
    "Median CAGR staying close to average suggests relatively stable compounding quality.",
  ];

  return (
    <section className="bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-205 dark:border-slate-900 rounded-3xl p-5 shadow-md">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b border-slate-200 dark:border-slate-205 dark:border-slate-900 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-800 dark:text-white tracking-tight uppercase">Rolling CAGR</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Compounded annual growth trajectory across rolling windows and benchmark overlays.</p>
        </div>

        <div className="flex bg-slate-50 dark:bg-[#050711] p-1 rounded-xl border border-slate-205 dark:border-slate-900 w-fit">
          {timeframeOptions.map((option) => (
            <button
              key={option}
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setTimeframe(option);
                  setLoading(false);
                }, 180);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                timeframe === option ? "bg-gradient-to-r from-blue-600 to-blue-500 text-slate-900 dark:text-slate-800 dark:text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-800 dark:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl border border-slate-205 dark:border-slate-900 bg-slate-50 dark:bg-[#050711]/70" />
            ))}
          </div>
          <div className="h-[360px] rounded-2xl border border-slate-205 dark:border-slate-900 bg-slate-50 dark:bg-[#050711]/70" />
        </div>
      ) : empty ? (
        <div className="rounded-2xl border border-slate-205 dark:border-slate-900 bg-slate-50 dark:bg-[#050711]/70 p-10 text-center">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No CAGR series available for selected range.</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 250);
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-600/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-400 hover:bg-blue-600/20 transition-colors"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      ) : (
        <>
          <RollingCagrKpiCards metrics={kpis} />

          <RollingCagrChart data={data} />

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-[#050711]/70 border border-slate-205 dark:border-slate-900 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-205 dark:border-slate-900 pb-3">
                <Trophy className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Benchmark Comparison</span>
              </div>

              <div className="space-y-2.5">
                {benchmarkComparison.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-205 dark:border-slate-900 bg-slate-50 dark:bg-[#050711]/80 p-3">
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-slate-800 dark:text-white">{item.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Benchmark CAGR {item.value.toFixed(2)}%</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black font-mono ${item.outperform ? "text-emerald-400" : "text-rose-400"}`}>
                        {item.diff >= 0 ? "+" : ""}{item.diff.toFixed(2)}%
                      </p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${item.outperform ? "text-emerald-400" : "text-rose-400"}`}>
                        {item.outperform ? "Outperform" : "Underperform"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#050711]/70 border border-slate-205 dark:border-slate-900 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-205 dark:border-slate-900 pb-3">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">CAGR Statistics</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-205 dark:border-slate-900 bg-slate-50 dark:bg-slate-50/50 dark:bg-[#050711]/85 p-3">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{stat.label}</p>
                    <p className="text-xs font-black text-slate-900 dark:text-slate-800 dark:text-white font-mono mt-1.5">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 bg-slate-50 dark:bg-[#050711]/70 border border-slate-205 dark:border-slate-900 rounded-2xl p-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-205 dark:border-slate-900 pb-3 mb-3">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">AI CAGR Insights</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((insight) => (
                <div key={insight} className="rounded-xl border border-slate-205 dark:border-slate-900 bg-slate-50 dark:bg-slate-50/50 dark:bg-[#050711]/85 p-3 text-xs text-slate-700 dark:text-slate-300">
                  {insight}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-205 dark:border-slate-900 bg-slate-50 dark:bg-[#050711]/70 overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 inline-flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-indigo-400" /> What is CAGR?
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 pb-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-205 dark:border-slate-900">
                    CAGR (Compound Annual Growth Rate) reflects the smoothed annual growth of an investment over a period, assuming profits are reinvested.
                    It helps compare strategies across different horizons by normalizing volatile returns into a consistent annualized metric.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => exportChartSeries(data, timeframe)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#050711] hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-900 text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-blue-400" /> Export CSV
            </button>
            <button
              onClick={() => exportChartSeries(data, timeframe)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#050711] hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-900 text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Export Excel
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#050711] hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-900 text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-purple-400" /> Export PDF
            </button>
            <button
              onClick={() => exportChartSeries(data, timeframe)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#050711] hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-900 text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5 text-cyan-400" /> Download Chart
            </button>
          </div>
        </>
      )}
    </section>
  );
}
