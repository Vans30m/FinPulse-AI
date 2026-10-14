import { useEffect, useRef, useState, useMemo } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  LineType,
} from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import type { ProcessedChartPoint } from "../../../../utils/chartUtils";
import { useTheme } from "../../../../context/ThemeContext";

interface Props {
  data: ProcessedChartPoint[];
  benchmarkName: string;
  height?: number;
}

export default function CumulativeReturnChart({
  data,
  benchmarkName,
  height = 300,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const portSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const benchSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Series visibility state for Legend toggle
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [showBenchmark, setShowBenchmark] = useState(true);

  // Tooltip details on hover
  const [hoveredPoint, setHoveredPoint] = useState<ProcessedChartPoint | null>(null);
  const [hoveredDate, setHoveredDate] = useState<number | null>(null);

  // Get last point for default dashboard display when not hovering
  const lastPoint = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data[data.length - 1];
  }, [data]);

  const activePoint = hoveredPoint || lastPoint;
  const activeDate = hoveredDate || (lastPoint ? lastPoint.time : null);

  const formatAxisTick = (time: any) => {
    let timestamp = Number(time);

    if (typeof time === "object" && time !== null && "year" in time) {
      const day = Number((time as { day?: number }).day ?? 1);
      const month = Number((time as { month?: number }).month ?? 1);
      const year = Number((time as { year?: number }).year ?? 1970);
      timestamp = Date.UTC(year, month - 1, day) / 1000;
    }

    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !data || data.length === 0) return;

    const chartBg = isDark ? "#121212" : "#ffffff";
    const textColor = isDark ? "#a1a1aa" : "#64748b";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.05)";
    const crosshairColor = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.2)";
    const crosshairLabelBg = isDark ? "#27272a" : "#0f172a";

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: chartBg },
        textColor,
        fontSize: 11,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        attributionLogo: false,
      },
      width: container.clientWidth,
      height,
      grid: {
        vertLines: { color: gridColor, style: LineStyle.Solid },
        horzLines: { color: gridColor, style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: crosshairLabelBg,
        },
        horzLine: {
          color: crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: crosshairLabelBg,
        },
      },
      rightPriceScale: {
        borderVisible: false,
        autoScale: true,
        scaleMargins: { top: 0.1, bottom: 0.12 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 14,
        minBarSpacing: 6,
        fixLeftEdge: false,
        tickMarkFormatter: (time: any) => formatAxisTick(time),
      },
      localization: {
        locale: "en-US",
        priceFormatter: (val: number) => `${val.toFixed(2)}%`,
      },
    });

    chartRef.current = chart;

    // 1. Add Portfolio Area Series
    let portSeries: ISeriesApi<"Area"> | null = null;
    if (showPortfolio) {
      portSeries = chart.addAreaSeries({
        lineColor: isDark ? "#38bdf8" : "#0284c7",
        topColor: isDark ? "rgba(56, 189, 248, 0.22)" : "rgba(2, 132, 199, 0.18)",
        bottomColor: isDark ? "rgba(56, 189, 248, 0.01)" : "rgba(2, 132, 199, 0.00)",
        lineWidth: 2,
        lineType: LineType.Curved,
        priceLineVisible: false,
        lastValueVisible: true,
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => `${price.toFixed(2)}%`,
        },
      });
      const portData = data.map((d) => ({
        time: d.time,
        value: d.portfolioReturn,
      }));
      portSeries.setData(portData as any);
      portSeriesRef.current = portSeries;
    }

    // 2. Add Benchmark Line Series
    let benchSeries: ISeriesApi<"Line"> | null = null;
    if (showBenchmark) {
      benchSeries = chart.addLineSeries({
        color: isDark ? "#fbbf24" : "#d97706",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        lineType: LineType.Curved,
        priceLineVisible: false,
        lastValueVisible: true,
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => `${price.toFixed(2)}%`,
        },
      });
      const benchData = data.map((d) => ({
        time: d.time,
        value: d.benchmarkReturn,
      }));
      benchSeries.setData(benchData as any);
      benchSeriesRef.current = benchSeries;
    }

    chart.timeScale().fitContent();

    // 3. Hover Interaction Tooltip Handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData || param.seriesData.size === 0) {
        setHoveredPoint(null);
        setHoveredDate(null);
        return;
      }

      const timeVal = param.time as number;
      const point = data.find((d) => d.time === timeVal);
      if (point) {
        setHoveredPoint(point);
        setHoveredDate(timeVal);
      }
    });

    // 4. Resize Handling
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) return;
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, height, showPortfolio, showBenchmark, isDark]);

  return (
    <div className="space-y-3 w-full">
      {/* Subheader Toolbar & Point Inspector */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141416]/90 backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2.5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
          {activeDate && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 font-medium">
              <span className="text-slate-400 dark:text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Date</span>
              <span className="text-slate-800 dark:text-zinc-200 font-mono font-bold">
                {new Date(activeDate * 1000).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {activePoint && (
            <>
              <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/20 px-2 py-0.5 rounded-md shadow-xs">
                <span className="h-2 w-2 rounded-full bg-sky-500 dark:bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                <span className="text-slate-600 dark:text-zinc-400 text-[10px] uppercase font-bold">Portfolio:</span>
                <span className="font-mono font-black text-sky-600 dark:text-sky-400">{activePoint.portfolioReturn.toFixed(2)}%</span>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-md shadow-xs">
                <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                <span className="text-slate-600 dark:text-zinc-400 text-[10px] uppercase font-bold">{benchmarkName}:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">{activePoint.benchmarkReturn.toFixed(2)}%</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] px-2 py-0.5 rounded-md shadow-xs">
                <span className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase font-bold">Diff:</span>
                <span
                  className={`font-mono font-black ${
                    activePoint.difference >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {activePoint.difference >= 0 ? "+" : ""}
                  {activePoint.difference.toFixed(2)}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showPortfolio}
              onChange={(e) => setShowPortfolio(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-sky-500"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-500 dark:bg-sky-400 rounded-full inline-block" />
              Portfolio
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showBenchmark}
              onChange={(e) => setShowBenchmark(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-500 dark:bg-amber-400 rounded-full inline-block border-b border-dashed border-amber-500 dark:border-amber-400" />
              {benchmarkName}
            </span>
          </label>
        </div>
      </div>

      {/* Chart Canvas Card */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121212] shadow-xs">
        <div ref={containerRef} className="w-full cursor-crosshair" />
      </div>
    </div>
  );
}
