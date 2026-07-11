import { Zap, HelpCircle } from "lucide-react";

interface UsageMetric {
  used: number;
  limit: number;
}

interface SubscriptionCardProps {
  currentPlan?: string;
  renewalDate?: string;
  features?: string[];
  aiUsage?: UsageMetric;
  apiUsage?: UsageMetric;
  storageUsage?: UsageMetric;
  onUpgrade?: () => void;
  onRenew?: () => void;
}

export default function SubscriptionCard({
  currentPlan = "Pro Tier",
  renewalDate = "July 24, 2026",
  features = [
    "Unlimited AI Chat Recommendations",
    "Real-time Technical Indicator Calculations",
    "Advanced Multilateral Portfolio Diagnostic Charts",
    "Custom Screener Saves & Dynamic Notifications"
  ],
  aiUsage = { used: 342, limit: 1000 },
  apiUsage = { used: 1240, limit: 5000 },
  storageUsage = { used: 8, limit: 50 },
  onUpgrade,
  onRenew
}: SubscriptionCardProps) {
  
  const renderProgressBar = (used: number, limit: number) => {
    const percent = Math.min((used / limit) * 100, 100);
    return (
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
          <span>{used.toLocaleString()} used</span>
          <span>{limit.toLocaleString()} limit ({percent.toFixed(0)}%)</span>
        </div>
      </div>
    );
  };

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
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider">{currentPlan}</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Renewal Scheduled: {renewalDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRenew && (
            <button
              onClick={onRenew}
              className="px-4 py-2.5 rounded-xl border border-slate-250 dark:border-white/10 text-slate-700 dark:text-slate-350 hover:bg-slate-55/50 dark:hover:bg-white/5 text-xs font-black uppercase transition-all"
            >
              Renew
            </button>
          )}
          <button
            onClick={onUpgrade}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase hover:shadow-lg hover:shadow-blue-500/20 transition-all"
          >
            Upgrade Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Features list */}
        <div className="space-y-4">
          <div className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            Plan Features Included
          </div>
          <ul className="space-y-2.5">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-650 dark:text-slate-400">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Usage meters */}
        <div className="space-y-4">
          <div className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            AI & Resource Usage
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-350">
                <span className="flex items-center gap-1.5">
                  AI Recommendation Queries
                </span>
              </div>
              {renderProgressBar(aiUsage.used, aiUsage.limit)}
            </div>

            <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-350">
                <span>API Calls / Calculations</span>
              </div>
              {renderProgressBar(apiUsage.used, apiUsage.limit)}
            </div>

            <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-350">
                <span>Storage / Watchlists & Portfolios</span>
              </div>
              {renderProgressBar(storageUsage.used, storageUsage.limit)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
