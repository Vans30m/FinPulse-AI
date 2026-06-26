import { BookOpen, Calendar, ArrowRight } from "lucide-react";

export default function Blog() {
  const posts = [
    {
      id: 1,
      title: "Decoding the Fed Rate: AI Sentiment Index Predictions",
      excerpt: "Analyzing LLM sentiment index variations during FOMC conferences and their trailing market impacts.",
      date: "June 25, 2026",
      category: "Analysis",
      imageGrad: "from-blue-600 to-cyan-500"
    },
    {
      id: 2,
      title: "Nifty 50 Implied Volatility and AI Catalysts",
      excerpt: "How domestic Indian markets are responding to geopolitical updates and cross-border tech partnerships.",
      date: "June 20, 2026",
      category: "Markets",
      imageGrad: "from-cyan-500 to-teal-500"
    },
    {
      id: 3,
      title: "Algorithmic Order Book Sentiment: The Next Frontier",
      excerpt: "Integrating raw order book flows with NLP headline sentiment metrics to optimize intraday signals.",
      date: "June 18, 2026",
      category: "Tech",
      imageGrad: "from-purple-600 to-blue-500"
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero / Featured Post */}
      <div className="rounded-3xl bg-gradient-to-br from-night-800 to-night-950 border border-slate-200 dark:border-slate-800 p-8 md:p-12 relative overflow-hidden flex flex-col justify-between min-h-[380px]">
        <div className="absolute top-6 right-6 rounded-full bg-blue-600 dark:bg-cyan-500 px-3 py-1 text-xs font-bold text-white dark:text-slate-950">
          Featured Post
        </div>
        <div className="space-y-4 max-w-2xl mt-auto z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
            Market Intelligence
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
            How Macroeconomic Sentiment Shapes Intraday Trading Indexes
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            A comprehensive, data-driven analysis of NLP sentiment decay times during macroeconomic announcement releases like CPI and unemployment indicators.
          </p>
          <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> June 26, 2026
            </span>
            <span>•</span>
            <span>12 Min Read</span>
          </div>
        </div>
      </div>

      {/* Grid of Posts */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
          Recent Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article key={post.id} className="glass-panel overflow-hidden group hover:border-slate-350 dark:hover:border-slate-800 flex flex-col justify-between">
              <div>
                <div className={`h-40 bg-gradient-to-br ${post.imageGrad} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <div className="p-6 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                    {post.category}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400">{post.date}</span>
                <span className="text-xs font-bold text-blue-600 dark:text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
