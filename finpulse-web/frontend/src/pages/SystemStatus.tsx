import { Activity, CheckCircle2 } from "lucide-react";

export default function SystemStatus() {
  const services = ["Web application", "Market data feeds", "Portfolio services", "AI insights"];

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-8 dark:border-cyan-500/20 dark:bg-cyan-500/5">
        <div className="flex items-center gap-3">
          <Activity className="h-7 w-7 text-blue-600 dark:text-cyan-400" />
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">System Status</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">FinPulse services</p>
          </div>
        </div>
      </div>
      <div className="glass-panel space-y-4 p-6">
        {services.map((service) => (
          <div key={service} className="flex items-center justify-between border-b border-slate-200 pb-4 last:border-0 last:pb-0 dark:border-[#242424]">
            <span className="text-sm font-bold text-slate-800 dark:text-white">{service}</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Operational</span>
          </div>
        ))}
      </div>
    </div>
  );
}
