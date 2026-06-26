import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieIcon } from "lucide-react";

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

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <PieIcon className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Portfolio Allocation
        </h2>
      </div>

      <div className="h-[240px] pointer-events-none">
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
      </div>

      {/* Custom Clean Legend Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-5">
        {data.map((item, index) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
          return (
            <div key={item.name} className="flex items-center gap-2.5 min-w-0">
              <div 
                className="h-3 w-3 rounded-full shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate leading-tight">
                  {item.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold text-slate-400">
                  <span>${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-cyan-400">{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}