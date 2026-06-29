import { 
  createChart, 
  ColorType, 
  CandlestickSeries, 
  HistogramSeries, 
  CrosshairMode, 
  LineStyle 
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { getStockCandles, getFundamentals, calculateAvgVolume, mergeDailyMetrics, type DailyMarketMetrics } from "../../services/marketService";

import { ChartHeader } from "./ChartHeader";
import { PriceInfoBar } from "./PriceInfoBar";
import { ChartToolbar } from "./ChartToolbar";
import { LoadingChart } from "./LoadingChart";
import TimeframeSelector from "./TimeframeSelector";

interface Props {
  symbol: string;
  timeframe: string;
  height?: number;
}

export default function CandlestickChart({
  symbol,
  timeframe: propTimeframe,
  height = 350,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  // Price Lines Array Reference to clear overlays during re-renders smoothly
  const addedPriceLinesRef = useRef<any[]>([]);

  // States
  const [currentTimeframe, setCurrentTimeframe] = useState<string>(propTimeframe || "1D");
  const [showTimeframes, setShowTimeframes] = useState<boolean>(false);
  const [hoveredCandle, setHoveredCandle] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [fundamentals, setFundamentals] = useState<any>(null);
  const [metrics, setMetrics] = useState<DailyMarketMetrics | null>(null);

  const [meta, setMeta] = useState({
    name: "Asset",
    exchange: "GLOBAL",
    price: 0,
    change: 0,
    changePercent: 0,
    marketState: "CLOSED",
    currency: "USD"
  });

  useEffect(() => {
    if (propTimeframe) {
      setCurrentTimeframe(propTimeframe);
    }
  }, [propTimeframe]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    setLoading(true);
    const historicalLogicalRange = chartRef.current?.timeScale().getVisibleLogicalRange();

    // Initialize Lightweight Chart Engine Core
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b", 
        fontSize: 11,
        fontFamily: "JetBrains Mono, Menlo, monospace",
      },
      width: container.clientWidth,
      height,
      grid: {
        vertLines: { color: "rgba(30, 41, 59, 0.04)", style: LineStyle.Solid },
        horzLines: { color: "rgba(30, 41, 59, 0.04)", style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#64748b",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1e293b",
        },
        horzLine: {
          color: "#64748b",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1e293b",
        },
      },
      rightPriceScale: {
        borderVisible: false,
        alignLabels: true,
        scaleMargins: {
          top: 0.1,    // Reserve upper breathing room
          bottom: 0.3, // Anchor price above the volume bar grid panels
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        shiftVisibleRangeOnNewBar: true,
        rightOffset: 12, 
        barSpacing: 6,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Create Candlestick Panel Layout Matrix
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    candleSeriesRef.current = candleSeries;

    // Create Volume Panels Histogram Layout Matrix
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume-pane", // Separate coordinate workspace pane ID
    });
    volumeSeriesRef.current = volumeSeries;

    // Isolate Volume Scaling Parameters directly to the bottom 22% of window
    chart.priceScale("volume-pane").applyOptions({
      borderVisible: false,
      scaleMargins: {
        top: 0.78,
        bottom: 0,
      },
    });

    // Crosshair Sync Handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.seriesData || !param.seriesData.size) {
        setHoveredCandle(null);
        return;
      }
      
      const candle = param.seriesData.get(candleSeries);
      const volData: any = param.seriesData.get(volumeSeries);

      if (candle) {
        setHoveredCandle({
          ...candle,
          volume: volData ? volData.value : undefined
        });
      }
    });

    const handleDoubleClickReset = () => {
      chart.timeScale().fitContent();
    };
    container.addEventListener("dblclick", handleDoubleClickReset);

    async function loadData() {
      try {
        const [data, fundamentalsResponse] = await Promise.all([
          getStockCandles(symbol, currentTimeframe),
          getFundamentals(symbol).catch(() => null)
        ]);

        if (fundamentalsResponse) {
          setFundamentals(fundamentalsResponse);
          setMeta({
            name: fundamentalsResponse.name || "Asset",
            exchange: fundamentalsResponse.marketState ? "GLOBAL" : "INDEX",
            price: fundamentalsResponse.price || 0,
            change: fundamentalsResponse.change || 0,
            changePercent: fundamentalsResponse.changePercent || 0,
            marketState: fundamentalsResponse.marketState || "CLOSED",
            currency: fundamentalsResponse.currency || "USD"
          });
        }

        if (!data?.quotes || !Array.isArray(data.quotes)) {
          console.error("No valid chart candle payload available:", data);
          return;
        }

        // Structural translation mapping parameters 
        const mappedCandles = data.quotes
          .filter((q: any) => q && q.date && q.open != null && q.high != null && q.low != null && q.close != null)
          .map((q: any) => ({
            time: Math.floor(new Date(q.date).getTime() / 1000) as any,
            open: Number(q.open),
            high: Number(q.high),
            low: Number(q.low),
            close: Number(q.close),
            volume: q.volume ? Number(q.volume) : 0
          }));

        if (!mappedCandles.length) return;

        // Set candles data
        candleSeries.setData(mappedCandles);

        // Generate green/red volume bars coloring properties dynamically
        const volumeBars = mappedCandles.map((c: any) => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "rgba(34, 197, 94, 0.45)" : "rgba(239, 68, 68, 0.45)"
        }));
        volumeSeries.setData(volumeBars);

        // Apply global market indicator structures
        if (fundamentalsResponse) {
          const computedMetrics = mergeDailyMetrics(mappedCandles, fundamentalsResponse);
          setMetrics(computedMetrics);

          // Purge active tracker lines cleanly
          addedPriceLinesRef.current.forEach(line => candleSeries.removePriceLine(line));
          addedPriceLinesRef.current = [];

          const appendTrackingLine = (price: number, color: string, style: any, title: string) => {
            if (!price) return;
            const line = candleSeries.createPriceLine({
              price,
              color,
              lineWidth: 1,
              lineStyle: style,
              axisLabelVisible: true,
              title,
            });
            addedPriceLinesRef.current.push(line);
          };

          // Append lines according to directives
          appendTrackingLine(computedMetrics.currentPrice, "#3b82f6", LineStyle.Solid, "LAST");
          appendTrackingLine(computedMetrics.previousClose, "#64748b", LineStyle.Dashed, "PREV CLOSE");
          appendTrackingLine(computedMetrics.dayHigh, "#22c55e", LineStyle.Dotted, "DAY HIGH");
          appendTrackingLine(computedMetrics.dayLow, "#ef4444", LineStyle.Dotted, "DAY LOW");
        }

        if (historicalLogicalRange) {
          chart.timeScale().setVisibleLogicalRange(historicalLogicalRange);
        } else {
          chart.timeScale().fitContent();
        }
      } catch (error) {
        console.error("Fatal exception during rendering execution pipeline:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length) return;
      chart.applyOptions({ width: entries[0].contentRect.width });
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("dblclick", handleDoubleClickReset);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [symbol, currentTimeframe, height]);

  const zoomIn = () => {
    const range = chartRef.current?.timeScale().getVisibleLogicalRange();
    if (!range) return;
    chartRef.current?.timeScale().setVisibleLogicalRange({ from: range.from + 4, to: range.to - 4 });
  };

  const zoomOut = () => {
    const range = chartRef.current?.timeScale().getVisibleLogicalRange();
    if (!range) return;
    chartRef.current?.timeScale().setVisibleLogicalRange({ from: range.from - 4, to: range.to + 4 });
  };

  return (
    <div className="w-full flex flex-col space-y-4 select-none">
      <ChartHeader
        name={meta.name}
        symbol={symbol}
        exchange={meta.exchange}
        price={meta.price}
        change={meta.change}
        changePercent={meta.changePercent}
        marketState={meta.marketState}
        currency={meta.currency}
      />

      <div>
        <ChartToolbar 
          onZoomIn={zoomIn} 
          onZoomOut={zoomOut} 
          onReset={() => chartRef.current?.timeScale().fitContent()} 
          showTimeframes={showTimeframes}
          onToggleTimeframes={() => setShowTimeframes(!showTimeframes)}
        />

        {showTimeframes && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <TimeframeSelector selected={currentTimeframe} onChange={setCurrentTimeframe} />
          </div>
        )}

        <PriceInfoBar
          hoveredData={hoveredCandle}
          fundamentals={fundamentals}
          metrics={metrics}
        />
      </div>

      <div className="relative w-full">
        {loading && <LoadingChart height={height} />}
        <div
          ref={chartContainerRef}
          className={`w-full cursor-crosshair transition-opacity duration-300 ease-out ${
            loading ? "opacity-0 absolute pointer-events-none" : "opacity-100"
          }`}
          style={{ height: `${height}px` }}
        />
      </div>
    </div>
  );
}