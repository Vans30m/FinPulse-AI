import { CheckCircle2 } from "lucide-react";

interface Props {
  insights: string[];
}

export default function PortfolioInsightsCard({
  insights,
}: Props) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnostics Summary</span>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">Algorithmic Signals</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-4 hover:border-slate-200 dark:hover:border-white/10 transition-colors"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-750 dark:text-slate-300 leading-relaxed font-medium">
              {insight}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}