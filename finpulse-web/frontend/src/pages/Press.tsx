import { Download, Mail, FileText } from "lucide-react";

export default function Press() {
  const releases = [
    { title: "FinPulse AI Announces Series A Funding for Sentiment Models", date: "May 14, 2026" },
    { title: "FinPulse AI Integrates Dual Google & Finnhub Live News Feeds", date: "April 02, 2026" },
    { title: "FinPulse AI Launches Millisecond Alert Webhooks", date: "Jan 19, 2026" }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Press & Media Kit
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Access FinPulse brand assets, logos, design guidelines, and recent media publications.
        </p>
      </div>

      {/* Brand Assets Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Brand Asset Download */}
        <div className="glass-panel p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Brand Asset Packages</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Logos, wordmarks, brand guidelines, and color palettes optimized for print, light-theme, and dark-theme configurations.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 py-3 text-xs font-bold text-white dark:text-slate-950 transition-colors">
            <Download className="h-4 w-4" /> Download Brand Kit (.zip)
          </button>
        </div>

        {/* Media Inquiries */}
        <div className="glass-panel p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Media & Press Inquiries</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              For interview requests, executive biographies, key statements, or customized brand illustrations, reach our communications desk.
            </p>
          </div>
          <a
            href="mailto:press@finpulse.ai"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-xs font-bold text-slate-900 dark:text-white transition-colors"
          >
            <Mail className="h-4 w-4" /> press@finpulse.ai
          </a>
        </div>

      </div>

      {/* Press Releases */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
          Press Releases
        </h2>
        <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
          {releases.map((rel, idx) => (
            <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{rel.title}</h3>
              <span className="text-xs text-slate-400 font-medium shrink-0">{rel.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
