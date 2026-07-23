import { memo, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import API_BASE_URL from "../../../config/api";
import { useProfile } from "../../../profile/hooks/useProfile";
import { StockLogo } from "../../../utils/logo";
import { 
  CalendarClock, ChevronRight, CircleDot, Clock3, Search, SlidersHorizontal, 
  ArrowUpDown, ExternalLink, RefreshCw, X, 
  Info, Sparkles, AlertCircle, Loader2
} from "lucide-react";

interface PortfolioEvent {
  symbol: string;
  company: string;
  exchange: string;
  eventType: string;
  eventDate: string;
  description: string;
  timezone?: string;
  timezoneShort?: string;
  logo?: string;
  importance: "High" | "Medium" | "Low";
  expectedImpact: "Bullish" | "Neutral" | "Bearish";
  confidence: number;
  risk: "Low" | "Medium" | "High";
  summary: string;
  historicalReaction: string;
  aiRecommendation: string;
  thingsToWatch: string[];
}

const eventTypes = [
  "All", "Earnings", "Dividend", "Stock Split", "Bonus", "Rights", 
  "Buyback", "AGM", "Analyst", "Corporate Actions", "Insider Activity", 
  "IPO", "Merger", "Acquisition"
] as const;

const importanceFilters = ["All", "High", "Medium", "Low"] as const;
const impactFilters = ["All", "Bullish", "Neutral", "Bearish"] as const;
const dateFilters = ["All", "Upcoming Today", "Next 7 Days", "Next 30 Days", "Completed"] as const;

const sortOptions = [
  { value: "upcoming", label: "Upcoming Soon" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "importance", label: "Highest Importance" },
  { value: "confidence", label: "Highest AI Confidence" },
  { value: "alphabetical", label: "Alphabetical" }
];

function UpcomingEventsSection() {
  const { data: profile } = useProfile();
  const [events, setEvents] = useState<PortfolioEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDateFilter, setActiveDateFilter] = useState<(typeof dateFilters)[number]>("All");
  const [activeTypeFilter, setActiveTypeFilter] = useState<(typeof eventTypes)[number]>("All");
  const [activeImportanceFilter, setActiveImportanceFilter] = useState<(typeof importanceFilters)[number]>("All");
  const [activeImpactFilter, setActiveImpactFilter] = useState<(typeof impactFilters)[number]>("All");
  const [sortBy, setSortBy] = useState("upcoming");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Active Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<PortfolioEvent | null>(null);

  const formatEventDate = (dateStr: string, options?: Intl.DateTimeFormatOptions) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "TBD";
    try {
      return date.toLocaleDateString(undefined, {
        ...options,
        timeZone: profile?.timezone || undefined
      });
    } catch (e) {
      return date.toLocaleDateString(undefined, options);
    }
  };



  const fetchEvents = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
      const userId = storedUser.id;
      const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
      const headers: any = {};
      if (userId) headers['X-User-Id'] = userId;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/portfolio/events`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEvents(data || []);
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getCountdownLabel = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    if (isNaN(eventDate.getTime())) return "TBD";
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffMs <= 0) return "Expired";
    if (diffDays === 0 && diffHours > 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === 2) return "2 Days Left";
    return `${diffDays} Days Left`;
  };

  // Filter & Sort Logic
  const processedEvents = useMemo(() => {
    let result = [...events];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        e =>
          e.company.toLowerCase().includes(q) ||
          e.symbol.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q)
      );
    }

    // 2. Date Filter
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    result = result.filter(e => {
      const eDate = new Date(e.eventDate);
      const isValid = !isNaN(eDate.getTime());
      const eDateStr = isValid ? eDate.toISOString().slice(0, 10) : todayStr;
      const diffMs = isValid ? (eDate.getTime() - now.getTime()) : 0;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (activeDateFilter === "Upcoming Today") {
        return isValid && eDateStr === todayStr && diffMs >= 0;
      }
      if (activeDateFilter === "Next 7 Days") {
        return isValid && diffDays >= 0 && diffDays <= 7;
      }
      if (activeDateFilter === "Next 30 Days") {
        return isValid && diffDays >= 0 && diffDays <= 30;
      }
      if (activeDateFilter === "Completed") {
        return isValid && diffMs < 0;
      }
      return true;
    });

    // 3. Event Type
    if (activeTypeFilter !== "All") {
      result = result.filter(e => e.eventType === activeTypeFilter);
    }

    // 4. Importance
    if (activeImportanceFilter !== "All") {
      result = result.filter(e => e.importance === activeImportanceFilter);
    }

    // 5. AI Impact
    if (activeImpactFilter !== "All") {
      result = result.filter(e => e.expectedImpact === activeImpactFilter);
    }

    // 6. Sort
    result.sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);
      const timeA = isNaN(dateA.getTime()) ? Infinity : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? Infinity : dateB.getTime();

      if (sortBy === "upcoming") {
        return timeA - timeB;
      }
      if (sortBy === "newest") {
        return timeB - timeA;
      }
      if (sortBy === "oldest") {
        return timeA - timeB;
      }
      if (sortBy === "importance") {
        const priority = { High: 3, Medium: 2, Low: 1 };
        return priority[b.importance] - priority[a.importance];
      }
      if (sortBy === "confidence") {
        return b.confidence - a.confidence;
      }
      if (sortBy === "alphabetical") {
        return a.company.localeCompare(b.company);
      }
      return 0;
    });

    return result;
  }, [events, searchQuery, activeDateFilter, activeTypeFilter, activeImportanceFilter, activeImpactFilter, sortBy]);

  // Group events by time horizon
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const groups: {
      today: PortfolioEvent[];
      next7Days: PortfolioEvent[];
      thisMonth: PortfolioEvent[];
      recentlyCompleted: PortfolioEvent[];
    } = {
      today: [],
      next7Days: [],
      thisMonth: [],
      recentlyCompleted: []
    };

    processedEvents.forEach(e => {
      const eDate = new Date(e.eventDate);
      if (isNaN(eDate.getTime())) {
        return;
      }
      const eDateStr = eDate.toISOString().slice(0, 10);
      const diffMs = eDate.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffMs < 0) {
        if (Math.abs(diffDays) <= 30) {
          groups.recentlyCompleted.push(e);
        }
      } else if (eDateStr === todayStr) {
        groups.today.push(e);
      } else if (diffDays <= 7) {
        groups.next7Days.push(e);
      } else if (diffDays <= 30) {
        groups.thisMonth.push(e);
      }
    });

    return groups;
  }, [processedEvents]);

  return (
    <section className="glass-panel p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-transparent to-cyan-500/[0.04] pointer-events-none" />

      {/* Header Row */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.32em]">Portfolio Event Intelligence</span>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Intelligence Calendar</h2>
            <button 
              onClick={fetchEvents}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-400 shrink-0"
              title="Refresh events"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
        </div>
      </div>

      {/* Search & Filters */}
      <div className="relative flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, ticker, sector, or event type..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              showFiltersPanel
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                : "bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 text-slate-800 dark:text-slate-200"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>

          <div className="relative flex items-center bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-xl px-3">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 mr-2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-850 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expanded Filters Drawer */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 space-y-4"
          >
            {/* Horizon Date Filter */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Time Horizon</span>
              <div className="flex flex-wrap gap-1.5">
                {dateFilters.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setActiveDateFilter(chip)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all ${
                      activeDateFilter === chip
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                        : "bg-white dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 text-slate-650 dark:text-slate-400"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Category Filter */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Event Category</span>
              <div className="flex flex-wrap gap-1.5">
                {eventTypes.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setActiveTypeFilter(chip)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all ${
                      activeTypeFilter === chip
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                        : "bg-white dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 text-slate-650 dark:text-slate-400"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Importance */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Importance Level</span>
                <div className="flex flex-wrap gap-1.5">
                  {importanceFilters.map(chip => (
                    <button
                      key={chip}
                      onClick={() => setActiveImportanceFilter(chip)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all ${
                        activeImportanceFilter === chip
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                          : "bg-white dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 text-slate-650 dark:text-slate-400"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Impact */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">AI Expected Impact</span>
                <div className="flex flex-wrap gap-1.5">
                  {impactFilters.map(chip => (
                    <button
                      key={chip}
                      onClick={() => setActiveImpactFilter(chip)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border transition-all ${
                        activeImpactFilter === chip
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                          : "bg-white dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 text-slate-650 dark:text-slate-400"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Events Area */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-450">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
            <span>Loading Portfolio Events...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-[220px] rounded-2xl bg-slate-100/80 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-rose-500/20 bg-rose-500/[0.02] rounded-2xl text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Unable to load portfolio events</h3>
          <p className="text-xs text-slate-500 mb-4">API connection failed or request timed out.</p>
          <button onClick={fetchEvents} className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider">
            Retry Connection
          </button>
        </div>
      ) : processedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/20 dark:bg-black/[0.05] rounded-2xl text-center">
          <CalendarClock className="h-10 w-10 text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No upcoming events found for your portfolio</h3>
          <p className="text-xs text-slate-550 mb-4">Ensure you have active stocks or currencies in your assets overview.</p>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider">
            Explore Earnings Calendar
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { id: "today", title: "TODAY", list: groupedEvents.today },
            { id: "next7", title: "NEXT 7 DAYS", list: groupedEvents.next7Days },
            { id: "thisMonth", title: "THIS MONTH", list: groupedEvents.thisMonth },
            { id: "completed", title: "RECENTLY COMPLETED (PAST 30 DAYS)", list: groupedEvents.recentlyCompleted }
          ].map(group => {
            if (group.list.length === 0) return null;
            return (
              <div key={group.id} className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{group.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.list.map(event => (
                    <motion.article
                      key={`${event.symbol}-${event.eventType}-${event.eventDate}`}
                      whileHover={{ y: -3 }}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm p-5 shadow-[0_8px_20px_-15px_rgba(15,23,42,0.3)] transition-all duration-300 flex flex-col justify-between min-h-[260px]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.01] to-cyan-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative space-y-3.5 flex-1">
                        {/* Header: Company, Symbol, Exchange */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2.5">
                            <StockLogo 
                              symbol={event.symbol} 
                              className="h-9 w-9 rounded-xl border border-slate-200/50 dark:border-white/5 bg-white p-1 object-contain"
                            />
                            <div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug">{event.company}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono font-bold text-[9px] text-slate-500">{event.symbol}</span>
                                <span className="text-[8px] font-medium text-slate-400 px-1 bg-slate-100 dark:bg-white/5 rounded">{event.exchange}</span>
                              </div>
                            </div>
                          </div>

                          {/* Event Category Tag */}
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-650 dark:text-slate-450 border border-slate-200/50 dark:border-white/5">
                            {event.eventType}
                          </span>
                        </div>

                        {/* Middle: Badges row */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                            event.importance === "High"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : event.importance === "Medium"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          }`}>
                            {event.importance} Importance
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                            event.expectedImpact === "Bullish"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : event.expectedImpact === "Bearish"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-cyan-400 border-blue-500/20"
                          }`}>
                            AI: {event.expectedImpact}
                          </span>

                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/15">
                            {event.confidence}% AI Conv
                          </span>
                        </div>

                        {/* Description & AI Summary */}
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">{event.description}</p>
                          {event.summary && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed border-l-2 border-cyan-500/50 pl-2 mt-1 italic">{event.summary}</p>
                          )}
                        </div>
                      </div>

                      {/* Footer: Date & Details Button */}
                      <div className="relative mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Event Horizon</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">{formatEventDate(event.eventDate, { month: 'short', day: '2-digit' })}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              getCountdownLabel(event.eventDate) === "Expired" 
                                ? "bg-slate-500/10 text-slate-500" 
                                : "bg-cyan-500/10 text-cyan-500 animate-pulse"
                            }`}>{getCountdownLabel(event.eventDate)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border border-slate-200/50 dark:border-white/5 text-[9px] font-black uppercase tracking-wider text-slate-650 dark:text-slate-400 hover:text-cyan-400 dark:hover:text-cyan-400 transition-all"
                        >
                          Details
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Dialog Modal */}
      {/* Details Dialog Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedEvent && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto" onClick={() => setSelectedEvent(null)}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                {/* Decorative top gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200/40 dark:border-white/5 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Modal Header */}
                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-white/5 pb-5">
                  <StockLogo 
                    symbol={selectedEvent.symbol} 
                    className="h-14 w-14 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 bg-white object-contain shrink-0 shadow-sm"
                  />
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">{selectedEvent.company}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="rounded-xl bg-blue-500/10 dark:bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-blue-600 dark:text-cyan-400 border border-blue-500/10 dark:border-cyan-500/10 font-mono">{selectedEvent.symbol}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{selectedEvent.exchange} Exchange</span>
                    </div>
                  </div>
                </div>

                {/* Modal Grid Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <div className="bg-slate-50/50 dark:bg-white/[0.015] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider mb-0.5">Event Horizon</span>
                    <span className="text-[11px] sm:text-xs font-black text-slate-850 dark:text-white">{formatEventDate(selectedEvent.eventDate)}</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-white/[0.015] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider mb-0.5">Importance</span>
                    <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider ${
                      selectedEvent.importance === "High" ? "text-rose-500" : selectedEvent.importance === "Medium" ? "text-amber-500" : "text-emerald-500"
                    }`}>{selectedEvent.importance}</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-white/[0.015] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider mb-0.5">AI Expected Impact</span>
                    <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider ${
                      selectedEvent.expectedImpact === "Bullish" ? "text-emerald-500" : selectedEvent.expectedImpact === "Bearish" ? "text-rose-500" : "text-blue-500 dark:text-cyan-400"
                    }`}>{selectedEvent.expectedImpact}</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-white/[0.015] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider mb-0.5">AI Confidence</span>
                    <span className="text-[11px] sm:text-xs font-black text-purple-500">{selectedEvent.confidence}%</span>
                  </div>
                </div>

                {/* Event Body Description */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-slate-455" />
                      Overview Description
                    </h4>
                    <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed bg-slate-50 dark:bg-white/[0.01] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                      {selectedEvent.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                      AI Intelligence Summary
                    </h4>
                    <p className="text-xs md:text-sm text-slate-700 dark:text-slate-355 leading-relaxed bg-gradient-to-r from-cyan-500/[0.03] to-blue-500/[0.03] border border-cyan-500/10 p-4 rounded-2xl font-medium">
                      {selectedEvent.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider">Historical Market Reaction</h5>
                      <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/50 dark:border-white/5 text-xs text-slate-655 dark:text-slate-300 font-semibold leading-relaxed">
                        {selectedEvent.historicalReaction}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-wider">AI Recommendation & Strategy</h5>
                      <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/50 dark:border-white/5 text-xs text-slate-655 dark:text-slate-300 font-semibold leading-relaxed">
                        {selectedEvent.aiRecommendation}
                      </div>
                    </div>
                  </div>

                  {selectedEvent.thingsToWatch && selectedEvent.thingsToWatch.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">Key Metrics to Watch</h4>
                      <ul className="grid grid-cols-1 gap-2.5">
                        {selectedEvent.thingsToWatch.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/50 dark:border-white/5 p-3.5 rounded-2xl text-xs font-semibold hover:border-cyan-500/10 transition-colors">
                            <CircleDot className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700 dark:text-slate-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Additional detailed metrics placeholder blocks for Premium feeling */}
                  <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex flex-wrap justify-between items-center text-[10px] text-slate-450 gap-3">
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-slate-450" />
                      <span>Timezone: {selectedEvent.timezone || "UTC"} ({selectedEvent.timezoneShort || "UTC"})</span>
                    </div>
                    <a href={`https://finance.yahoo.com/quote/${selectedEvent.symbol}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-extrabold uppercase tracking-wider hover:underline transition-colors">
                      Official Source Link
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}

export default memo(UpcomingEventsSection);