import { memo } from "react";

interface TimeframeSelectorProps {
  selected: string;
  onChange: (timeframe: string) => void;
}

export const TIMEFRAMES = [
  "1m", "5m", "15m", "30m", "1h", "4h", "1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "3Y", "5Y", "MAX"
];

function TimeframeSelector({ selected, onChange }: TimeframeSelectorProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center bg-slate-100/80 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/40 dark:border-white/5">
      <div className="flex items-center gap-1 min-w-max">
        {TIMEFRAMES.map((tf) => {
          const isActive = selected === tf;
          return (
            <button
              key={tf}
              type="button"
              onClick={() => onChange(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wide font-mono transition-all duration-150 ${isActive
                ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm scale-[1.02]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/[0.02]"
                }`}
            >
              {tf}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TimeframeSelector);