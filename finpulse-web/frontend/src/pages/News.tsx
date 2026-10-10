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
    <div className="p-4 rounded-lg border border-[#242424] bg-[#111111] h-[580px] overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#242424]">
        <div>
          <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wide">
            Economic Calendar
          </h2>
          <p className="text-[11px] text-[#A3A3A3] font-medium">Real-time TradingView Events Feed</p>
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
      <div className="flex items-center justify-between pb-4 border-b border-[#242424] pt-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F5F5F5] tracking-tight uppercase">
            Market News Feed
          </h1>
          <p className="text-xs text-[#A3A3A3] font-medium mt-1 max-w-xl hidden md:block">
            Dense real-time global coverage aggregated from financial networks & macroeconomic schedules.
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