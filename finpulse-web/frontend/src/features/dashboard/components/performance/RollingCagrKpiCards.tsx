import { memo, useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Gauge, LineChart, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { CagrKpiMetric } from "./rollingCagrTypes";

interface Props {
  metrics: CagrKpiMetric[];
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = display;
    const delta = value - from;
    const duration = 750;

    const loop = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(from + delta * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display.toFixed(2)}%</>;
}

const icons = [TrendingUp, LineChart, Gauge, Activity];

function RollingCagrKpiCards({ metrics }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      {metrics.map((metric, index) => {
        const Icon = icons[index % icons.length];
        const diff = metric.value - metric.previous;
        const positive = diff >= 0;

        return (
          <div key={metric.id} className="bg-[#050711]/70 border border-slate-900 rounded-2xl p-4 hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{metric.label}</span>
              <Icon className="h-4 w-4 text-blue-400" />
            </div>

            <p className={`text-xl font-black font-mono mt-2 ${positive ? "text-emerald-400" : "text-rose-400"}`}>
              <AnimatedNumber value={metric.value} />
            </p>

            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
              {positive ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />}
              <span className={positive ? "text-emerald-400" : "text-rose-400"}>{positive ? "+" : ""}{diff.toFixed(2)}%</span>
              <span className="text-slate-500">vs previous period</span>
            </div>

            <div className="h-10 mt-2.5 opacity-80">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={metric.sparkline.map((value, idx) => ({ idx, value }))}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={positive ? "#10b981" : "#ef4444"}
                    fill={positive ? "#10b98120" : "#ef444420"}
                    strokeWidth={1.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(RollingCagrKpiCards);
