import { useState, useEffect } from 'react';
import { Newspaper, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_BASE_URL from "../../../config/api";
import { pageCache } from '../../../utils/cache';

interface LiveNewsItem {
  id: number | string; // Updated to allow string IDs from Google
  headline: string;
  source: string;
  datetime: number;
  url: string;
  summary: string;
  type?: 'finnhub' | 'google';
}
interface AlertsTimelineProps {
  fullPage?: boolean;
}

export default function AlertsTimeline({
  fullPage = false,
}: AlertsTimelineProps) {
  const cachedNews = pageCache.get('liveNews');
  const [liveNews, setLiveNews] = useState<LiveNewsItem[]>(cachedNews || []);
  const [isLoading, setIsLoading] = useState(!cachedNews);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const displayedNews = isMobile ? (fullPage ? liveNews.slice(0, 20) : liveNews.slice(0, 5)) : liveNews;

  useEffect(() => {
    const fetchAllNews = async () => {
      try {
        setIsLoading(true);

        // Fetch BOTH APIs concurrently for maximum speed
        const [finnhubRes, googleRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/news`).catch(() => null),
          fetch(`${API_BASE_URL}/api/news/google`).catch(() => null)
        ]);

        let combinedNews: LiveNewsItem[] = [];

        // 1. Process Finnhub Data
        if (finnhubRes && finnhubRes.ok) {
          const finnhubData = await finnhubRes.json();
          if (Array.isArray(finnhubData)) {
            // Tag them so we know where they came from
            const taggedFinnhub = finnhubData.map(item => ({ ...item, type: 'finnhub' }));
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
        pageCache.set('liveNews', combinedNews);
      } catch (error) {
        console.error("Failed to fetch dual news feeds:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllNews();
  }, []);

  const formatTime = (unixTime: number) => {
    const now = Date.now();
    const diffMs = now - unixTime * 1000;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    const date = new Date(unixTime * 1000);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`
      w-full
      overflow-hidden
      rounded-lg
      border
      border-slate-200
      dark:border-[#242424]
      bg-white
      dark:bg-[#111111]
      shadow-sm
      transition-colors
      flex
      flex-col
      ${fullPage ? "h-full" : "max-h-[1300px]"}`}
    >
      {/* HEADER */}
      <div className="border-b border-slate-200 dark:border-[#242424] px-4 py-3 shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase text-slate-900 dark:text-white leading-tight">
              {fullPage ? "Global Market News Center" : "Live Market News"}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Aggregated from Finnhub & Google News</p>
          </div>
        </div>
      </div>

      {/* SCROLLABLE NEWS FEED */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 dark:border-white"></div>
          </div>
        ) : liveNews.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 dark:text-neutral-500">No recent news available.</div>
        ) : (
          <>
            {displayedNews.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-md bg-slate-50 dark:bg-[#141414] hover:bg-slate-100 dark:hover:bg-[#171717] border border-slate-200 dark:border-[#242424] transition-colors group"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-[#1C1C1C] text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-[#242424]">
                        {article.source}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-neutral-500 flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" /> {formatTime(article.datetime)}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors leading-snug break-words">
                      {article.headline}
                    </h4>
                    {article.summary && (
                      <p className="text-[11px] text-slate-600 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed font-normal">
                        {article.summary}
                      </p>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded bg-slate-100 dark:bg-[#1C1C1C] flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500 dark:text-neutral-400" />
                  </div>
                </div>
              </a>
            ))}

            {isMobile && !fullPage && liveNews.length > 5 && (
              <Link
                to="/news"
                className="w-full mt-3 py-2 px-3 bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#171717] text-slate-800 dark:text-white rounded-md text-xs font-semibold transition-colors text-center flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#242424]"
              >
                View More News
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}