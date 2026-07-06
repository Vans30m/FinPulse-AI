import { Newspaper, Calendar, Loader2 } from "lucide-react";
import { useEffect, useState, memo, useMemo } from "react";
import AlertsTimeline from "../features/dashboard/components/AlertsTimeline";

interface EconomicEvent {
  time: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  event: string;
  actual: string;
  forecast: string;
  previous: string;
}

const currencyFlags: Record<string, string> = {
  USD: "🇺🇸",
  INR: "🇮🇳",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  CAD: "🇨🇦",
  JPY: "🇯🇵",
  AUD: "🇦🇺",
  CHF: "🇨🇭",
  NZD: "🇳🇿",
  CNY: "🇨🇳",
  HKD: "🇭🇰",
};

function CustomEconomicCalendar() {
  const [activeTab, setActiveTab] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:3000/api/economic-calendar?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data || []);
        }
      } catch (err) {
        console.error("Failed to load economic events:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCalendar();
  }, [selectedDate]);

  const getImpactDot = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" title="High Impact" />;
      case 'medium':
        return <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_rgba(245,158,11,0.5)]" title="Medium Impact" />;
      default:
        return <span className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-600 inline-block" title="Low Impact" />;
    }
  };

  const getComparisonClass = (actualStr: string, forecastStr: string) => {
    if (!actualStr || !forecastStr) return "text-slate-700 dark:text-slate-300";
    const actualVal = parseFloat(actualStr.replace(/[^\d.-]/g, ''));
    const forecastVal = parseFloat(forecastStr.replace(/[^\d.-]/g, ''));
    if (isNaN(actualVal) || isNaN(forecastVal)) return "text-slate-700 dark:text-slate-300";
    if (actualVal > forecastVal) return "text-emerald-650 dark:text-emerald-400 font-bold";
    if (actualVal < forecastVal) return "text-rose-650 dark:text-rose-400 font-bold";
    return "text-slate-700 dark:text-slate-300";
  };

  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm shadow-[0_8px_20px_-15px_rgba(15,23,42,0.3)] h-full flex flex-col">
      {/* Header and Day Selector */}
      <div className="flex flex-col gap-4 mb-5 border-b border-slate-100 dark:border-white/5 pb-4 shrink-0">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Macro Analysis</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Economic Calendar</h3>
        </div>

        {/* Tabs - Span Full Width */}
        <div className="flex bg-slate-100 dark:bg-slate-950/60 border border-slate-200/50 dark:border-white/5 p-1 rounded-2xl gap-1 w-full shrink-0">
          {(['yesterday', 'today', 'tomorrow'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white dark:bg-cyan-500 dark:text-night-950 shadow-md'
                  : 'text-slate-655 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table Container */}
      <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar pr-1">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-cyan-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Calendar className="h-8 w-8 opacity-45" />
            <span className="text-xs font-bold">No economic events scheduled.</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed min-w-[340px]">
            <thead>
              <tr className="border-b border-slate-150 dark:border-white/5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-2 pr-1 w-[60px]">Time</th>
                <th className="py-2 px-1 w-[55px]">Cur</th>
                <th className="py-2 px-1 text-center w-[30px]">Imp</th>
                <th className="py-2 px-1">Event</th>
                <th className="py-2 px-1 text-right w-[45px]">Act</th>
                <th className="py-2 px-1 text-right w-[45px]">For</th>
                <th className="py-2 pl-1 text-right w-[45px]">Prev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {events.map((event, idx) => {
                const flag = currencyFlags[event.currency.toUpperCase()] || "🏳️";
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.015] transition-colors text-[11px]">
                    <td className="py-2.5 pr-1 text-slate-450 dark:text-slate-400 font-medium whitespace-nowrap">{event.time}</td>
                    <td className="py-2.5 px-1 font-mono font-black text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <span>{flag}</span>
                        <span className="text-[10px]">{event.currency}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-1 text-center">{getImpactDot(event.impact)}</td>
                    <td className="py-2.5 px-1 font-semibold text-slate-800 dark:text-slate-200 leading-snug break-words pr-2">
                      {event.event}
                    </td>
                    <td className={`py-2.5 px-1 text-right font-mono text-[10px] ${getComparisonClass(event.actual, event.forecast)}`}>
                      {event.actual || <span className="opacity-30">-</span>}
                    </td>
                    <td className="py-2.5 px-1 text-right font-mono text-[10px] text-slate-500 dark:text-slate-450">
                      {event.forecast || <span className="opacity-30">-</span>}
                    </td>
                    <td className="py-2.5 pl-1 text-right font-mono text-[10px] text-slate-550 dark:text-slate-400">
                      {event.previous || <span className="opacity-30">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const MemoizedCustomEconomicCalendar = memo(CustomEconomicCalendar);

export default function News() {
  return (
    <div className="space-y-6">

      {/* Header Row (Replacing Box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-5 pt-2 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-blue-650 dark:text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-[0.25em]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live Intel Feed
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            Market Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Aggregated global coverage from premium networks and macroeconomic schedules.
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <div className="glass-panel px-4 py-2.5 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] flex items-center gap-2.5 shadow-sm text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-650 dark:text-slate-350">Finnhub Live</span>
          </div>
          <div className="glass-panel px-4 py-2.5 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] flex items-center gap-2.5 shadow-sm text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-650 dark:text-slate-350">Google News Feed</span>
          </div>
          <div className="glass-panel px-4 py-2.5 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] flex items-center gap-2.5 shadow-sm text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-650 dark:text-slate-350">TradingView Calendar</span>
          </div>
        </div>
      </div>

      {/* Feed & Calendar Grid */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AlertsTimeline fullPage />
        </div>
        <div className="lg:col-span-1">
          <MemoizedCustomEconomicCalendar />
        </div>
      </div>

    </div>
  );
}