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
    <div className="w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center bg-[#0D0D0D] p-1 rounded-md border border-[#242424]">
      <div className="flex items-center gap-1 min-w-max">
        {TIMEFRAMES.map((tf) => {
          const isActive = selected === tf;
          return (
            <button
              key={tf}
              type="button"
              onClick={() => onChange(tf)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all duration-150 ${isActive
                ? "bg-[#1C1C1C] text-[#F5F5F5] border border-[#2A2A2A]"
                : "bg-[#141414] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#1C1C1C] border border-transparent"
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