import type { HeatmapAssetFilter, HeatmapRange } from "./types";

interface Props {
  range: HeatmapRange;
  asset: HeatmapAssetFilter;
  onRangeChange: (range: HeatmapRange) => void;
  onAssetChange: (asset: HeatmapAssetFilter) => void;
}

const rangeOptions: HeatmapRange[] = [365, 180, 90, 30];
const assetOptions: HeatmapAssetFilter[] = [
  "Entire Portfolio",
  "Stocks",
  "ETFs",
  "Mutual Funds",
  "Crypto",
  "International",
  "Domestic",
];

export default function HeatmapFilters({ range, asset, onRangeChange, onAssetChange }: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
      <div className="space-y-2">
        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Time Range</span>
        <div className="flex bg-[#050711] p-1 rounded-xl border border-slate-900 w-fit">
          {rangeOptions.map((option) => (
            <button
              key={option}
              onClick={() => onRangeChange(option)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                range === option
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {option} Days
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 md:text-right">
        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Asset Filter</span>
        <div className="flex flex-wrap gap-1.5 md:justify-end">
          {assetOptions.map((option) => (
            <button
              key={option}
              onClick={() => onAssetChange(option)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                asset === option
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-inner"
                  : "bg-[#050711]/40 text-slate-400 border-slate-900/60 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
