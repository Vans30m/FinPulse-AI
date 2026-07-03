import { useMemo, useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DailyPerformancePoint, HeatmapAssetFilter, HeatmapRange, HeatmapSummaryMetrics } from "./types";
import HeatmapFilters from "./HeatmapFilters";
import HeatmapSummary from "./HeatmapSummary";
import HeatmapCalendar from "./HeatmapCalendar";
import HeatmapLegend from "./HeatmapLegend";
import HeatmapTooltip from "./HeatmapTooltip";
import HeatmapInsights from "./HeatmapInsights";
import HeatmapDayModal from "./HeatmapDayModal";

interface CalendarWeek {
  index: number;
  days: (DailyPerformancePoint | null)[];
}

interface MonthLabel {
  name: string;
  index: number;
}

function toKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
}

function endOfWeek(date: Date) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + (6 - d.getUTCDay()));
  return d;
}

function buildCalendar(days: DailyPerformancePoint[]): { weeks: CalendarWeek[]; monthLabels: MonthLabel[] } {
  if (days.length === 0) return { weeks: [], monthLabels: [] };

  const map = new Map(days.map((d) => [d.date, d]));
  const first = startOfWeek(new Date(`${days[0].date}T00:00:00Z`));
  const last = endOfWeek(new Date(`${days[days.length - 1].date}T00:00:00Z`));
  const weeks: CalendarWeek[] = [];
  const monthLabels: MonthLabel[] = [];
  let weekIndex = 0;

  for (let weekStart = new Date(first); weekStart <= last; weekStart.setUTCDate(weekStart.getUTCDate() + 7)) {
    const weekDays: (DailyPerformancePoint | null)[] = [];
    let monthLabel: string | null = null;

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setUTCDate(weekStart.getUTCDate() + i);
      const key = toKey(day);
      const point = map.get(key) ?? null;
      if (point && point.day <= 7 && i < 6) {
        monthLabel = day.toLocaleDateString(undefined, { month: "short" });
      }
      weekDays.push(point);
    }

    if (monthLabel) {
      const exists = monthLabels.find((label) => label.name === monthLabel);
      if (!exists) monthLabels.push({ name: monthLabel, index: weekIndex });
    }

    weeks.push({ index: weekIndex, days: weekDays });
    weekIndex += 1;
  }

  return { weeks, monthLabels };
}

function computeSummary(days: DailyPerformancePoint[]): HeatmapSummaryMetrics {
  const tradingDays = days.filter((d) => d.isTradingDay);
  if (tradingDays.length === 0) {
    return {
      bestDay: null,
      worstDay: null,
      avgDailyReturn: 0,
      positiveDays: 0,
      negativeDays: 0,
      winningPercentage: 0,
      longestWinningStreak: 0,
      longestLosingStreak: 0,
    };
  }

  const bestDay = [...tradingDays].sort((a, b) => b.portfolioReturn - a.portfolioReturn)[0];
  const worstDay = [...tradingDays].sort((a, b) => a.portfolioReturn - b.portfolioReturn)[0];
  const positiveDays = tradingDays.filter((d) => d.portfolioReturn > 0).length;
  const negativeDays = tradingDays.filter((d) => d.portfolioReturn < 0).length;
  const avgDailyReturn = tradingDays.reduce((sum, d) => sum + d.portfolioReturn, 0) / tradingDays.length;

  let longestWinningStreak = 0;
  let longestLosingStreak = 0;
  let winStreak = 0;
  let loseStreak = 0;

  tradingDays.forEach((day) => {
    if (day.portfolioReturn > 0) {
      winStreak += 1;
      loseStreak = 0;
      longestWinningStreak = Math.max(longestWinningStreak, winStreak);
    } else if (day.portfolioReturn < 0) {
      loseStreak += 1;
      winStreak = 0;
      longestLosingStreak = Math.max(longestLosingStreak, loseStreak);
    } else {
      winStreak = 0;
      loseStreak = 0;
    }
  });

  return {
    bestDay,
    worstDay,
    avgDailyReturn,
    positiveDays,
    negativeDays,
    winningPercentage: (positiveDays / tradingDays.length) * 100,
    longestWinningStreak,
    longestLosingStreak,
  };
}

