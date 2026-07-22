import { Newspaper, Calendar, Loader2 } from "lucide-react";
import { useEffect, useState, memo, useMemo } from "react";
import AlertsTimeline from "../features/dashboard/components/AlertsTimeline";
import API_BASE_URL from "../config/api";
import { pageCache } from "../utils/cache";
import PageLoader from "../components/ui/PageLoader";

interface EconomicEvent {
  time: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  event: string;
  actual: string;
  forecast: string;
  previous: string;
}

function CustomEconomicCalendar() {
  const [activeTab, setActiveTab] = useState<'yesterday' | 'today' | 'tomorrow'>('today');

  const selectedDate = useMemo(() => {
    const d = new Date();
    if (activeTab === 'yesterday') {
      d.setDate(d.getDate() - 1);
    } else if (activeTab === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [activeTab]);

  const cacheKey = `economicCalendar-${selectedDate}`;
  const cachedCalendar = pageCache.get(cacheKey);
  const [events, setEvents] = useState<EconomicEvent[]>(cachedCalendar || []);
  const [isLoading, setIsLoading] = useState(!cachedCalendar);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/economic-calendar?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data || []);
          pageCache.set(cacheKey, data || []);
        }
      } catch (err) {
        console.error("Failed to load economic events:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCalendar();
  }, [selectedDate, cacheKey]);

  const getImpactBadge = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-xs font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-xs font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">Med</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-black uppercase bg-slate-500/10 text-slate-500 border border-slate-500/10">Low</span>;
    }
  };

  const getComparisonClass = (actualStr: string, forecastStr: string) => {
    if (!actualStr || !forecastStr) return "text-slate-700 dark:text-slate-350";
    const actualVal = parseFloat(actualStr.replace(/[^\d.-]/g, ''));
    const forecastVal = parseFloat(forecastStr.replace(/[^\d.-]/g, ''));
    if (isNaN(actualVal) || isNaN(forecastVal)) return "text-slate-700 dark:text-slate-350";
    if (actualVal > forecastVal) return "text-emerald-600 dark:text-emerald-400 font-bold";
    if (actualVal < forecastVal) return "text-rose-600 dark:text-rose-455 font-bold";
    return "text-slate-700 dark:text-slate-350";
  };

  return (
    <div className="glass-panel p-4 md:p-5 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm shadow-[0_8px_20px_-15px_rgba(15,23,42,0.3)] h-fit flex flex-col">
      {/* Header and Day Selector */}
      <div className="flex flex-col gap-3 mb-5 border-b border-slate-100 dark:border-white/5 pb-4 shrink-0">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Macro Analysis</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Economic Calendar</h3>
        </div>

        {/* Tabs - Full Width on Mobile */}
        <div className="flex w-full bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1 justify-between">
          {(['yesterday', 'today', 'tomorrow'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab
                ? 'bg-blue-600 text-white dark:bg-cyan-500 dark:text-night-950 shadow-md'
                : 'text-slate-655 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Card Container */}
      <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar pr-1">
        {isLoading && events.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-cyan-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Calendar className="h-8 w-8 opacity-45" />
            <span className="text-xs font-bold">No economic events scheduled.</span>
          </div>
        ) : (
            <div className="flex flex-col gap-2.5">
              {events.map((event, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-55/30 dark:bg-white/[0.01] hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
                      <span className="text-slate-900 dark:text-slate-300 font-semibold">{event.time}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-655 dark:text-slate-400">{event.currency}</span>
                      <span>·</span>
                      {getImpactBadge(event.impact)}
                    </div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                      {event.event}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-4 sm:self-center self-start text-[11px] font-mono shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5 pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500">Actual</span>
                      <span className={getComparisonClass(event.actual, event.forecast)}>{event.actual || "---"}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500">Forecast</span>
                      <span className="text-slate-500 dark:text-slate-450">{event.forecast || "---"}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500">Previous</span>
                      <span className="text-slate-500 dark:text-slate-450">{event.previous || "---"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        )}
      </div>
    </div>
  );
}

const MemoizedCustomEconomicCalendar = memo(CustomEconomicCalendar);

export default function News() {
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);



  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 px-4 py-6 md:px-6">

      {/* Real-time Header Row */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200/50 dark:border-white/5 pt-2">
        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/10 shrink-0 hidden sm:block">
          <Newspaper className="h-8 w-8" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live Intel Feed
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            Market Intelligence
          </h1>
          <p className="text-xs text-slate-555 dark:text-slate-400 font-semibold mt-1.5 max-w-xl hidden md:block">
            Real-time global coverage aggregated from premium networks and macroeconomic schedules.
          </p>
        </div>
      </div>

      {/* Feed & Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2 h-full">
          <AlertsTimeline fullPage />
        </div>
        <div className="lg:col-span-1 h-fit">
          <MemoizedCustomEconomicCalendar />
        </div>
      </div>

    </div>
  );
}