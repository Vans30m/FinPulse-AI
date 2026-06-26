import { useState } from "react";
import { BookOpen, Play, Settings, Database, Bell } from "lucide-react";

export default function Docs() {
  const [activeSection, setActiveSection] = useState<"intro" | "config" | "sentiment" | "alerts">("intro");

  const sections = {
    intro: {
      title: "Getting Started with FinPulse AI",
      icon: <Play className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Welcome to the official developer documentation center. FinPulse AI provides continuous sentiment analysis and risk indicators for traders, institutions, and algorithmic trading desks.</p>
          <h3 className="text-lg font-bold mt-6 text-slate-900 dark:text-white">Core Architecture</h3>
          <p>Our platform indexes millions of market catalysts per second and aggregates them using state-of-the-art Natural Language Processing (NLP) models to gauge overall market momentum.</p>
          <div className="bg-slate-100 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            npm install @finpulse/sdk-core
          </div>
        </div>
      )
    },
    config: {
      title: "Configuring Your Workspace",
      icon: <Settings className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Customize your FinPulse experience by setting up watchlists, asset groupings, and alert thresholds. Environment files can be configured in your backend service configuration.</p>
          <h3 className="text-lg font-bold mt-6 text-slate-900 dark:text-white">Environment Variable Configuration</h3>
          <p>Create a <code>.env</code> file in your root workspace and set the API credentials:</p>
          <pre className="bg-slate-100 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono leading-relaxed">
{`FINNHUB_API_KEY=your_finnhub_key
GOOGLE_NEWS_API_KEY=your_google_key
JWT_SECRET=your_jwt_signing_secret`}
          </pre>
        </div>
      )
    },
    sentiment: {
      title: "Understanding Sentiment Analytics",
      icon: <Database className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Market Sentiment scores range from -100 (Extremely Bearish) to +100 (Extremely Bullish). They are compiled based on historical sentiment correlation analysis.</p>
          <h3 className="text-lg font-bold mt-6 text-slate-900 dark:text-white">Sentiment Calculation Parameters</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-slate-300 pl-2">
            <li><strong>News Catalysts:</strong> Weighted by news source reputation.</li>
            <li><strong>Index Weighting:</strong> High impact news is dynamically prioritized.</li>
            <li><strong>Decay Constant:</strong> Older news sentiment decay occurs exponentially over a 12-hour window.</li>
          </ul>
        </div>
      )
    },
    alerts: {
      title: "Configuring Webhooks and Alerts",
      icon: <Bell className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Receive real-time notifications about massive market shift catalysts. We support Webhook delivery, SMS payloads, and SMTP configurations.</p>
          <h3 className="text-lg font-bold mt-6 text-slate-900 dark:text-white">Example Webhook JSON Body</h3>
          <pre className="bg-slate-100 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono leading-relaxed">
{`{
  "event": "sentiment.threshold_exceeded",
  "timestamp": 1719398400,
  "data": {
    "symbol": "TSLA",
    "trigger_sentiment": -45.5,
    "source_headline": "Regulatory scrutiny intensifies regarding battery production limits."
  }
}`}
          </pre>
        </div>
      )
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 text-slate-400 font-bold uppercase text-xs tracking-wider">
          <BookOpen className="h-4 w-4" />
          <span>Documentation</span>
        </div>
        <nav className="space-y-1">
          {Object.entries(sections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-all ${
                activeSection === key
                  ? "bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/20 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              {section.icon}
              {section.title.split(" ").slice(0, 3).join(" ")}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3 glass-panel p-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
          {sections[activeSection].title}
        </h1>
        <div className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed space-y-6">
          {sections[activeSection].content}
        </div>
      </div>
    </div>
  );
}
