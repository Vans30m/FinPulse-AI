import { Globe, Users, Target, ShieldCheck } from "lucide-react";

export default function About() {
  const team = [
    { name: "Vansh Thakur", url: "https://vanshthakur.me" },
    { name: "Tanish Mehta", url: "https://tanishmehta.me" }
  ];

  return (
    <div className="space-y-12">
      {/* Hero / Value Statement */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Our Mission
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Democratizing raw institutional-grade market sentiment analytics for modern traders through secure AI computational intelligence.
        </p>
      </div>

      {/* Grid of Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-6 space-y-4 text-center">
          <div className="mx-auto p-3 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400 w-12 h-12 flex items-center justify-center">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white">Precision Intelligence</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Our specialized models filter noise and track raw market sentiment triggers with a verified historical accuracy correlation.
          </p>
        </div>

        <div className="glass-panel p-6 space-y-4 text-center">
          <div className="mx-auto p-3 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400 w-12 h-12 flex items-center justify-center">
            <Globe className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white">Global Horizons</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            From Nifty 50 to the S&P 500, we monitor global geopolitical signals concurrently to deliver a unified index feed.
          </p>
        </div>

        <div className="glass-panel p-6 space-y-4 text-center">
          <div className="mx-auto p-3 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400 w-12 h-12 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white">Absolute Security</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Continuous encryption, strict SOC 2 compliance, and standard JWT authorization parameters keep your strategies confidential.
          </p>
        </div>
      </div>

      {/* Creators Section */}
      <div className="space-y-6 mt-16">
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Users className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
          Creators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {team.map((t, idx) => (
            <a
              key={idx}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel p-6 text-center hover:shadow-lg transition-all duration-300 border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 rounded-3xl block cursor-pointer"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-500 dark:hover:text-cyan-400 transition-colors">{t.name}</h3>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
