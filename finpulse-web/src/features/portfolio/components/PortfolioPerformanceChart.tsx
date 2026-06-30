import { useState } from "react";
import CandlestickChart from "../../../components/charts/CandlestickChart";
import { TrendingUp } from "lucide-react";

interface Props {
  data: {
    month: string;
    value: number;
  }[];
}

export default function PortfolioPerformanceChart({
  data: initialData,
}: Props) {
  const [timeframe, setTimeframe] = useState<"ALL" | "1Y" | "3M" | "1M">("ALL");

  const datasets = {
    ALL: initialData && initialData.length > 0 ? initialData : [
      { month: "Jan 2025", value: 85000 },
      { month: "Mar 2025", value: 92000 },
      { month: "Jun 2025", value: 96000 },
      { month: "Sep 2025", value: 104000 },
      { month: "Dec 2025", value: 111000 },
      { month: "Mar 2026", value: 118000 },
    ],
    "1Y": [
      { month: "Jul 25", value: 96000 },
      { month: "Sep 25", value: 101000 },
      { month: "Nov 25", value: 106000 },
      { month: "Jan 26", value: 111000 },
      { month: "Mar 26", value: 114000 },
      { month: "May 26", value: 118000 },
    ],
    "3M": [
      { month: "Apr 01", value: 111000 },
      { month: "Apr 15", value: 113000 },
      { month: "May 01", value: 114500 },
      { month: "May 15", value: 116000 },
      { month: "Jun 01", value: 117200 },
      { month: "Jun 15", value: 118000 },
    ],
    "1M": [
      { month: "Jun 01", value: 115000 },
      { month: "Jun 08", value: 116200 },
      { month: "Jun 15", value: 115800 },
      { month: "Jun 22", value: 117000 },
      { month: "Jun 27", value: 118000 },
    ]
  };

  const chartData = datasets[timeframe];

  // Map month strings to sequential date strings for lightweight-charts compatibility
  const mappedChartData = chartData.map((d, index) => {
    const date = new Date("2026-01-01");
    date.setDate(date.getDate() + index);
    const timeStr = date.toISOString().split("T")[0];
    return {
      time: timeStr,
      value: d.value
    };
  });

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Portfolio Performance
          </h2>
        </div>

        {/* Timeframe Selector Pills */}
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs font-bold">
          {(["ALL", "1Y", "3M", "1M"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === t
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[320px] w-full">
        <CandlestickChart
          customData={mappedChartData}
          chartType="area"
          height={320}
        />
      </div>
    </div>
  );
}