import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400">
          <FileText className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
          <p className="text-xs text-slate-400 mt-1">Last Updated: June 26, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="glass-panel p-8 space-y-6 text-sm text-slate-650 dark:text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Service Definition</h2>
          <p>
            FinPulse AI provides real-time computational market sentiment statistics. Accessing or integrating these API keys signifies your agreement to these Terms of Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Acceptable Use Limitations</h2>
          <p>
            Users must not deploy automated web scraping tools to clone sentiment catalogs. API usage is governed by rate limits corresponding to the subscribed tier (Basic, Pro, or Enterprise). Over-querying will trigger temporary rate containment responses.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Intellectual Property</h2>
          <p>
            Our NLP algorithms, computational decay metrics, sentiment indicators, and custom layout graphics are the sole property of FinPulse AI. Subscribing to a tier grants a limited, non-transferable key to view data, not ownership rights.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Termination</h2>
          <p>
            We reserve the right to suspend API credentials immediately if suspicious, high-frequency query behaviors or scraping attempts are identified.
          </p>
        </section>
      </div>
    </div>
  );
}
