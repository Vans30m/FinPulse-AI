import React from "react";
import type { FundamentalData, DailyMarketMetrics } from "../../services/marketService";

interface PriceInfoBarProps {
  hoveredData: any | null;
  fundamentals: FundamentalData | null;
  metrics: DailyMarketMetrics | null;
  compareSymbol?: string;
  hoveredCompareCandle?: any | null;
  compareCandles?: any[];
}

export const PriceInfoBar: React.FC<PriceInfoBarProps> = ({
  hoveredData,
  fundamentals,
  metrics,
  compareSymbol,
  hoveredCompareCandle,
  compareCandles,
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

  const formatPrice = (val: number | null | undefined) => {
    if (val == null || isNaN(val)) return "N/A";
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVolume = (val: number | null | undefined) => {
    if (val == null || isNaN(val)) return "N/A";
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toLocaleString();
  };

  // Compare calculations
  const latestCompare = compareCandles && compareCandles.length > 0 ? compareCandles[compareCandles.length - 1] : null;
  const compOpen = hoveredCompareCandle ? hoveredCompareCandle.open : latestCompare?.open;
  const compHigh = hoveredCompareCandle ? hoveredCompareCandle.high : latestCompare?.high;
  const compLow = hoveredCompareCandle ? hoveredCompareCandle.low : latestCompare?.low;
  const compClose = hoveredCompareCandle ? hoveredCompareCandle.close : latestCompare?.close;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* Row 1: Main Asset Details */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 py-2 px-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-white/5 font-mono text-xs">
        <span className="font-extrabold text-blue-500 uppercase">{fundamentals.symbol || "MAIN"}</span>
        
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

      {/* Row 2: Compared Asset Details */}
      {compareSymbol && latestCompare && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 py-2 px-3 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-200/40 dark:border-blue-500/20 font-mono text-xs animate-in slide-in-from-top-1 duration-150">
          <span className="font-extrabold text-blue-500 uppercase">{compareSymbol} (COMPARED)</span>
          
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-400 dark:text-slate-500 select-none">O:</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-300">{compOpen != null ? formatPrice(compOpen) : "N/A"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-400 dark:text-slate-500 select-none">H:</span>
            <span className="font-extrabold text-blue-500">{compHigh != null ? formatPrice(compHigh) : "N/A"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-400 dark:text-slate-500 select-none">L:</span>
            <span className="font-extrabold text-white">{compLow != null ? formatPrice(compLow) : "N/A"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-400 dark:text-slate-500 select-none">C:</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-300">{compClose != null ? formatPrice(compClose) : "N/A"}</span>
          </div>
        </div>
      )}
    </div>
  );
};