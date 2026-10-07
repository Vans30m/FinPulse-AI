import React from "react";

export const LoadingChart: React.FC<{ height: number }> = ({ height }) => {
  return (
    <div 
      className="relative w-full flex flex-col justify-between p-5 bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#242424] rounded-lg overflow-hidden animate-pulse select-none"
      style={{ height: `${height}px` }}
    >
      {/* 1. Header Skeleton */}
      <div className="flex justify-between items-center w-full">
        <div className="space-y-1.5">
          <div className="h-5 w-32 bg-slate-200 dark:bg-[#1C1C1C] rounded" />
          <div className="h-3 w-20 bg-slate-100 dark:bg-[#171717] rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-slate-200 dark:bg-[#1C1C1C] rounded" />
          <div className="h-8 w-20 bg-slate-200 dark:bg-[#1C1C1C] rounded" />
        </div>
      </div>

      {/* 2. Main Plot Grid lines skeleton */}
      <div className="absolute inset-x-5 top-20 bottom-16 flex flex-col justify-between pointer-events-none opacity-40">
        <div className="h-px w-full border-t border-dashed border-slate-200 dark:border-[#1A1A1A]" />
        <div className="h-px w-full border-t border-dashed border-slate-200 dark:border-[#1A1A1A]" />
        <div className="h-px w-full border-t border-dashed border-slate-200 dark:border-[#1A1A1A]" />
        <div className="h-px w-full border-t border-dashed border-slate-200 dark:border-[#1A1A1A]" />
      </div>

      {/* Center Spinner Loader overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 z-10">
        <div className="h-6 w-6 rounded-full border-2 border-slate-200 dark:border-[#242424] border-t-emerald-500 animate-spin" />
        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-neutral-500 tracking-wider bg-white dark:bg-[#111111] px-2.5 py-1 rounded border border-slate-200 dark:border-[#242424]">
          Syncing Live Terminal...
        </span>
      </div>

      {/* 3. Bottom Volume Bars Histogram Skeleton */}
      <div className="flex items-end justify-between gap-1 w-full h-10 opacity-30 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          const heightPct = [20, 40, 30, 60, 50, 70, 45, 30, 20, 55, 60, 80, 40, 30, 20, 45, 60, 75, 50, 40, 20, 35, 60, 50, 80, 70, 50, 30, 20, 40][i % 30];
          return (
            <div 
              key={i} 
              className="flex-1 bg-slate-200 dark:bg-[#1C1C1C] rounded-t"
              style={{ height: `${heightPct}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};