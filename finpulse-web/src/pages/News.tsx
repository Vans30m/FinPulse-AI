import { Newspaper, Calendar, Loader2, TrendingUp } from "lucide-react";
import { useEffect, useState, memo, useMemo } from "react";
import AlertsTimeline from "../features/dashboard/components/AlertsTimeline";
import { useChart } from "../context/ChartContext";
import API_BASE_URL from "../config/api";

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
        const res = await fetch(`${API_BASE_URL}/api/economic-calendar?date=${selectedDate}`);
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

  const getImpactBadge = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20">High</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">Med</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-500/10 text-slate-500 border border-slate-500/10">Low</span>;
    }
  };

  const getComparisonClass = (actualStr: string, forecastStr: string) => {
    if (!actualStr || !forecastStr) return "text-slate-700 dark:text-slate-350";
    const actualVal = parseFloat(actualStr.replace(/[^\d.-]/g, ''));
    const forecastVal = parseFloat(forecastStr.replace(/[^\d.-]/g, ''));
    if (isNaN(actualVal) || isNaN(forecastVal)) return "text-slate-700 dark:text-slate-350";
    if (actualVal > forecastVal) return "text-emerald-600 dark:text-emerald-400 font-bold";
    if (actualVal < forecastVal) return "text-rose-600 dark:text-rose-450 font-bold";
    return "text-slate-700 dark:text-slate-350";
  };

  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm shadow-[0_8px_20px_-15px_rgba(15,23,42,0.3)] h-fit flex flex-col">
      {/* Header and Day Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-white/5 pb-4 shrink-0">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Macro Analysis</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Economic Calendar</h3>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1">
          {(['yesterday', 'today', 'tomorrow'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab
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
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Calendar className="h-8 w-8 opacity-45" />
            <span className="text-xs font-bold">No economic events scheduled.</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-150 dark:border-white/5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 pr-2">Time</th>
                <th className="py-2.5 px-2">Cur</th>
                <th className="py-2.5 px-2 text-center">Impact</th>
                <th className="py-2.5 px-2 w-[45%]">Event</th>
                <th className="py-2.5 px-2 text-right">Actual</th>
                <th className="py-2.5 px-2 text-right">Forecast</th>
                <th className="py-2.5 pl-2 text-right">Previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {events.map((event, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors text-xs">
                  <td className="py-3 pr-2 text-slate-400 font-medium whitespace-nowrap">{event.time}</td>
                  <td className="py-3 px-2 font-mono font-black text-slate-700 dark:text-slate-330">{event.currency}</td>
                  <td className="py-3 px-2 text-center">{getImpactBadge(event.impact)}</td>
                  <td className="py-3 px-2 font-semibold text-slate-855 dark:text-slate-200 leading-snug">{event.event}</td>
                  <td className={`py-3 px-2 text-right font-mono ${getComparisonClass(event.actual, event.forecast)}`}>{event.actual || "---"}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-600 dark:text-slate-450">{event.forecast || "---"}</td>
                  <td className="py-3 pl-2 text-right font-mono text-slate-655 dark:text-slate-400">{event.previous || "---"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const MemoizedCustomEconomicCalendar = memo(CustomEconomicCalendar);

interface MarketIndex {
  symbol: string;
  name: string;
  price: string;
  changePercent: number;
}

export default function News() {
  const { openChart } = useChart();
  const [indices, setIndices] = useState<MarketIndex[]>([
    { symbol: '^GSPC', name: 'S&P 500', price: '5,432.10', changePercent: 0.45 },
    { symbol: '^IXIC', name: 'NASDAQ', price: '18,245.50', changePercent: 0.80 },
    { symbol: '^DJI', name: 'DOW JONES', price: '39,120.00', changePercent: -0.12 }
  ]);

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const res = await fetch('${API_BASE_URL}/api/market-indices');
        if (res.ok) {
          const data = await res.json();
          setIndices(data);
        }
      } catch (err) {
        console.error("Failed to fetch indices:", err);
      }
    };
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">

      {/* Real-time Header Row (Without Box) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-200/50 dark:border-white/5 pt-2 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/10 shrink-0 hidden sm:block">
            <Newspaper className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Live Intel Feed
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              Market Intelligence
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5 max-w-xl">
              Real-time global coverage aggregated from premium networks and macroeconomic schedules.
            </p>
          </div>
        </div>

        {/* Quick Index Tracker Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
          {indices.map((idx) => {
            const isPositive = idx.changePercent >= 0;
            return (
              <div key={idx.symbol} className="glass-panel px-4 py-3 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm min-w-[155px] shadow-sm flex items-center justify-between gap-3 group/index hover:border-blue-500/30 dark:hover:border-cyan-500/30 transition-all duration-300">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{idx.name}</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{idx.price}</span>
                    <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}`}>
                      {isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => openChart({ symbol: idx.symbol, yahooSymbol: idx.symbol, name: idx.name, exchange: 'INDEX', type: 'INDEX' })}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 dark:bg-white/5 dark:hover:bg-cyan-500 hover:text-white dark:hover:text-night-950 text-slate-450 dark:text-slate-400 transition-all duration-200 shadow-sm opacity-60 group-hover/index:opacity-100 shrink-0"
                  title={`Open ${idx.name} Chart`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feed & Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
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