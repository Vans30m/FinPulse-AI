import React from "react";

export const LoadingChart: React.FC<{ height: number }> = ({ height }) => {
  return (
    <div 
      className="w-full flex flex-col items-center justify-center space-y-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 animate-pulse"
      style={{ height: `${height}px` }}
    >
      <div className="h-7 w-7 rounded-full border-4 border-slate-300 dark:border-slate-700 border-t-slate-800 dark:border-t-white animate-spin" />
      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider font-mono">
        SYNCING REALTIME PIPELINE...
      </span>
    </div>
  );
};