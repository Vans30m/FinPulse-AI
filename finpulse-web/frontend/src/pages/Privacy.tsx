import { Shield, Eye, Cpu, Globe, Lock, Mail } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/60 dark:border-white/5 bg-gradient-to-r from-blue-600/10 via-cyan-500/5 to-transparent p-8 md:p-10 shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 shadow-sm shrink-0">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Privacy Policy</h1>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">Last Updated: August 15, 2026</p>
          </div>
        </div>
      </div>

      {/* Content Sections Grid */}
      <div className="space-y-6">
        
        {/* Section 1 */}
        <div className="glass-panel p-6 md:p-8 hover:shadow-lg transition-all duration-300 border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex-shrink-0">
              <Eye className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">1. Information We Collect</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 pl-1">
            We collect information that you configure when subscribing to our newsletters, creating account profiles, or integrating APIs. This includes email addresses, watchlist assets, custom alert configurations, and API authorization request statistics.
          </p>
        </div>

        {/* Section 2 */}
        <div className="glass-panel p-6 md:p-8 hover:shadow-lg transition-all duration-300 border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <Cpu className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">2. Computational Data Usage</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 pl-1">
            Your watchlists, mock portfolio data, and query indicators are encrypted. We do not sell or monetize individual trading configurations or asset watchlist metrics. General aggregated statistics are computed to improve sentiment extraction speeds.
          </p>
        </div>

        {/* Section 3 */}
        <div className="glass-panel p-6 md:p-8 hover:shadow-lg transition-all duration-300 border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex-shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">3. Third Party Integrations</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 pl-1">
            FinPulse AI integrates with public RSS feeds and Finnhub APIs. When accessing external articles from Google News through our feed streams, check their respective privacy declarations.
          </p>
        </div>

        {/* Section 4 */}
        <div className="glass-panel p-6 md:p-8 hover:shadow-lg transition-all duration-300 border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex-shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">4. GDPR/CCPA Declarations</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 pl-1 pb-2">
            European and Californian users possess the absolute right to demand data erasure (deletion of watchlists, billing history, and profile keys).
          </p>
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-2xl">
            <Mail className="h-5 w-5 text-indigo-500 dark:text-cyan-400 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reach out to our security desk at <a href="mailto:afinpulseai@gmail.com" className="font-bold text-blue-600 dark:text-cyan-400 hover:underline">afinpulseai@gmail.com</a> to execute deletion demands.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
