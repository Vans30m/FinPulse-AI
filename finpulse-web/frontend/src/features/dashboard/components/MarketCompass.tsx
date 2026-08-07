import React from "react";
import { Compass, Shield, Target, Award, Info } from "lucide-react";

export default function MarketCompass() {
  const sentimentZones = [
    { label: "Extreme Fear", range: "0-24", color: "bg-red-500" },
    { label: "Fear", range: "25-44", color: "bg-orange-500" },
    { label: "Neutral", range: "45-54", color: "bg-amber-500" },
    { label: "Greed", range: "55-74", color: "bg-emerald-500" },
    { label: "Extreme Greed", range: "75-100", color: "bg-teal-500" },
  ];

  return (
    <div className="w-full glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-white/[0.01] backdrop-blur-md shadow-lg flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 border border-blue-100/50 dark:border-cyan-400/10">
          <Compass className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Market Compass
          </h3>
          <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-0.5">
            Static reference guide for market cycles and investor psychology.
          </p>
        </div>
      </div>

      {/* Sentiment Spectrum bar */}
      <div className="space-y-2.5 mb-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
          <span>Sentiment Spectrum</span>
          <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Reference Guide</span>
        </div>
        
        {/* Color bar */}
        <div className="flex h-2 w-full rounded-full overflow-hidden">
          <div className="h-full w-[25%] bg-red-500" />
          <div className="h-full w-[20%] bg-orange-500" />
          <div className="h-full w-[10%] bg-amber-500" />
          <div className="h-full w-[20%] bg-emerald-500" />
          <div className="h-full w-[25%] bg-teal-500" />
        </div>
        
        {/* Labels under the bar */}
        <div className="grid grid-cols-5 gap-1 text-[9px] font-bold text-center text-slate-400 dark:text-slate-500">
          <div>Fear</div>
          <div>Caution</div>
          <div>Neutral</div>
          <div>Greed</div>
          <div>Euphoria</div>
        </div>
      </div>

      {/* Strategic pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 mb-1">
            <Shield className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider">Capital Guard</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-655 dark:text-slate-400 font-semibold">
            Preserve core assets in high-risk volatility cycles; allocate cash to dips.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <Target className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider">Asset Allocation</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-655 dark:text-slate-400 font-semibold">
            Rebalance regularly; diversify across uncorrelated sectors and commodities.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-450 mb-1">
            <Award className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider">Cycle Trading</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-655 dark:text-slate-400 font-semibold">
            Accumulate slowly in Extreme Fear zones; take profits during Greed peaks.
          </p>
        </div>
      </div>
    </div>
  );
}
