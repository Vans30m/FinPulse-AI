import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  title?: string;
  message?: string;
}

export default function PageLoader({
  title = "FinPulse AI Intelligence",
  message = "Syncing live market data..."
}: PageLoaderProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-28 px-4 text-center animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center p-8 rounded-3xl bg-white dark:bg-night-950 border border-slate-200/60 dark:border-white/5 shadow-xl max-w-sm w-full">
        {/* Glow backdrop indicator */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur opacity-10 dark:opacity-20 animate-pulse pointer-events-none" />

        <div className="relative flex items-center justify-center w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/10 dark:border-cyan-400/10" />
          <Loader2 className="h-10 w-10 text-blue-600 dark:text-cyan-400 animate-spin" />
        </div>
        
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
          {message}
        </p>
      </div>
    </div>
  );
}
