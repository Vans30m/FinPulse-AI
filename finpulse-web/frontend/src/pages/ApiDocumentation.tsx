import { ArrowRight, Code2 } from "lucide-react";

export default function ApiDocumentation() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-8 dark:border-cyan-500/20 dark:bg-cyan-500/5">
        <div className="flex items-center gap-3">
          <Code2 className="h-7 w-7 text-blue-600 dark:text-cyan-400" />
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">API Documentation</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Build integrations with FinPulse market data and portfolio services.</p>
          </div>
        </div>
      </div>
      <div className="glass-panel space-y-5 p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Developer access</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">API access is currently available for approved integrations. Contact support to request credentials, rate limits, and endpoint details.</p>
        </div>
        <a href="mailto:afinpulseai@gmail.com" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-500 dark:text-cyan-400">Request access <ArrowRight className="h-4 w-4" /></a>
      </div>
    </div>
  );
}
