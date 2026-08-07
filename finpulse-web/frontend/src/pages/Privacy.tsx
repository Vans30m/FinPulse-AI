import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400">
          <Shield className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-400 mt-1">Last Updated: June 26, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="glass-panel p-8 space-y-6 text-sm text-slate-650 dark:text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Information We Collect</h2>
          <p>
            We collect information that you configure when subscribing to our newsletters, creating account profiles, or integrating APIs. This includes email addresses, watchlist assets, custom alert configurations, and API authorization request statistics.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Computational Data Usage</h2>
          <p>
            Your watchlists, mock portfolio data, and query indicators are encrypted. We do not sell or monetize individual trading configurations or asset watchlist metrics. General aggregated statistics are computed to improve sentiment extraction speeds.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Third Party Integrations</h2>
          <p>
            FinPulse AI integrates with public RSS feeds and Finnhub APIs. When accessing external articles from Google News through our feed streams, check their respective privacy declarations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. GDPR/CCPA Declarations</h2>
          <p>
            European and Californian users possess the absolute right to demand data erasure (deletion of watchlists, billing history, and profile keys). Reach out to <strong>security@finpulse.ai</strong> to execute deletion demands.
          </p>
        </section>
      </div>
    </div>
  );
}
