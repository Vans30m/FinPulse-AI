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
    <div className="relative overflow-hidden p-1 transition-all duration-300">
      <div className="relative h-[180px] pointer-events-none flex items-center justify-center">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={75}
              innerRadius={55}
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
          <div className="rounded-full border border-slate-200/60 dark:border-white/5 bg-white/85 dark:bg-[#0c1120]/85 px-4 py-2 text-center shadow-md backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Total Capital</p>
            <p className="mt-0.5 text-base font-black text-slate-900 dark:text-white">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
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