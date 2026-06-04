import { useState, useEffect } from 'react';
import { Newspaper, Clock, ExternalLink } from 'lucide-react';

interface LiveNewsItem {
  id: number | string; // Updated to allow string IDs from Google
  headline: string;
  source: string;
  datetime: number;
  url: string;
  summary: string;
  type?: 'finnhub' | 'google'; 
}

export default function AlertsTimeline() {
  const [liveNews, setLiveNews] = useState<LiveNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllNews = async () => {
      try {
        setIsLoading(true);
        
        // Fetch BOTH APIs concurrently for maximum speed
        const [finnhubRes, googleRes] = await Promise.all([
          fetch('http://localhost:3000/api/news').catch(() => null),
          fetch('http://localhost:3000/api/news/google').catch(() => null)
        ]);
        
        let combinedNews: LiveNewsItem[] = [];

        // 1. Process Finnhub Data
        if (finnhubRes && finnhubRes.ok) {
          const finnhubData = await finnhubRes.json();
          if (Array.isArray(finnhubData)) {
            // Tag them so we know where they came from
            const taggedFinnhub = finnhubData.map(item => ({...item, type: 'finnhub'}));
            combinedNews = [...combinedNews, ...taggedFinnhub];
          }
        }

        // 2. Process Google News RSS Data
        if (googleRes && googleRes.ok) {
          const googleData = await googleRes.json();
          if (Array.isArray(googleData)) {
            combinedNews = [...combinedNews, ...googleData];
          }
        }

        // 3. Sort the combined array by Date (Newest First)
        // Using Number() ensures Javascript doesn't accidentally alphabetize them
        combinedNews.sort((a, b) => {
          const timeA = Number(a.datetime) || 0;
          const timeB = Number(b.datetime) || 0;
          return timeB - timeA; // Heaviest/Newest time floats to the top
        });
        
        setLiveNews(combinedNews);
      } catch (error) {
        console.error("Failed to fetch dual news feeds:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllNews();
  }, []);

  const formatTime = (unixTime: number) => {
    const date = new Date(unixTime * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full glass-card overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-950 shadow-xl transition-colors duration-300 flex flex-col h-full max-h-[600px]">
      
      {/* HEADER */}
      <div className="border-b border-slate-100 dark:border-white/5 p-5 shrink-0 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400">
          <Newspaper className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Live Market News</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Aggregated from Finnhub & Google News</p>
        </div>
      </div>

      {/* SCROLLABLE NEWS FEED */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="space-y-2 pb-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-cyan-400"></div>
            </div>
          ) : liveNews.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">No recent news available.</div>
          ) : (
            liveNews.map((article) => (
              <a 
                key={article.id} 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-white/10"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        article.type === 'google' 
                          ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' 
                          : 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-500/10'
                      }`}>
                        {article.source}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatTime(article.datetime)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                      {article.headline}
                    </h4>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 shrink-0 mt-1" />
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}