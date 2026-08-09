import { Calendar } from "lucide-react";

interface EarningsEvent {
  symbol: string;
  date: string;
}

interface Props {
  earnings: EarningsEvent[];
}

export default function EarningsCalendarCard({
  earnings,
}: Props) {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Calendar className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Upcoming Earnings
        </h2>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {earnings.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group"
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[70px] text-center uppercase tracking-wider group-hover:border-blue-500/20 dark:group-hover:border-cyan-500/20 transition-all">
                {item.symbol}
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {item.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}