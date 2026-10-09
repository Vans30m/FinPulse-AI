import { Cookie, ShieldCheck } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-8 dark:border-cyan-500/20 dark:bg-cyan-500/5">
        <div className="flex items-center gap-3"><Cookie className="h-7 w-7 text-blue-600 dark:text-cyan-400" /><div><h1 className="text-3xl font-black text-slate-900 dark:text-white">Cookie Policy</h1><p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Last updated: October 2026</p></div></div>
      </div>
      <div className="glass-panel space-y-4 p-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><ShieldCheck className="h-5 w-5 text-blue-600 dark:text-cyan-400" />How FinPulse uses cookies</h2><p>FinPulse uses essential storage for authentication, theme preferences, session security, and workspace settings. These technologies keep the application reliable and do not sell personal browsing activity.</p><p>Analytics or optional cookies will only be enabled where required consent has been provided. You can clear local preferences from your browser settings.</p></div>
    </div>
  );
}
