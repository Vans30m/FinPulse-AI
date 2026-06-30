import React from "react";
import type { FundamentalData, DailyMarketMetrics } from "../../services/marketService";

interface PriceInfoBarProps {
  hoveredData: any | null;
  fundamentals: FundamentalData | null;
  metrics: DailyMarketMetrics | null;
}

export const PriceInfoBar: React.FC<PriceInfoBarProps> = ({
  hoveredData,
  fundamentals,
  metrics,
}) => {
  if (!fundamentals || !metrics) {
    return (
      <div className="flex items-center justify-center py-2 px-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-white/5 font-mono text-xs mb-4 text-slate-400">
        Syncing live market data feed...
      </div>
    );
  }

  // Crosshair override state vs. overall daily fundamentals snapshot
  const activePrice = hoveredData ? hoveredData.close : fundamentals.price;
  const activeOpen = hoveredData ? hoveredData.open : (fundamentals.open ?? metrics.previousClose);
  const activeHigh = hoveredData ? hoveredData.high : metrics.dayHigh;
  const activeLow = hoveredData ? hoveredData.low : metrics.dayLow;
  const activeVolume = hoveredData ? hoveredData.volume : metrics.currentVolume;

  const formatPrice = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVolume = (val: number) => {
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toLocaleString();
  };

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 py-2 px-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-white/5 font-mono text-xs mb-4">
      {/* OHLC Fields */}
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-400 dark:text-slate-500 select-none">O:</span>
        <span className="font-extrabold text-slate-700 dark:text-slate-300">{formatPrice(activeOpen)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-400 dark:text-slate-500 select-none">H:</span>
        <span className="font-extrabold text-emerald-500">{formatPrice(activeHigh)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-400 dark:text-slate-500 select-none">L:</span>
        <span className="font-extrabold text-rose-500">{formatPrice(activeLow)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-400 dark:text-slate-500 select-none">C:</span>
        <span className="font-extrabold text-slate-700 dark:text-slate-300">{formatPrice(activePrice)}</span>
      </div>

      {/* Volume metrics */}
      <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-4">
        <span className="font-bold text-slate-400 dark:text-slate-500 select-none">V:</span>
        <span className="font-extrabold text-slate-700 dark:text-slate-300">{formatVolume(activeVolume)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-400 dark:text-slate-500 select-none">Avg V:</span>
        <span className="font-extrabold text-slate-500 dark:text-slate-400">{formatVolume(metrics.avgVolume)}</span>
      </div>

      {/* Session reference anchors */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-l border-slate-200 dark:border-white/10 pl-4 ml-auto">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-400 dark:text-slate-500 select-none">Prev Close:</span>
          <span className="font-extrabold text-slate-500 dark:text-slate-400">{formatPrice(metrics.previousClose)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-400 dark:text-slate-500 select-none">Day H:</span>
          <span className="font-extrabold text-emerald-500/80">{formatPrice(metrics.dayHigh)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-400 dark:text-slate-500 select-none">Day L:</span>
          <span className="font-extrabold text-rose-500/80">{formatPrice(metrics.dayLow)}</span>
        </div>
      </div>
    </div>
  );
};