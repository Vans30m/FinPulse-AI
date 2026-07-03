import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieIcon, Layers3, TrendingUp } from "lucide-react";

interface Props {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = [
  "#06b6d4",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
];

export default function PortfolioAllocationChart({
  data,
}: Props) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dominant = data.length > 0
    ? [...data].sort((a, b) => b.value - a.value)[0]
    : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] backdrop-blur-sm p-6 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.65)] group transition-all duration-300 hover:border-blue-500/20 dark:hover:border-cyan-500/20 hover:shadow-[0_18px_48px_-28px_rgba(6,182,212,0.38)]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-cyan-500/[0.04] pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <PieIcon className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Portfolio Allocation
            </h2>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-lg">
            Capital distribution across every active market bucket, optimized for quick allocation scanning.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.03] px-3 py-2">
          <Layers3 className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Largest Slice</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{dominant ? dominant.name : "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="relative h-[270px] pointer-events-none">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={95}
              innerRadius={65}
              paddingAngle={4}
              labelLine={false}
              label={false}
            >
              {data.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index %
                          COLORS.length
                      ]
                    }
                    stroke="transparent"
                  />
                )
              )}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-[#0c1120]/80 px-5 py-3 text-center shadow-lg backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Total Capital</p>
            <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Custom Clean Legend Grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-5">
        {data.map((item, index) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
          return (
            <div key={item.name} className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] p-4 min-w-0">
              <div className="flex items-start gap-3 min-w-0">
                <div 
                  className="h-3.5 w-3.5 rounded-full shrink-0 mt-1" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate leading-tight">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-2 text-[10px] font-semibold text-slate-400">
                    <span>${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-cyan-400">
                      <TrendingUp className="h-3 w-3" />
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}