import React from "react";
import { Compass, Shield, Target, Award, Info, Brain } from "lucide-react";

export default function MarketCompass() {
  const sentimentZones = [
    {
      label: "Extreme Fear",
      range: "0-24",
      color: "bg-red-500",
      textColor: "text-red-500",
      description: "High panic. Max opportunity; deep discount values."
    },
    {
      label: "Fear",
      range: "25-44",
      color: "bg-orange-500",
      textColor: "text-orange-500",
      description: "Caution. Investors scale into defensive assets."
    },
    {
      label: "Neutral",
      range: "45-54",
      color: "bg-amber-500",
      textColor: "text-amber-500",
      description: "Consolidation. Range-bound trading dominates."
    },
    {
      label: "Greed",
      range: "55-74",
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
      description: "Momentum. Growth rallies; tighten stop-losses."
    },
    {
      label: "Euphoria",
      range: "75-100",
      color: "bg-teal-500",
      textColor: "text-teal-500",
      description: "Extreme greed. Overvalued; scale out / hedge."
    },
  ];

  return (
    <div className="w-full h-full bg-white/70 dark:bg-white/[0.02] p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] shadow-sm flex flex-col gap-5">

      {/* Top Header Controls (Fear & Greed Style) */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-xs sm:text-sm cool-heading uppercase">
              Sentiment Spectrum & Market Compass
            </h3>
            <p className="text-[10px] text-slate-550 dark:text-slate-455 mt-0.5">
              Reference guide for market cycles, psychological zone guides, and investment strategy.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">

        {/* Sentiment Spectrum bar */}
        <div className="space-y-2.5 mb-3">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
            <span>Sentiment Spectrum</span>
            <span className="flex items-center gap-1">Reference Guide</span>
          </div>

          {/* Color bar */}
          <div className="flex h-2 w-full rounded-full overflow-hidden">
            <div className="h-full w-[25%] bg-rose-500" />
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

        {/* Detailed Psychology Grid to Fill Vertical Space */}
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2.5">
            Psychology Zone Guide
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {sentimentZones.map((zone, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-550/20 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/10 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${zone.color}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${zone.textColor}`}>
                      {zone.label}
                    </span>
                  </div>
                  <p className="text-[9px] leading-relaxed text-slate-550 dark:text-slate-400 font-medium">
                    {zone.description}
                  </p>
                </div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-2 block border-t border-slate-200/60 dark:border-white/5 pt-1.5">
                  Score: {zone.range}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic pillars at the bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200/60 dark:border-white/10 pt-4">
        <div className="p-3 rounded-xl bg-slate-550/20 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-cyan-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Capital Guard</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            Preserve core assets in high-risk volatility cycles; allocate cash to dips.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-550/20 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Asset Allocation</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            Rebalance regularly; diversify across uncorrelated sectors and commodities.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-550/20 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Cycle Trading</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            Accumulate slowly in Extreme Fear zones; take profits during Greed peaks.
          </p>
        </div>
      </div>

    </div>
  );
}
