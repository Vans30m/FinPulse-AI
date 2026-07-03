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
          className="space-y-4"
        >
          {filteredEvents.map((event, index) => (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              whileHover={{ y: -3 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)] transition-all duration-300 hover:border-blue-500/20 dark:hover:border-cyan-500/20 hover:shadow-[0_18px_42px_-30px_rgba(6,182,212,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.03] via-transparent to-cyan-500/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br ${toneClasses[event.logoTone].split(" ").slice(0, 2).join(" ")} flex items-center justify-center border border-white/10 shadow-sm`}>
                    <span className={`text-sm font-black tracking-wide ${toneClasses[event.logoTone].split(" ").slice(2).join(" ")}`}>
                      {event.logoInitials}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{event.company}</h3>
                      <span className="rounded-full border border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] px-2 py-0.5 text-[10px] font-black tracking-wider text-slate-500 dark:text-slate-400">{event.symbol}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03]">
                        <CalendarClock className="h-3 w-3" />
                        {event.eventType}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">{event.description}</p>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${impactClasses[event.impact]}`}>
                    <CircleDot className="h-3 w-3" />
                    {event.impact} Impact
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Clock3 className="h-3 w-3" />
                    {event.countdown}
                  </span>
                </div>
              </div>

              <div className="relative mt-4 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Event date: <span className="font-bold text-slate-700 dark:text-slate-300">{event.eventDate}</span>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/20 dark:hover:border-cyan-500/20 hover:text-blue-600 dark:hover:text-cyan-400"
                >
                  View Event Details
                  <ChevronRight className="h-3.5 w-3.5" />
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