import { AlertTriangle, Scale } from "lucide-react";

export default function RiskDisclosure() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-8 dark:bg-amber-500/10"><div className="flex items-center gap-3"><AlertTriangle className="h-7 w-7 text-amber-500" /><div><h1 className="text-3xl font-black text-slate-900 dark:text-white">Risk Disclosure</h1><p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Please read before making decisions</p></div></div></div>
      <div className="glass-panel space-y-4 p-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><Scale className="h-5 w-5 text-amber-500" />Educational information only</h2><p>FinPulse provides computational market data, charts, sentiment summaries, and portfolio tracking tools for informational and educational use. Nothing on this platform is investment, tax, or legal advice.</p><p>Markets can be volatile and you may lose some or all of your invested capital. Verify information independently and consult a qualified, registered adviser before acting on financial information.</p></div>
    </div>
  );
}
