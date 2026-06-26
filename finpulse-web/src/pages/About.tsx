import { Globe, Users, Target, ShieldCheck } from "lucide-react";

export default function About() {
  const team = [
    { name: "Vikram Malhotra", role: "Co-Founder & CEO", desc: "Ex-algorithmic trader at QuantGroup. Building AI systems for high-frequency index traders." },
    { name: "Aarav Sharma", role: "Chief AI Architect", desc: "Ph.D. in NLP. Designing specialized financial models for low-latency sentiment decay." },
    { name: "Ananya Patel", role: "Head of Infrastructure", desc: "Ex-Cloud Architect. Managing secure pipelines processing millions of daily feeds." }
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

      {/* Team Section */}
      <div className="space-y-6 mt-16">
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Users className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
          Leadership Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((t, idx) => (
            <div key={idx} className="glass-panel p-6 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white">{t.name}</h3>
              <span className="text-xs font-semibold text-blue-600 dark:text-cyan-400">{t.role}</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
