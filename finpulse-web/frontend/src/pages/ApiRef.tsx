import { useState } from "react";
import { Terminal, Code } from "lucide-react";

export default function ApiRef() {
  const [lang, setLang] = useState<"curl" | "node" | "python">("curl");

  const codeSnippets = {
    curl: {
      getSentiment: `curl -X GET "https://api.finpulse.ai/v1/sentiment?symbol=AAPL" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      getMarkets: `curl -X GET "https://api.finpulse.ai/v1/markets/indices?region=india" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    },
    node: {
      getSentiment: `const axios = require('axios');

axios.get('https://api.finpulse.ai/v1/sentiment', {
  params: { symbol: 'AAPL' },
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
})
.then(res => console.log(res.data))
.catch(err => console.error(err));`,
      getMarkets: `const axios = require('axios');

axios.get('https://api.finpulse.ai/v1/markets/indices', {
  params: { region: 'india' },
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
})
.then(res => console.log(res.data))
.catch(err => console.error(err));`
    },
    python: {
      getSentiment: `import requests

url = "https://api.finpulse.ai/v1/sentiment"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
params = {"symbol": "AAPL"}

response = requests.get(url, headers=headers, params=params)
print(response.json())`,
      getMarkets: `import requests

url = "https://api.finpulse.ai/v1/markets/indices"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
params = {"region": "india"}

response = requests.get(url, headers=headers, params=params)
print(response.json())`
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 bottom-0 top-0 opacity-15 pointer-events-none flex items-center justify-center pr-12">
          <Terminal className="h-64 w-64 text-cyan-400" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
            <Terminal className="h-3.5 w-3.5" />
            Developer Sandbox v1.0.4
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">FinPulse API Reference</h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Integrate institutional-grade market sentiment, news summaries, and predictive metrics directly into your algorithms.
          </p>
        </div>
      </div>

      {/* Language Selector */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Code className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
          Endpoints & Schemas
        </h3>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(["curl", "node", "python"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                lang === l
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
              }`}
            >
              {l === "node" ? "Node.js" : l}
            </button>
          ))}
        </div>
      </div>

      {/* Endpoint Cards & Interactive Code Blocks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* API Endpoint: Sentiment */}
        <div className="glass-panel p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="rounded bg-blue-500/10 px-2.5 py-1 text-xs font-black text-blue-500">GET</span>
              <code className="text-sm font-bold text-slate-800 dark:text-slate-100">/v1/sentiment</code>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Retrieve real-time sentiment mood (Bullish/Bearish), numeric sentiment index score (-100 to +100), and top classifications for the specified symbol.
            </p>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Request Parameters</div>
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="flex justify-between p-3">
                  <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">symbol</span>
                  <span className="text-slate-400">string (required) - e.g., AAPL</span>
                </div>
              </div>
            </div>
          </div>
          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-[160px]">
            {codeSnippets[lang].getSentiment}
          </pre>
        </div>

        {/* API Endpoint: Markets */}
        <div className="glass-panel p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="rounded bg-blue-500/10 px-2.5 py-1 text-xs font-black text-blue-500">GET</span>
              <code className="text-sm font-bold text-slate-800 dark:text-slate-100">/v1/markets/indices</code>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Retrieve live prices, change indexes, and regions for global market indices (e.g., NIFTY 50, S&P 500).
            </p>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Request Parameters</div>
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="flex justify-between p-3">
                  <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">region</span>
                  <span className="text-slate-400">string (optional) - "india" | "us"</span>
                </div>
              </div>
            </div>
          </div>
          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-[160px]">
            {codeSnippets[lang].getMarkets}
          </pre>
        </div>

      </div>
    </div>
  );
}
