import { Star, AlertCircle } from "lucide-react";

interface Props {
  insight: string;
  recommendation: string;
  score: number;
  topSector: string;
}

export default function AISectorAnalysisCard({
  insight,
  recommendation,
  score,
  topSector,
}: Props) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnostics Summary</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">Sector Allocation Analysis</h3>
        </div>
        <div className="flex items-baseline gap-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-3 py-1.5 rounded-xl">
          <span className="text-2xl font-black text-cyan-500">
            {score}
          </span>
          <span className="text-[10px] font-bold text-slate-405 uppercase">/100</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-405 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-3 rounded-2xl">
        <Star className="h-4 w-4 text-cyan-500" />
        <span>Top Sector Concentration: <strong className="text-slate-805 dark:text-slate-200">{topSector}</strong></span>
      </div>

      <p className="text-sm text-slate-655 dark:text-slate-300 leading-relaxed">
        {insight}
      </p>

      <div className="rounded-2xl bg-cyan-500/[0.03] border border-cyan-500/10 p-4 space-y-1">
        <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          Recommendation
        </div>
        <p className="text-sm text-slate-750 dark:text-slate-350 leading-relaxed font-semibold">
          {recommendation}
        </p>
      </div>
    </div>
  );
}