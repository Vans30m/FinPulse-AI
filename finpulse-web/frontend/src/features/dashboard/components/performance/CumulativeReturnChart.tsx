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

    const isDark = true;
    const textColorVal = "#9ca3af";
    const gridColorVal = "rgba(255, 255, 255, 0.06)";
    const chartBg = "#171717";

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#121212" },
        textColor: "#a1a1aa",
        fontSize: 11,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        attributionLogo: false,
      },
      width: container.clientWidth,
      height,
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)", style: LineStyle.Solid },
        horzLines: { color: "rgba(255, 255, 255, 0.04)", style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255, 255, 255, 0.25)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#27272a",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.25)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#27272a",
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
        lineColor: "#38bdf8",
        topColor: "rgba(56, 189, 248, 0.22)",
        bottomColor: "rgba(56, 189, 248, 0.01)",
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
        color: "#fbbf24",
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
  }, [data, height, showPortfolio, showBenchmark]);

  return (
    <div className="space-y-3 w-full">
      {/* Subheader Toolbar & Point Inspector */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#141416]/90 backdrop-blur-md px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
          {activeDate && (
            <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Date</span>
              <span className="text-zinc-200 font-mono">
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
              <div className="flex items-center gap-1.5 bg-sky-950/40 border border-sky-500/20 px-2 py-0.5 rounded-md">
                <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                <span className="text-zinc-400 text-[10px] uppercase font-semibold">Portfolio:</span>
                <span className="font-mono font-bold text-sky-400">{activePoint.portfolioReturn.toFixed(2)}%</span>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-950/30 border border-amber-500/20 px-2 py-0.5 rounded-md">
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                <span className="text-zinc-400 text-[10px] uppercase font-semibold">{benchmarkName}:</span>
                <span className="font-mono font-bold text-amber-400">{activePoint.benchmarkReturn.toFixed(2)}%</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-md">
                <span className="text-zinc-500 text-[10px] uppercase font-semibold">Diff:</span>
                <span
                  className={`font-mono font-bold ${
                    activePoint.difference >= 0 ? "text-emerald-400" : "text-rose-400"
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
        <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-semibold text-zinc-300">
          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showPortfolio}
              onChange={(e) => setShowPortfolio(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-800 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-sky-500"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-400 rounded-full inline-block" />
              Portfolio
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showBenchmark}
              onChange={(e) => setShowBenchmark(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-400 rounded-full inline-block border-b border-dashed border-amber-400" />
              {benchmarkName}
            </span>
          </label>
        </div>
      </div>

      {/* Chart Canvas Card */}
      <div className="relative w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#121212] p-2 shadow-inner">
        <div ref={containerRef} className="w-full cursor-crosshair min-h-[300px]" />
      </div>
    </div>
  );
}
