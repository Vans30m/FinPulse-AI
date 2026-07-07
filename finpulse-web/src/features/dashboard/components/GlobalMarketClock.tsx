import { useEffect, useState, memo } from "react";
import { Clock, Globe, CheckCircle } from "lucide-react";

interface MarketClock {
  name: string;
  city: string;
  timeZone: string;
  openTime: string;  // HH:MM 24h
  closeTime: string; // HH:MM 24h
  lunchStart?: string;
  lunchEnd?: string;
}

const MARKETS_CONFIG: MarketClock[] = [
  { name: "NYSE / NASDAQ", city: "New York", timeZone: "America/New_York", openTime: "09:30", closeTime: "16:00" },
  { name: "NSE / BSE", city: "Mumbai", timeZone: "Asia/Kolkata", openTime: "09:15", closeTime: "15:30" },
  { name: "LSE", city: "London", timeZone: "Europe/London", openTime: "08:00", closeTime: "16:30" },
  { name: "TSE", city: "Tokyo", timeZone: "Asia/Tokyo", openTime: "09:00", closeTime: "15:00", lunchStart: "11:30", lunchEnd: "12:30" }
];

export const GlobalMarketClock = memo(function GlobalMarketClock() {
  const [, setTicks] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicks(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getMarketStatus = (config: MarketClock) => {
    try {
      // Get current time in target timezone
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: config.timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
      });

      const parts = formatter.formatToParts(new Date());
      const getVal = (type: string) => Number(parts.find(p => p.type === type)?.value);

      const year = getVal("year");
      const month = getVal("month") - 1;
      const day = getVal("day");
      const hour = getVal("hour");
      const minute = getVal("minute");

      const localDate = new Date(year, month, day, hour, minute);
      const dayOfWeek = localDate.getDay(); // 0 = Sunday, 6 = Saturday

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const [openH, openM] = config.openTime.split(":").map(Number);
      const [closeH, closeM] = config.closeTime.split(":").map(Number);

      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;
      const currentMinutes = hour * 60 + minute;

      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      // Check lunch break
      let isLunch = false;
      if (config.lunchStart && config.lunchEnd) {
        const [lStartH, lStartM] = config.lunchStart.split(":").map(Number);
        const [lEndH, lEndM] = config.lunchEnd.split(":").map(Number);
        const lunchStartMin = lStartH * 60 + lStartM;
        const lunchEndMin = lEndH * 60 + lEndM;
        isLunch = currentMinutes >= lunchStartMin && currentMinutes < lunchEndMin;
      }

      const isOpen = !isWeekend && currentMinutes >= openMinutes && currentMinutes < closeMinutes && !isLunch;

      // Calculate countdown progress & string
      let countdownStr = "";
      let progressPercent = 0;

      if (isWeekend) {
        countdownStr = "Weekend Closed";
      } else if (isLunch) {
        countdownStr = "Lunch Break";
      } else if (isOpen) {
        const remaining = closeMinutes - currentMinutes;
        const h = Math.floor(remaining / 60);
        const m = remaining % 60;
        countdownStr = `Closes in ${h > 0 ? `${h}h ` : ""}${m}m`;
        progressPercent = ((currentMinutes - openMinutes) / (closeMinutes - openMinutes)) * 100;
      } else {
        // Calculate opens in
        let diffMinutes = 0;
        if (currentMinutes < openMinutes) {
          diffMinutes = openMinutes - currentMinutes;
        } else {
          diffMinutes = (1440 - currentMinutes) + openMinutes;
        }
        const h = Math.floor(diffMinutes / 60);
        const m = diffMinutes % 60;
        countdownStr = `Opens in ${h > 0 ? `${h}h ` : ""}${m}m`;
      }

      return {
        timeStr,
        isOpen,
        isLunch,
        isWeekend,
        countdownStr,
        progressPercent
      };
    } catch (e) {
      return {
        timeStr: "--:--",
        isOpen: false,
        isLunch: false,
        isWeekend: false,
        countdownStr: "Unknown",
        progressPercent: 0
      };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg transition-all duration-500 hover:shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-indigo-500" />
            Global Market Clock
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Real-time exchange status</p>
        </div>
        <Clock className="h-4 w-4 text-slate-400 animate-pulse" />
      </div>

      <div className="space-y-3.5">
        {MARKETS_CONFIG.map((config) => {
          const status = getMarketStatus(config);
          
          // Flag Mapping
          const getMarketFlag = (city: string) => {
            if (city.includes("New York")) return "🇺🇸";
            if (city.includes("Mumbai")) return "🇮🇳";
            if (city.includes("London")) return "🇬🇧";
            if (city.includes("Tokyo")) return "🇯🇵";
            return "🌐";
          };

          return (
            <div 
              key={config.name} 
              className="p-3.5 rounded-xl border border-slate-200/40 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-850/35 transition-all duration-300 hover:border-indigo-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg leading-none mt-0.5 select-none" role="img" aria-label={config.city}>
                    {getMarketFlag(config.city)}
                  </span>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{config.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{config.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                        {status.timeStr}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                        ({config.openTime} - {config.closeTime})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Pulsing neon status dot */}
                    {status.isOpen ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    ) : status.isLunch ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    ) : (
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    )}

                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                      status.isOpen 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : status.isLunch
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {status.isOpen ? "Open" : status.isLunch ? "Lunch" : "Closed"}
                    </span>
                  </div>

                  <span className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {status.countdownStr}
                  </span>
                </div>
              </div>

              {/* Session Progress bar (only visible when open) */}
              {status.isOpen && (
                <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1 mt-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${status.progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-3.5 border-t border-slate-50 dark:border-slate-850 flex items-center justify-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
        <CheckCircle className="h-3 w-3 text-emerald-500" />
        Synced with local device time
      </div>
    </div>
  );
});
