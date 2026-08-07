import { memo } from "react";
import type { DailyPerformancePoint } from "./types";

interface CalendarWeek {
  index: number;
  days: (DailyPerformancePoint | null)[];
}

interface MonthLabel {
  name: string;
  index: number;
}

interface Props {
  weeks: CalendarWeek[];
  monthLabels: MonthLabel[];
  onHover: (point: DailyPerformancePoint, clientX: number, clientY: number) => void;
  onLeave: () => void;
  onSelectDay: (point: DailyPerformancePoint) => void;
}

const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const visibleWeekLabels = ["Mon", "Wed", "Fri"];

function getCellClass(point: DailyPerformancePoint | null) {
  if (!point) return "bg-transparent border-transparent";
  if (!point.isTradingDay) return "bg-slate-700/35 border-slate-900/40";

  const r = point.portfolioReturn;
  if (r >= 1.6) return "bg-emerald-500/90 border-emerald-400/35";
  if (r > 0.05) return "bg-emerald-500/45 border-emerald-500/20";
  if (r <= -1.6) return "bg-rose-600/90 border-rose-400/40";
  if (r < -0.05) return "bg-rose-500/45 border-rose-500/20";
  return "bg-slate-600/60 border-slate-500/25";
}

function HeatmapCalendar({ weeks, monthLabels, onHover, onLeave, onSelectDay }: Props) {
  return (
    <div className="relative rounded-2xl border border-slate-900 bg-[#050711]/55 p-4 overflow-x-auto">
      <div className="min-w-[940px]">
        <div className="pl-10 grid gap-1 mb-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
          {monthLabels.map((month) => (
            <span
              key={`${month.name}-${month.index}`}
              className="text-[10px] text-slate-500 font-bold uppercase tracking-wider"
              style={{ gridColumnStart: month.index + 1 }}
            >
              {month.name}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="w-8 pt-1.5">
            {weekLabels.map((label) => (
              <div key={label} className="h-4 mb-1 text-[9px] text-slate-500 font-semibold flex items-center">
                {visibleWeekLabels.includes(label) ? label : ""}
              </div>
            ))}
          </div>

          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
            {weeks.map((week) => (
              <div key={week.index} className="grid gap-1">
                {week.days.map((point, idx) => (
                  <button
                    key={`${week.index}-${idx}-${point?.date ?? "empty"}`}
                    type="button"
                    onMouseEnter={(event) => {
                      if (point) onHover(point, event.clientX, event.clientY);
                    }}
                    onMouseMove={(event) => {
                      if (point) onHover(point, event.clientX, event.clientY);
                    }}
                    onMouseLeave={onLeave}
                    onClick={() => {
                      if (point) onSelectDay(point);
                    }}
                    className={`h-3.5 w-3.5 rounded-sm border transition-all duration-150 hover:scale-110 hover:ring-1 hover:ring-blue-400/50 ${getCellClass(point)}`}
                    aria-label={point ? `${point.date} ${point.portfolioReturn}%` : "Empty day"}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(HeatmapCalendar);
