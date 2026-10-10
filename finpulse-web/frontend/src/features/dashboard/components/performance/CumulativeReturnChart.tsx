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
        background: { type: ColorType.Solid, color: chartBg },
        textColor: textColorVal,
        fontSize: 11,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        attributionLogo: false,
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
          color: "rgba(148, 163, 184, 0.5)",
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: "rgba(148, 163, 184, 0.35)",
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderVisible: false,
        autoScale: true,
        scaleMargins: { top: 0.12, bottom: 0.18 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        barSpacing: 12,
        minBarSpacing: 6,
        fixLeftEdge: false,
        tickMarkFormatter: (time: any) => formatAxisTick(time),
      },
      localization: {
        locale: "en-US",
      },
    });

    chartRef.current = chart;

    // 1. Add Portfolio Area Series
    let portSeries: ISeriesApi<"Area"> | null = null;
    if (showPortfolio) {
      portSeries = chart.addAreaSeries({
        lineColor: "#60a5fa",
        topColor: "rgba(96, 165, 250, 0.12)",
        bottomColor: "rgba(96, 165, 250, 0.01)",
        lineWidth: 2,
        lineType: LineType.Curved,
        priceLineVisible: false,
        lastValueVisible: true,
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
        color: "#f5d372",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        lineType: LineType.Curved,
        priceLineVisible: false,
        lastValueVisible: true,
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
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-[#2a2a2a] bg-[#171717] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-[#8d8d8d]">
          {activeDate && (
            <div className="flex items-center gap-1.5">
              <span>Date:</span>
              <span className="text-[#d7d7d7]">
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
                <span className="h-2.5 w-2.5 rounded-full bg-[#5bb7ff]" />
                <span>Portfolio:</span>
                <span className="font-mono text-[#5bb7ff]">{activePoint.portfolioReturn.toFixed(2)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f5d372]" />
                <span>{benchmarkName}:</span>
                <span className="font-mono text-[#f5d372]">{activePoint.benchmarkReturn.toFixed(2)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Difference:</span>
                <span
                  className={`font-mono ${activePoint.difference >= 0 ? "text-[#70d7a2]" : "text-[#f08d8d]"}`}
                >
                  {activePoint.difference >= 0 ? "+" : ""}
                  {activePoint.difference.toFixed(2)}%
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.12em] text-[#d7d7d7]">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPortfolio}
              onChange={(e) => setShowPortfolio(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#3a3a3a] bg-[#1d1d1d] text-blue-500 focus:ring-blue-500"
            />
            <span>Portfolio</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showBenchmark}
              onChange={(e) => setShowBenchmark(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#3a3a3a] bg-[#1d1d1d] text-blue-500 focus:ring-blue-500"
            />
            <span>{benchmarkName}</span>
          </label>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#171717]">
        <div ref={containerRef} className="w-full cursor-crosshair" />
      </div>
    </div>
  );
}
