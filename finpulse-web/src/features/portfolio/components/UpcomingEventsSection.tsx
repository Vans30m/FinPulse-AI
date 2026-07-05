import { memo, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, ChevronRight, CircleDot, Clock3 } from "lucide-react";
import type { UpcomingPortfolioEvent } from "../data/portfolioPremiumSections";

interface Props {
  events: UpcomingPortfolioEvent[];
}

const filterChips = ["All", "Earnings", "Dividend", "Stock Split", "AGM", "IPO"] as const;

const toneClasses: Record<UpcomingPortfolioEvent["logoTone"], string> = {
  blue: "from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-cyan-400",
  emerald: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
  amber: "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400",
  rose: "from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-400",
  purple: "from-purple-500/20 to-violet-500/20 text-purple-600 dark:text-purple-400",
};

const impactClasses: Record<UpcomingPortfolioEvent["impact"], string> = {
  High: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/15",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15",
  Low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15",
};

function UpcomingEventsSection({ events }: Props) {
  const [activeFilter, setActiveFilter] = useState<(typeof filterChips)[number]>("All");

  const filteredEvents = useMemo(() => {
    if (activeFilter === "All") return events;
    return events.filter((event) => event.eventType === activeFilter);
  }, [activeFilter, events]);

  return (
    <section className="glass-panel p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] via-transparent to-slate-50/[0.03] pointer-events-none" />

      <div className="relative flex flex-col gap-1.5 mb-6">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.32em]">Upcoming Events</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Important portfolio-related events.</h2>
      </div>

      <div className="relative flex flex-wrap gap-2 mb-6">
        {filterChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setActiveFilter(chip)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${activeFilter === chip
                ? "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-cyan-400 shadow-sm"
                : "border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 hover:border-blue-500/15 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
          >
            {chip}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredEvents.map((event, index) => (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:border-blue-500/20 dark:hover:border-cyan-500/20 hover:shadow-[0_12px_30px_-15px_rgba(6,182,212,0.15)] flex flex-col justify-between min-h-[220px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-cyan-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative space-y-4 flex-1">
                {/* Header Row */}
                <div className="flex justify-between items-start gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${toneClasses[event.logoTone].split(" ").slice(0, 2).join(" ")} flex items-center justify-center border border-white/10 shadow-inner`}>
                      <span className={`text-xs font-black tracking-wide ${toneClasses[event.logoTone].split(" ").slice(2).join(" ")}`}>
                        {event.logoInitials}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-white line-clamp-1 leading-snug">{event.company}</h4>
                      <span className="rounded bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-slate-500 dark:text-slate-400">{event.symbol}</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${impactClasses[event.impact]}`}>
                    {event.impact}
                  </span>
                </div>

                {/* Event Description */}
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] mb-2">
                    <CalendarClock className="h-2.5 w-2.5" />
                    {event.eventType}
                  </span>
                  <p className="text-xs leading-relaxed text-slate-550 dark:text-slate-400 line-clamp-2">{event.description}</p>
                </div>
              </div>

              {/* Footer Row */}
              <div className="relative mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-3.5">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Date: <span className="font-black text-slate-700 dark:text-slate-250 font-mono">{event.eventDate}</span>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Details
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export default memo(UpcomingEventsSection);