function monthlySummary(days: DailyPerformancePoint[]) {
  const monthMap = new Map<number, DailyPerformancePoint[]>();
  days.filter((d) => d.isTradingDay).forEach((day) => {
    const list = monthMap.get(day.month) ?? [];
    list.push(day);
    monthMap.set(day.month, list);
  });

  return Array.from(monthMap.entries())
    .map(([month, values]) => {
      const avg = values.reduce((sum, v) => sum + v.portfolioReturn, 0) / values.length;
      const best = [...values].sort((a, b) => b.portfolioReturn - a.portfolioReturn)[0];
      const worst = [...values].sort((a, b) => a.portfolioReturn - b.portfolioReturn)[0];
      const winning = values.filter((v) => v.portfolioReturn > 0).length;
      const losing = values.filter((v) => v.portfolioReturn < 0).length;
      return {
        month,
        monthLabel: new Date(Date.UTC(values[0].year, month, 1)).toLocaleDateString(undefined, { month: "short" }),
        averageReturn: avg,
        best,
        worst,
        winning,
        losing,
      };
    })
    .sort((a, b) => a.month - b.month);
}

function getInsights(days: DailyPerformancePoint[], summary: HeatmapSummaryMetrics) {
  if (days.length === 0 || !summary.bestDay || !summary.worstDay) {
    return ["No insight data available for the current filter set."];
  }

  const months = monthlySummary(days);
  const bestMonth = [...months].sort((a, b) => b.averageReturn - a.averageReturn)[0];
  const volatileMonth = [...months].sort((a, b) => Math.abs(a.worst.portfolioReturn) - Math.abs(b.worst.portfolioReturn)).reverse()[0];

  const weekdayMap = new Map<number, { total: number; count: number }>();
  days.filter((d) => d.isTradingDay).forEach((day) => {
    const val = weekdayMap.get(day.weekday) ?? { total: 0, count: 0 };
    weekdayMap.set(day.weekday, { total: val.total + day.portfolioReturn, count: val.count + 1 });
  });
  const bestWeekday = Array.from(weekdayMap.entries())
    .map(([weekday, v]) => ({ weekday, avg: v.total / v.count }))
    .sort((a, b) => b.avg - a.avg)[0];

  const weekdayName = bestWeekday
    ? new Date(Date.UTC(2026, 0, 4 + bestWeekday.weekday)).toLocaleDateString(undefined, { weekday: "long" })
    : "Friday";

  const topAssetClass = days
    .filter((d) => d.isTradingDay && d.portfolioReturn > 0)
    .reduce<Record<string, number>>((acc, day) => {
      acc[day.assetClass] = (acc[day.assetClass] ?? 0) + 1;
      return acc;
    }, {});

  const bestAsset = Object.entries(topAssetClass).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Stocks";

  return [
    `${bestMonth.monthLabel} recorded the highest average monthly return (${bestMonth.averageReturn.toFixed(2)}%).`,
    `Your longest winning streak lasted ${summary.longestWinningStreak} trading days.`,
    `${weekdayName}s historically generated the highest returns in this timeframe.`,
    `${bestAsset}-heavy sessions produced above-average gains versus the benchmark.`,
    `${volatileMonth.monthLabel} was the most volatile month with deep downside spikes.`,
  ];
}

function HeatmapSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl border border-slate-900 bg-[#050711]/70" />
        ))}
      </div>
      <div className="h-52 rounded-2xl border border-slate-900 bg-[#050711]/70" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-900 bg-[#050711]/70" />
        ))}
      </div>
    </div>
  );
}

