import { useEffect, useRef, memo } from "react";
import { Calendar } from "lucide-react";
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
      height: "800",
      locale: "en",
      importanceFilter: "-1,0,1",
      countryFilter: "us,eu,gb,jp,ch,ca,au,nz,in"
    });

    containerRef.current.appendChild(script);
  }, [theme]);

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm shadow-[0_8px_20px_-15px_rgba(15,23,42,0.3)]">
      <div className="tradingview-widget-container" ref={containerRef}>
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
}

const MemoizedTradingViewCalendar = memo(TradingViewCalendar);

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="
        rounded-3xl
        bg-gradient-to-br
        from-blue-600
        via-cyan-500
        to-teal-500
        p-8
        text-white
        shadow-xl
        "
      >
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-white/10">
            <Calendar className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">
              Economic Calendar
            </h1>
            <p className="mt-2 text-white/80">
              Real-time global macroeconomic announcements, inflation gauges, central bank speeches, and market-moving events.
            </p>
          </div>
        </div>
      </div>

      {/* Widget Container */}
      <MemoizedTradingViewCalendar />
    </div>
  );
}
