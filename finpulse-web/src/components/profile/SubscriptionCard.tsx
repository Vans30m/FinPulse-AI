import { Zap } from "lucide-react";

interface SubscriptionCardProps {
  renewalDate?: string;
  onUpgrade?: () => void;
}

export default function SubscriptionCard({
  renewalDate = "July 24, 2026",
  onUpgrade
}: SubscriptionCardProps) {
  
  const apis = [
    { name: "Yahoo Finance API", status: "Operational", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { name: "Finnhub News API", status: "Operational", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { name: "Alpha Vantage Technicals", status: "Operational", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-md shadow-indigo-500/20">
            <Zap className="h-5 w-5 fill-white/10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Active Subscription</h3>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider">pro tier</span>
            </div>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Renewal Scheduled: {renewalDate}</p>
          </div>
        </div>

        <button
          onClick={onUpgrade}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase hover:shadow-lg hover:shadow-blue-500/20 transition-all"
        >
          Upgrade Plan
        </button>
      </div>

      <div className="space-y-4">
        <div className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Connected API Feed Health
        </div>
        
        <div className="grid gap-3">
          {apis.map((api, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{api.name}</span>
              <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${api.color}`}>
                {api.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
