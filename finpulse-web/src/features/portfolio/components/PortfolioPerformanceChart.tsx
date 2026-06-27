import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
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
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/60" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              tickFormatter={(v) => `$${(v / 1000)}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '600'
              }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}