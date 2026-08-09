interface Props {
  score: number;
  diversification: string;
  risk: string;
  growth: string;
}

export default function PortfolioHealthCard({
  score,
  diversification,
  risk,
  growth,
}: Props) {
  const getScoreColor = (val: number) => {
    if (val >= 80) return "text-emerald-500 dark:text-emerald-400";
    if (val >= 50) return "text-amber-500 dark:text-amber-400";
    return "text-rose-500 dark:text-rose-400";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnostics Summary</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">Overall Health Profile</h3>
        </div>
        <div className="flex items-baseline gap-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-3 py-1.5 rounded-xl">
          <span className={`text-2xl font-black ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-[10px] font-bold text-slate-405 uppercase">/100</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800/40 pb-3">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Asset Diversification</span>
          <span className="font-bold text-slate-850 dark:text-slate-200">{diversification}</span>
        </div>

        <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800/40 pb-3">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Risk Profile</span>
          <span className="font-bold text-slate-850 dark:text-slate-200">{risk}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Growth Potential</span>
          <span className="font-bold text-slate-850 dark:text-slate-200">{growth}</span>
        </div>
      </div>
    </div>
  );
}