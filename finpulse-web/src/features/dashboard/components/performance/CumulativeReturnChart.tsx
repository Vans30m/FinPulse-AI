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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !data || data.length === 0) return;

    const isDark = document.documentElement.classList.contains("dark");
    const textColorVal = isDark ? "#94a3b8" : "#64748b";
    const gridColorVal = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(30, 41, 59, 0.04)";

    // Initialize Chart
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: textColorVal,
        fontSize: 11,
        fontFamily: "JetBrains Mono, Menlo, monospace",
      },
      width: container.clientWidth,
      height,
      grid: {
        vertLines: { color: gridColorVal, style: LineStyle.Solid },
        horzLines: { color: gridColorVal, style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#64748b",
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: "#64748b",
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderVisible: false,
        autoScale: true,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // 1. Add Portfolio Area Series
    let portSeries: ISeriesApi<"Area"> | null = null;
    if (showPortfolio) {
      portSeries = chart.addAreaSeries({
        lineColor: "#3b82f6",
        topColor: "rgba(59, 130, 246, 0.18)",
        bottomColor: "rgba(59, 130, 246, 0.01)",
        lineWidth: 2,
        lineType: LineType.Curved,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const portData = data.map((d) => ({
        time: d.time,
        value: d.portfolioReturn,
      }));
      portSeries.setData(portData);
      portSeriesRef.current = portSeries;
    }

    // 2. Add Benchmark Line Series
    let benchSeries: ISeriesApi<"Line"> | null = null;
    if (showBenchmark) {
      benchSeries = chart.addLineSeries({
        color: "#f59e42",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        lineType: LineType.Curved,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const benchData = data.map((d) => ({
        time: d.time,
        value: d.benchmarkReturn,
      }));
      benchSeries.setData(benchData);
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
  }, [data, height, showPortfolio, showBenchmark]);

  return (
    <div className="space-y-4">
      {/* Legend & Hover Tooltip Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-500/[0.02] dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl p-4">
        {/* Dynamic Tooltip Data */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          {activeDate && (
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-400 dark:text-slate-500 uppercase">Date:</span>
              <span className="font-black text-slate-800 dark:text-slate-200">
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
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                <span className="font-extrabold text-slate-400 dark:text-slate-500 uppercase">Portfolio:</span>
                <span className="font-mono font-black text-blue-500">
                  {activePoint.portfolioReturn.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#f59e42]" />
                <span className="font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                  {benchmarkName}:
                </span>
                <span className="font-mono font-black text-[#f59e42]">
                  {activePoint.benchmarkReturn.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-white/10">
                <span className="font-extrabold text-slate-400 dark:text-slate-500 uppercase">Difference:</span>
                <span
                  className={`font-mono font-black ${
                    activePoint.difference >= 0 ? "text-emerald-400" : "text-rose-450"
                  }`}
                >
                  {activePoint.difference >= 0 ? "+" : ""}
                  {activePoint.difference.toFixed(2)}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Legend Interactive Toggles */}
        <div className="flex items-center gap-4 text-xs font-bold select-none">
          <label className="flex items-center gap-2 cursor-pointer text-slate-650 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white">
            <input
              type="checkbox"
              checked={showPortfolio}
              onChange={(e) => setShowPortfolio(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-800 text-blue-500 focus:ring-blue-500 h-3.5 w-3.5"
            />
            <span>Portfolio</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-650 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white">
            <input
              type="checkbox"
              checked={showBenchmark}
              onChange={(e) => setShowBenchmark(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-800 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
            />
            <span>{benchmarkName}</span>
          </label>
        </div>
      </div>

      {/* Lightweight Chart Container */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/40 dark:border-white/5 bg-[#121a2a]/10">
        <div ref={containerRef} className="w-full cursor-crosshair" />
      </div>
    </div>
  );
}
