import React from "react";

export const LoadingChart: React.FC<{ height: number }> = ({ height }) => {
  return (
    <div 
      className="relative w-full flex flex-col justify-between p-6 bg-slate-50 dark:bg-night-900 border border-slate-200 dark:border-night-800 rounded-2xl overflow-hidden animate-pulse select-none"
      style={{ height: `${height}px` }}
    >
      {/* 1. Header Skeleton */}
      <div className="flex justify-between items-center w-full">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* 2. Main Plot Grid lines skeleton */}
      <div className="absolute inset-x-6 top-24 bottom-20 flex flex-col justify-between pointer-events-none opacity-50">
        <div className="h-px w-full border-t border-dashed border-slate-200 dark:border-slate-800" />
        <div className="h-px w-full border-t border-dashed border-slate-200 dark:border-slate-800" />
        <div className="h-px w-full border-t border-dashed border-slate-200 dark:border-slate-800" />
        <div className="h-px w-full border-t border-dashed border-slate-200 dark:border-slate-800" />
      </div>

      {/* Pulsing Wavy SVG Path Chart Mockup */}
      <div className="absolute inset-x-6 top-28 bottom-24 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-30">
        <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
          <path
            d="M0,150 Q100,50 200,120 T400,60 T600,100"
            fill="none"
            stroke="url(#skeleton-gradient)"
            strokeWidth="4"
          />
          <defs>
            <linearGradient id="skeleton-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Center Spinner Loader overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10">
        <div className="h-7 w-7 rounded-full border-4 border-slate-200 dark:border-slate-850 border-t-blue-500 dark:border-t-cyan-400 animate-spin" />
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest font-mono uppercase bg-white dark:bg-night-950 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-800 shadow-sm">
          Syncing Live Pipeline...
        </span>
      </div>

      {/* 3. Bottom Volume Bars Histogram Skeleton */}
      <div className="flex items-end justify-between gap-1 w-full h-12 opacity-40 dark:opacity-30 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          const heightPct = [20, 40, 30, 60, 50, 70, 45, 30, 20, 55, 60, 80, 40, 30, 20, 45, 60, 75, 50, 40, 20, 35, 60, 50, 80, 70, 50, 30, 20, 40][i % 30];
          return (
            <div 
              key={i} 
              className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t"
              style={{ height: `${heightPct}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};