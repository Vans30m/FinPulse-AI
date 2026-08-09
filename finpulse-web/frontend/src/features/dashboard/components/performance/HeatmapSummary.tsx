import { memo, useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Gauge, TrendingDown, TrendingUp, Waves } from "lucide-react";
import type { HeatmapSummaryMetrics } from "./types";

interface Props {
  metrics: HeatmapSummaryMetrics;
}

function AnimatedValue({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = display;
    const delta = value - from;
    const duration = 700;

    const loop = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(from + delta * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display.toFixed(decimals)}{suffix}</>;
}

function HeatmapSummary({ metrics }: Props) {
  const cards = [
    { key: "best", label: "Best Day", value: metrics.bestDay?.portfolioReturn ?? 0, suffix: "%", icon: TrendingUp, positive: true, decimals: 2 },
    { key: "worst", label: "Worst Day", value: metrics.worstDay?.portfolioReturn ?? 0, suffix: "%", icon: TrendingDown, positive: false, decimals: 2 },
    { key: "avg", label: "Average Daily Return", value: metrics.avgDailyReturn, suffix: "%", icon: Gauge, positive: metrics.avgDailyReturn >= 0, decimals: 2 },
    { key: "pos", label: "Positive Days", value: metrics.positiveDays, icon: ArrowUpRight, positive: true, decimals: 0 },
    { key: "neg", label: "Negative Days", value: metrics.negativeDays, icon: ArrowDownRight, positive: false, decimals: 0 },
    { key: "win", label: "Winning Percentage", value: metrics.winningPercentage, suffix: "%", icon: Activity, positive: true, decimals: 1 },
    { key: "wstreak", label: "Longest Winning Streak", value: metrics.longestWinningStreak, icon: CalendarDays, positive: true, decimals: 0 },
    { key: "lstreak", label: "Longest Losing Streak", value: metrics.longestLosingStreak, icon: Waves, positive: false, decimals: 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const tone = card.positive ? "text-emerald-400" : "text-rose-400";
        return (
          <div key={card.key} className="bg-[#050711]/70 border border-slate-900 rounded-2xl p-4 hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">{card.label}</span>
              <Icon className={`h-3.5 w-3.5 ${tone}`} />
            </div>
            <p className={`text-sm font-black font-mono ${tone}`}>
              <AnimatedValue value={card.value} suffix={card.suffix || ""} decimals={card.decimals} />
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default memo(HeatmapSummary);
