import { Newspaper, Calendar } from "lucide-react";
import { useEffect, useState, memo, useMemo, useRef } from "react";
import AlertsTimeline from "../features/dashboard/components/AlertsTimeline";
import { useTheme } from "../context/ThemeContext";

function TradingViewCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: theme === "dark" ? "dark" : "light",
      isTransparent: true,
      width: "100%",
      height: "490",
      locale: "en",
      importanceFilter: "-1,0,1",
      countryFilter: "us,eu,gb,jp,ch,ca,au,nz,in"
    });

    containerRef.current.appendChild(script);
  }, [theme]);

  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[580px] overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-150 dark:border-white/5 bg-gradient-to-r from-blue-50/20 to-transparent dark:from-white/[0.01]">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
            Economic Calendar
          </h2>
          <p className="text-[10px] text-slate-550 dark:text-slate-400 font-medium">Real-time TradingView Events Feed</p>
        </div>
      </div>
      
      <div className="tradingview-widget-container flex-1" ref={containerRef}>
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
}

const MemoizedTradingViewCalendar = memo(TradingViewCalendar);

export default function News() {
  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 px-4 py-6 md:px-6">

      {/* Real-time Header Row */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200/50 dark:border-white/5 pt-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            Market Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5 max-w-xl hidden md:block">
            Real-time global coverage aggregated from premium networks and macroeconomic schedules.
          </p>
        </div>
      </div>

      {/* Feed & Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2 h-full">
          <AlertsTimeline fullPage />
        </div>
        <div className="lg:col-span-1 h-full">
          <MemoizedTradingViewCalendar />
        </div>
      </div>

    </div>
  );
}