export default function PerformanceHeatmap() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [range, setRange] = useState<HeatmapRange>(365);
  const [asset, setAsset] = useState<HeatmapAssetFilter>("Entire Portfolio");
  const [hovered, setHovered] = useState<{ point: DailyPerformancePoint; x: number; y: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<DailyPerformancePoint | null>(null);
  const [loading, setLoading] = useState(false);

  const [yearlyData, setYearlyData] = useState<DailyPerformancePoint[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:3000/api/portfolio/heatmap?year=${year}`)
      .then(res => res.json())
      .then(data => {
        setYearlyData(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [year]);

  const filteredData = useMemo(() => {
    const now = new Date();
    const yearEnd = year === currentYear ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) : new Date(Date.UTC(year, 11, 31));
    const from = new Date(yearEnd);
    from.setUTCDate(from.getUTCDate() - (range - 1));

    return yearlyData
      .filter((point) => {
        const day = new Date(`${point.date}T00:00:00Z`);
        const inRange = day >= from && day <= yearEnd;
        const assetMatch = asset === "Entire Portfolio" ? true : point.assetClass === asset;
        return inRange && assetMatch;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [asset, currentYear, range, year, yearlyData]);

  const summary = useMemo(() => computeSummary(filteredData), [filteredData]);
  const { weeks, monthLabels } = useMemo(() => buildCalendar(filteredData), [filteredData]);
  const months = useMemo(() => monthlySummary(filteredData), [filteredData]);
  const insights = useMemo(() => getInsights(filteredData, summary), [filteredData, summary]);

  const noData = filteredData.length === 0;

  const changeYear = (delta: number) => {
    const next = year + delta;
    if (next > currentYear + 1) return;
    setLoading(true);
    setTimeout(() => {
      setYear(next);
      setLoading(false);
    }, 250);
  };

  return (
    <section className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 border-b border-slate-900 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Calendar size={15} className="text-blue-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Performance Heatmap</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Visualize your portfolio's daily performance over the last 365 days.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeYear(-1)}
            className="px-3 py-2 rounded-xl bg-[#050711] border border-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous Year
          </button>
          <button
            type="button"
            onClick={() => setYear(currentYear)}
            className="px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-wider text-blue-400"
          >
            Current Year
          </button>
          <button
            type="button"
            onClick={() => changeYear(1)}
            disabled={year >= currentYear + 1}
            className="px-3 py-2 rounded-xl bg-[#050711] border border-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Year <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <HeatmapFilters range={range} asset={asset} onRangeChange={setRange} onAssetChange={setAsset} />

      {loading ? (
        <HeatmapSkeleton />
      ) : noData ? (
        <div className="rounded-2xl border border-slate-900 bg-[#050711]/65 p-10 text-center">
          <p className="text-sm font-bold text-slate-300">No daily performance data available.</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 350);
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-600/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-400 hover:bg-blue-600/20 transition-colors"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      ) : (
        <>
          <HeatmapSummary metrics={summary} />

          <div className="relative" onMouseLeave={() => setHovered(null)}>
            <HeatmapCalendar
              weeks={weeks}
              monthLabels={monthLabels}
              onHover={(point, x, y) => setHovered({ point, x, y })}
              onLeave={() => setHovered(null)}
              onSelectDay={setSelectedDay}
            />

            <AnimatePresence>
              {hovered ? (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.12 }}>
                  <HeatmapTooltip point={hovered.point} x={hovered.x} y={hovered.y} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <HeatmapLegend className="mt-4" />

          <div className="mt-6">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Monthly Summary</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {months.map((month) => (
                <div key={month.monthLabel} className="rounded-2xl border border-slate-900 bg-[#050711]/70 p-4 text-xs">
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{month.monthLabel}</p>
                  <p className={month.averageReturn >= 0 ? "text-sm font-black text-emerald-400 mt-1.5" : "text-sm font-black text-rose-400 mt-1.5"}>
                    {month.averageReturn >= 0 ? "+" : ""}{month.averageReturn.toFixed(2)}%
                  </p>
                  <div className="mt-2.5 space-y-1 text-[10px] text-slate-400">
                    <p>Best: <span className="text-emerald-400 font-bold">{month.best.portfolioReturn >= 0 ? "+" : ""}{month.best.portfolioReturn.toFixed(2)}%</span></p>
                    <p>Worst: <span className="text-rose-400 font-bold">{month.worst.portfolioReturn.toFixed(2)}%</span></p>
                    <p>Winning Days: <span className="text-slate-200 font-semibold">{month.winning}</span></p>
                    <p>Losing Days: <span className="text-slate-200 font-semibold">{month.losing}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <HeatmapInsights insights={insights} />
        </>
      )}

      <HeatmapDayModal point={selectedDay} onClose={() => setSelectedDay(null)} />
    </section>
  );
}
