import React from "react";
import type { FundamentalData, DailyMarketMetrics } from "../../services/marketService";

interface PriceInfoBarProps {
  hoveredData: any | null;
  fundamentals: FundamentalData | null;
  metrics: DailyMarketMetrics | null;
  compareSymbol?: string;
  hoveredCompareCandle?: any | null;
  compareCandles?: any[];
  compareFundamentals?: FundamentalData | null;
}

export const PriceInfoBar: React.FC<PriceInfoBarProps> = ({
  hoveredData,
  fundamentals,
  metrics,
  compareSymbol,
  hoveredCompareCandle,
  compareCandles,
  compareFundamentals,
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

  const rawDayHigh = metrics.dayHigh || activePrice;
  const rawDayLow = metrics.dayLow || activePrice;
  const dynamicDayHigh = activePrice > rawDayHigh ? activePrice : rawDayHigh;
  const dynamicDayLow = (activePrice > 0 && activePrice < rawDayLow) ? activePrice : rawDayLow;

  const activeHigh = hoveredData ? hoveredData.high : dynamicDayHigh;
  const activeLow = hoveredData ? hoveredData.low : dynamicDayLow;
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

  // TradingView-style Candle Change & Percentage
  // When hovering a candle, calculate change relative to that candle's open (or previous close if preferred).
  // In TradingView bar header: Change = Close - Open, % = ((Close - Open) / Open) * 100
  // When not hovering, fallback to daily change from fundamentals/metrics.
  const candleChange = hoveredData
    ? (hoveredData.close != null && hoveredData.open != null ? hoveredData.close - hoveredData.open : 0)
    : (fundamentals.change ?? ((activePrice != null && metrics.previousClose) ? activePrice - metrics.previousClose : 0));

  const candleChangePercent = hoveredData
    ? (hoveredData.open && hoveredData.open !== 0 ? ((hoveredData.close - hoveredData.open) / hoveredData.open) * 100 : 0)
    : (fundamentals.changePercent ?? ((metrics.previousClose && metrics.previousClose !== 0 && activePrice != null) ? ((activePrice - metrics.previousClose) / metrics.previousClose) * 100 : 0));

  const isPositive = candleChange >= 0;
  const changeSign = isPositive ? "+" : "";

  // Compare candle change
  const compChange = (compClose != null && compOpen != null) ? compClose - compOpen : 0;
  const compChangePercent = (compOpen && compOpen !== 0 && compClose != null) ? ((compClose - compOpen) / compOpen) * 100 : 0;
  const isCompPositive = compChange >= 0;
  const compChangeSign = isCompPositive ? "+" : "";

  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* Row 1: Main Asset Details */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-2 py-2 px-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-white/5 font-mono text-[10px] sm:text-xs">
        <span className="font-extrabold text-blue-500 uppercase col-span-3 sm:col-span-4 md:col-span-auto md:mr-2 truncate">
          {fundamentals.name || fundamentals.symbol || "Asset"}
        </span>
        
        <div className="flex items-center gap-1">
          <span className="font-bold text-slate-400 dark:text-slate-505 select-none">O:</span>
          <span className="font-extrabold text-slate-700 dark:text-slate-300">{formatPrice(activeOpen)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-slate-400 dark:text-slate-505 select-none">H:</span>
          <span className="font-extrabold text-emerald-500">{formatPrice(activeHigh)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-slate-400 dark:text-slate-505 select-none">L:</span>
          <span className="font-extrabold text-rose-500">{formatPrice(activeLow)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-slate-400 dark:text-slate-505 select-none">C:</span>
          <span className="font-extrabold text-slate-700 dark:text-slate-300">{formatPrice(activePrice)}</span>
        </div>

        {/* TradingView-Style Candle Change & % Badge */}
        <div className="flex items-center gap-1.5 md:border-l md:border-slate-200 md:dark:border-white/10 md:pl-2.5">
          <span className={`font-black ${isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
            {changeSign}{formatPrice(candleChange)}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
          }`}>
            {changeSign}{candleChangePercent.toFixed(2)}%
          </span>
        </div>

        {/* Volume metrics */}
        <div className="flex items-center gap-1 md:border-l md:border-slate-200 md:dark:border-white/10 md:pl-2.5">
          <span className="font-bold text-slate-400 dark:text-slate-505 select-none">V:</span>
          <span className="font-extrabold text-slate-700 dark:text-slate-300">{formatVolume(activeVolume)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-slate-400 dark:text-slate-505 select-none">Avg V:</span>
          <span className="font-extrabold text-slate-550 dark:text-slate-400">{formatVolume(metrics.avgVolume)}</span>
        </div>

        {/* Session reference anchors */}
        <div className="contents md:flex md:flex-wrap md:items-center gap-x-2.5 sm:gap-x-3 gap-y-1 md:border-l md:border-slate-200 md:dark:border-white/10 md:pl-2.5">
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-400 dark:text-slate-505 select-none">
              Prev <span className="hidden md:inline">Close</span>:
            </span>
            <span className="font-extrabold text-slate-550 dark:text-slate-400">{formatPrice(metrics.previousClose)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-400 dark:text-slate-505 select-none">Day H:</span>
            <span className="font-extrabold text-emerald-500/80">{formatPrice(dynamicDayHigh)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-400 dark:text-slate-505 select-none">Day L:</span>
            <span className="font-extrabold text-rose-500/80">{formatPrice(dynamicDayLow)}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Compared Asset Details */}
      {compareSymbol && latestCompare && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-2 py-2 px-3 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-200/40 dark:border-blue-500/20 font-mono text-[10px] sm:text-xs animate-in slide-in-from-top-1 duration-150">
          <span className="font-extrabold text-blue-500 uppercase col-span-3 sm:col-span-4 md:col-span-auto md:mr-2 truncate">
            {compareFundamentals?.name || compareSymbol}
          </span>
          
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-400 dark:text-slate-550 select-none">O:</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-300">{compOpen != null ? formatPrice(compOpen) : "N/A"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-400 dark:text-slate-550 select-none">H:</span>
            <span className="font-extrabold text-emerald-500">{compHigh != null ? formatPrice(compHigh) : "N/A"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-400 dark:text-slate-550 select-none">L:</span>
            <span className="font-extrabold text-rose-500">{compLow != null ? formatPrice(compLow) : "N/A"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-400 dark:text-slate-550 select-none">C:</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-300">{compClose != null ? formatPrice(compClose) : "N/A"}</span>
          </div>

          {/* Compared Asset Candle Change & % Badge */}
          <div className="flex items-center gap-1.5 md:border-l md:border-blue-200/20 md:pl-2.5">
            <span className={`font-black ${isCompPositive ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
              {compChangeSign}{formatPrice(compChange)}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black ${
              isCompPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
            }`}>
              {compChangeSign}{compChangePercent.toFixed(2)}%
            </span>
          </div>

          {/* Session reference anchors for compared asset */}
          <div className="contents md:flex md:flex-wrap md:items-center gap-x-2.5 sm:gap-x-3 gap-y-1 md:border-l md:border-blue-200/20 md:pl-2.5">
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-400 dark:text-slate-550 select-none">
                Prev <span className="hidden md:inline">Close</span>:
              </span>
              <span className="font-extrabold text-slate-550 dark:text-slate-400">{formatPrice(compareFundamentals?.previousClose)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-400 dark:text-slate-550 select-none">Day H:</span>
              <span className="font-extrabold text-emerald-500/80">{formatPrice(compareFundamentals?.dayHigh)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-400 dark:text-slate-550 select-none">Day L:</span>
              <span className="font-extrabold text-rose-500/80">{formatPrice(compareFundamentals?.dayLow)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};