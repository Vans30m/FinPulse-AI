import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle
} from "lightweight-charts";
import { useEffect, useRef, useState, useCallback } from "react";
import { getStockCandles, getFundamentals, mergeDailyMetrics, type DailyMarketMetrics } from "../../services/marketService";

import { ChartHeader } from "./ChartHeader";
import { PriceInfoBar } from "./PriceInfoBar";
import { ChartToolbar } from "./ChartToolbar";
import { LoadingChart } from "./LoadingChart";
import TimeframeSelector from "./TimeframeSelector";

// Technical Indicator Calculations & Icons
import {
  calculateEMA,
  calculateSMA,
  calculateVWAP,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateATR,
} from "../../utils/indicators";
import { X } from "lucide-react";

interface Props {
  symbol?: string;
  timeframe?: string;
  height?: number;
  mini?: boolean;
  chartType?: "candlestick" | "line" | "area" | "multiline";
  customData?: { time: string | number; value: number }[];
  customMultiData?: { time: string | number;[key: string]: any }[];
  seriesKeys?: { key: string; color: string }[];
}

export default function CandlestickChart({
  symbol = "",
  timeframe: propTimeframe = "1D",
  height = 350,
  mini = false,
  chartType = "candlestick",
  customData,
  customMultiData,
  seriesKeys,
}: Props) {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  // Price Lines Array Reference to clear overlays during re-renders smoothly
  const addedPriceLinesRef = useRef<any[]>([]);

  // 1. Persistent Timeframe in LocalStorage
  const [currentTimeframe, setCurrentTimeframe] = useState<string>(() => {
    return localStorage.getItem("finpulse_chart_timeframe") || propTimeframe || "1D";
  });

  const handleTimeframeChange = (tf: string) => {
    setCurrentTimeframe(tf);
    localStorage.setItem("finpulse_chart_timeframe", tf);
  };

  // 2. Persistent Indicators in LocalStorage
  const [activeOverlays, setActiveOverlays] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("finpulse_active_overlays");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activePanes, setActivePanes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("finpulse_active_panes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("finpulse_active_overlays", JSON.stringify(activeOverlays));
  }, [activeOverlays]);

  useEffect(() => {
    localStorage.setItem("finpulse_active_panes", JSON.stringify(activePanes));
  }, [activePanes]);

  // 3. Persistent Settings in LocalStorage
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("finpulse_chart_settings");
      return saved ? JSON.parse(saved) : { gridVisible: true, lineThickness: 2 };
    } catch {
      return { gridVisible: true, lineThickness: 2 };
    }
  });

  useEffect(() => {
    localStorage.setItem("finpulse_chart_settings", JSON.stringify(settings));
  }, [settings]);

  // Dynamic Settings Application on existing chart instance
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      grid: {
        vertLines: { visible: settings.gridVisible },
        horzLines: { visible: settings.gridVisible }
      }
    });
  }, [settings.gridVisible]);

  // Watch theme class changes dynamically and apply layout/grid options instantly
  useEffect(() => {
    const applyThemeOptions = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const textColor = isDark ? "#94a3b8" : "#64748b";
      const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(30, 41, 59, 0.04)";

      chartRef.current?.applyOptions({
        layout: { textColor },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor }
        }
      });

      Object.keys(subChartsRef.current).forEach(pane => {
        subChartsRef.current[pane]?.applyOptions({
          layout: { textColor },
          grid: {
            vertLines: { color: gridColor },
            horzLines: { color: gridColor }
          }
        });
      });
    };

    // Run initial configuration sync
    applyThemeOptions();

    const observer = new MutationObserver(() => {
      applyThemeOptions();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });

    return () => observer.disconnect();
  }, []);

  // States
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

  // State hooks for indicators & historical candles
  const [candles, setCandles] = useState<any[]>([]);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Compare Symbol Overlay State
  const [compareSymbol, setCompareSymbol] = useState("");
  const [compareCandles, setCompareCandles] = useState<any[]>([]);

  // Ref container holding computed indicator data
  const indicatorDataRef = useRef<{
    ema20?: { time: number; value: number }[];
    ema50?: { time: number; value: number }[];
    ema200?: { time: number; value: number }[];
    sma?: { time: number; value: number }[];
    vwap?: { time: number; value: number }[];
    bb?: { time: number; middle: number; upper: number; lower: number }[];
    rsi?: { time: number; value: number }[];
    macd?: { time: number; macd: number; signal: number; histogram: number }[];
    stoch?: { time: number; k: number; d: number }[];
    atr?: { time: number; value: number }[];
  }>({});

  // Refs for indicators rendering series & sub-charts
  const overlaySeriesRef = useRef<{ [key: string]: any[] }>({});
  const subChartsRef = useRef<{ [key: string]: any }>({});
  const isSyncingCrosshairRef = useRef(false);

  const toggleOverlay = useCallback((overlay: string) => {
    setActiveOverlays(prev =>
      prev.includes(overlay) ? prev.filter(o => o !== overlay) : [...prev, overlay]
    );
  }, []);

  const togglePane = useCallback((pane: string) => {
    setActivePanes(prev =>
      prev.includes(pane) ? prev.filter(p => p !== pane) : [...prev, pane]
    );
  }, []);

  const clearAllIndicators = useCallback(() => {
    setActiveOverlays([]);
    setActivePanes([]);
  }, []);

  // Fullscreen toggle handler
  const handleToggleFullscreen = useCallback(() => {
    const wrapper = chartWrapperRef.current;
    if (!wrapper) return;

    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error entering fullscreen mode:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Export Screenshot handler
  const handleTakeScreenshot = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const canvas = chart.takeScreenshot();
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${symbol || compareSymbol || "chart"}_screenshot.png`;
    link.href = dataUrl;
    link.click();
  }, [symbol, compareSymbol]);

  // Load Compare candles
  useEffect(() => {
    if (!compareSymbol || !symbol) {
      setCompareCandles([]);
      return;
    }
    async function loadCompareData() {
      try {
        const res = await getStockCandles(compareSymbol, currentTimeframe);
        if (res?.quotes && Array.isArray(res.quotes)) {
          const mapped = res.quotes
            .filter((q: any) => q && q.date && q.close != null)
            .map((q: any) => ({
              time: Math.floor(new Date(q.date).getTime() / 1000) as any,
              value: Number(q.close)
            }));
          setCompareCandles(mapped);
        }
      } catch (err) {
        console.error("Failed to load compare candles:", err);
      }
    }
    loadCompareData();
  }, [compareSymbol, currentTimeframe, symbol]);

  useEffect(() => {
    if (propTimeframe) {
      setCurrentTimeframe(propTimeframe);
    }
  }, [propTimeframe]);

  // Main Effect: Fetch Candle Data & Build Main Candlestick Chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    setLoading(true);

    const isMini = !!mini;
    const activeChartType = chartType || "candlestick";
    const isDark = document.documentElement.classList.contains("dark");
    const textColorVal = isMini ? "transparent" : (isDark ? "#94a3b8" : "#64748b");
    const gridColorVal = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(30, 41, 59, 0.04)";

    // Initialize Lightweight Chart Engine Core
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: textColorVal,
        fontSize: isMini ? 0 : 11,
        fontFamily: "JetBrains Mono, Menlo, monospace",
      },
      width: container.clientWidth,
      height,
      grid: {
        vertLines: { visible: !isMini && settings.gridVisible, color: gridColorVal, style: LineStyle.Solid },
        horzLines: { visible: !isMini && settings.gridVisible, color: gridColorVal, style: LineStyle.Solid },
      },
      crosshair: {
        mode: isMini ? CrosshairMode.Hidden : CrosshairMode.Normal,
        vertLine: {
          visible: !isMini,
          color: "#64748b",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1e293b",
        },
        horzLine: {
          visible: !isMini,
          color: "#64748b",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1e293b",
        },
      },
      rightPriceScale: {
        visible: !isMini,
        borderVisible: false,
        alignLabels: true,
        scaleMargins: isMini
          ? { top: 0.1, bottom: 0.1 }
          : {
            top: 0.1,    // Reserve upper breathing room
            bottom: 0.3, // Anchor price above the volume bar grid panels
          },
      },
      timeScale: {
        visible: !isMini,
        borderVisible: false,
        timeVisible: !isMini,
        secondsVisible: false,
        shiftVisibleRangeOnNewBar: true,
        rightOffset: isMini ? 0 : 12,
        barSpacing: isMini ? 4 : 6,
      },
      handleScroll: isMini ? false : { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: isMini ? false : { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    let mainSeries: any = null;

    if (activeChartType === "candlestick") {
      // Create Candlestick Panel Layout Matrix
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      candleSeriesRef.current = candleSeries;
      mainSeries = candleSeries;

      // Create Volume Panels Histogram Layout Matrix
      const volumeSeries = chart.addHistogramSeries({
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
    } else if (activeChartType === "area") {
      const areaSeries = chart.addAreaSeries({
        lineColor: "#3b82f6",
        topColor: "rgba(59, 130, 246, 0.25)",
        bottomColor: "rgba(59, 130, 246, 0.01)",
        lineWidth: settings.lineThickness || 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      mainSeries = areaSeries;
    } else if (activeChartType === "line") {
      const lineSeries = chart.addLineSeries({
        color: "#3b82f6",
        lineWidth: settings.lineThickness || 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      mainSeries = lineSeries;
    }

    // Crosshair Sync Handler
    chart.subscribeCrosshairMove((param) => {
      if (isSyncingCrosshairRef.current) return;
      isSyncingCrosshairRef.current = true;

      if (!param.seriesData || !param.seriesData.size) {
        setHoveredCandle(null);
        setHoveredTime(null);
        // Clear sub charts crosshairs
        Object.keys(subChartsRef.current).forEach(pane => {
          subChartsRef.current[pane]?.clearCrosshairPosition();
        });
        isSyncingCrosshairRef.current = false;
        return;
      }

      const time = param.time;
      setHoveredTime(time as number | null);

      if (activeChartType === "candlestick" && candleSeriesRef.current && volumeSeriesRef.current) {
        const candle = param.seriesData.get(candleSeriesRef.current);
        const volData: any = param.seriesData.get(volumeSeriesRef.current);

        if (candle) {
          setHoveredCandle({
            ...candle,
            volume: volData ? volData.value : undefined
          });
        }
      } else if (mainSeries) {
        const data = param.seriesData.get(mainSeries);
        if (data) {
          setHoveredCandle({
            close: (data as any).value ?? (data as any).close,
            open: (data as any).open ?? (data as any).value,
            high: (data as any).high ?? (data as any).value,
            low: (data as any).low ?? (data as any).value,
            volume: 0,
          });
        }
      }

      // Sync sub charts crosshair
      Object.keys(subChartsRef.current).forEach(pane => {
        const subChart = subChartsRef.current[pane];
        if (!subChart) return;

        if (time) {
          let price = 0;
          if (pane === "RSI" && indicatorDataRef.current.rsi) {
            price = indicatorDataRef.current.rsi.find(d => d.time === time)?.value ?? 50;
          } else if (pane === "MACD" && indicatorDataRef.current.macd) {
            price = indicatorDataRef.current.macd.find(d => d.time === time)?.macd ?? 0;
          } else if (pane === "Stochastic" && indicatorDataRef.current.stoch) {
            price = indicatorDataRef.current.stoch.find(d => d.time === time)?.k ?? 50;
          } else if (pane === "ATR" && indicatorDataRef.current.atr) {
            price = indicatorDataRef.current.atr.find(d => d.time === time)?.value ?? 0;
          }
          subChart.setCrosshairPosition(price, time, null as any);
        } else {
          subChart.clearCrosshairPosition();
        }
      });

      isSyncingCrosshairRef.current = false;
    });

    // 4. Save Zoom Range (logical range) persistent in LocalStorage
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (!range || !symbol || isMini) return;
      localStorage.setItem(`finpulse_zoom_${symbol}_${currentTimeframe}`, JSON.stringify(range));
    });

    const handleDoubleClickReset = () => {
      chart.timeScale().fitContent();
    };
    container.addEventListener("dblclick", handleDoubleClickReset);

    async function loadData() {
      // 1. Handle custom single series rendering
      if (customData) {
        if (mainSeries) {
          mainSeries.setData(customData as any);
        }
        chart.timeScale().fitContent();
        setLoading(false);
        return;
      }

      // 2. Handle custom multiline comparison rendering
      if (customMultiData && seriesKeys) {
        seriesKeys.forEach(sKey => {
          const lineSeries = chart.addLineSeries({
            color: sKey.color,
            lineWidth: settings.lineThickness || 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          const seriesData = customMultiData.map(d => ({
            time: d.time,
            value: Number(d[sKey.key])
          }));
          lineSeries.setData(seriesData as any);
        });
        chart.timeScale().fitContent();
        setLoading(false);
        return;
      }

      // 3. Fallback/Standard Candle Loader from APIs
      if (!symbol) {
        setLoading(false);
        return;
      }

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
        if (candleSeriesRef.current) {
          candleSeriesRef.current.setData(mappedCandles);
        }
        setCandles(mappedCandles);

        // Precompute Technical Indicators Client-Side
        indicatorDataRef.current = {
          ema20: calculateEMA(mappedCandles, 20),
          ema50: calculateEMA(mappedCandles, 50),
          ema200: calculateEMA(mappedCandles, 200),
          sma: calculateSMA(mappedCandles, 20),
          vwap: calculateVWAP(mappedCandles),
          bb: calculateBollingerBands(mappedCandles, 20, 2),
          rsi: calculateRSI(mappedCandles, 14),
          macd: calculateMACD(mappedCandles),
          stoch: calculateStochastic(mappedCandles),
          atr: calculateATR(mappedCandles)
        };

        // Generate green/red volume bars coloring properties dynamically
        if (volumeSeriesRef.current) {
          const volumeBars = mappedCandles.map((c: any) => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? "rgba(34, 197, 94, 0.45)" : "rgba(239, 68, 68, 0.45)"
          }));
          volumeSeriesRef.current.setData(volumeBars);
        }

        // Apply global market indicator structures
        if (fundamentalsResponse && candleSeriesRef.current) {
          const computedMetrics = mergeDailyMetrics(mappedCandles, fundamentalsResponse);
          setMetrics(computedMetrics);

          // Purge active tracker lines cleanly
          addedPriceLinesRef.current.forEach(line => candleSeriesRef.current.removePriceLine(line));
          addedPriceLinesRef.current = [];

          const appendTrackingLine = (price: number, color: string, style: any, title: string) => {
            if (!price) return;
            const line = candleSeriesRef.current.createPriceLine({
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

        // Re-apply Persistent Zoom logical range if saved in LocalStorage
        const savedZoomRange = localStorage.getItem(`finpulse_zoom_${symbol}_${currentTimeframe}`);
        if (savedZoomRange && !isMini) {
          try {
            chart.timeScale().setVisibleLogicalRange(JSON.parse(savedZoomRange));
          } catch {
            chart.timeScale().fitContent();
          }
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
  }, [symbol, currentTimeframe, height, customData, customMultiData, seriesKeys, mini, chartType, settings.lineThickness]);

  // Effect: Render main chart overlay indicators (EMA, SMA, VWAP, Bollinger Bands) & Comparison line
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candles.length) return;

    // Remove existing overlay lines
    Object.keys(overlaySeriesRef.current).forEach(key => {
      overlaySeriesRef.current[key].forEach(series => {
        try {
          chart.removeSeries(series);
        } catch (e) {
          console.error("Failed to remove series", e);
        }
      });
      delete overlaySeriesRef.current[key];
    });

    const addLineOverlay = (key: string, lineData: { time: number; value: number }[], color: string, style?: any) => {
      if (!lineData.length) return;
      const lineSeries = chart.addLineSeries({
        color,
        lineWidth: settings.lineThickness || 2,
        lineStyle: style ?? LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      lineSeries.setData(lineData as any);
      overlaySeriesRef.current[key] = [lineSeries];
    };

    // Draw indicators overlays if standard candle chart
    if (candleSeries) {
      if (activeOverlays.includes("EMA 20") && indicatorDataRef.current.ema20) {
        addLineOverlay("EMA 20", indicatorDataRef.current.ema20, "#3b82f6");
      }
      if (activeOverlays.includes("EMA 50") && indicatorDataRef.current.ema50) {
        addLineOverlay("EMA 50", indicatorDataRef.current.ema50, "#10b981");
      }
      if (activeOverlays.includes("EMA 200") && indicatorDataRef.current.ema200) {
        addLineOverlay("EMA 200", indicatorDataRef.current.ema200, "#ef4444");
      }
      if (activeOverlays.includes("SMA") && indicatorDataRef.current.sma) {
        addLineOverlay("SMA", indicatorDataRef.current.sma, "#a855f7");
      }
      if (activeOverlays.includes("VWAP") && indicatorDataRef.current.vwap) {
        addLineOverlay("VWAP", indicatorDataRef.current.vwap, "#f59e0b");
      }
      if (activeOverlays.includes("Bollinger Bands") && indicatorDataRef.current.bb) {
        const bbData = indicatorDataRef.current.bb;
        const basisData = bbData.map(d => ({ time: d.time, value: d.middle }));
        const upperData = bbData.map(d => ({ time: d.time, value: d.upper }));
        const lowerData = bbData.map(d => ({ time: d.time, value: d.lower }));

        const basisSeries = chart.addLineSeries({
          color: "#f59e0b",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        const upperSeries = chart.addLineSeries({
          color: "#6366f1",
          lineWidth: settings.lineThickness || 2,
          lineStyle: LineStyle.Solid,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        const lowerSeries = chart.addLineSeries({
          color: "#6366f1",
          lineWidth: settings.lineThickness || 2,
          lineStyle: LineStyle.Solid,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        basisSeries.setData(basisData);
        upperSeries.setData(upperData);
        lowerSeries.setData(lowerData);

        overlaySeriesRef.current["Bollinger Bands"] = [basisSeries, upperSeries, lowerSeries];
      }
    }

    // 5. Render Comparison symbol overlay line
    if (compareSymbol && compareCandles.length > 0) {
      const compareSeries = chart.addLineSeries({
        color: "#ec4899",
        lineWidth: settings.lineThickness || 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: compareSymbol,
      });
      compareSeries.setData(compareCandles as any);
      overlaySeriesRef.current["comparison"] = [compareSeries];
    }
  }, [activeOverlays, candles, loading, compareSymbol, compareCandles, settings.lineThickness]);

  // Effect: Render separate sub-panes (RSI, MACD, Stochastic, ATR)
  useEffect(() => {
    if (loading || !candles.length) return;

    // Destroy existing sub-charts
    Object.keys(subChartsRef.current).forEach(key => {
      try {
        subChartsRef.current[key].remove();
      } catch (e) {
        console.error("Error removing sub-chart", e);
      }
      delete subChartsRef.current[key];
    });

    const mainChart = chartRef.current;
    if (!mainChart) return;

    activePanes.forEach(pane => {
      const containerId = `pane-container-${pane}`;
      const containerEl = document.getElementById(containerId);
      if (!containerEl) return;

      const isDark = document.documentElement.classList.contains("dark");
      const textColorVal = isDark ? "#94a3b8" : "#64748b";
      const gridColorVal = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(30, 41, 59, 0.04)";

      // Create sub-chart pane
      const paneChart = createChart(containerEl, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: textColorVal,
          fontSize: 10,
          fontFamily: "JetBrains Mono, Menlo, monospace",
        },
        width: containerEl.clientWidth,
        height: 120,
        grid: {
          vertLines: { visible: settings.gridVisible, color: gridColorVal, style: LineStyle.Solid },
          horzLines: { visible: settings.gridVisible, color: gridColorVal, style: LineStyle.Solid },
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
            top: 0.15,
            bottom: 0.15,
          },
        },
        timeScale: {
          visible: false,
          borderVisible: false,
        },
        handleScroll: false,
        handleScale: false,
      });

      subChartsRef.current[pane] = paneChart;

      // Render respective series
      if (pane === "RSI" && indicatorDataRef.current.rsi) {
        const rsiSeries = paneChart.addLineSeries({
          color: "#8b5cf6",
          lineWidth: settings.lineThickness || 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        rsiSeries.setData(indicatorDataRef.current.rsi as any);

        // Standard OB/OS levels
        rsiSeries.createPriceLine({
          price: 70,
          color: "rgba(239, 68, 68, 0.3)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
        });
        rsiSeries.createPriceLine({
          price: 30,
          color: "rgba(34, 197, 94, 0.3)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
        });
      } else if (pane === "MACD" && indicatorDataRef.current.macd) {
        const macdData = indicatorDataRef.current.macd;

        const macdLineSeries = paneChart.addLineSeries({
          color: "#2563eb",
          lineWidth: settings.lineThickness || 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        macdLineSeries.setData(macdData.map(d => ({ time: d.time, value: d.macd })) as any);

        const signalLineSeries = paneChart.addLineSeries({
          color: "#ea580c",
          lineWidth: settings.lineThickness || 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        signalLineSeries.setData(macdData.map(d => ({ time: d.time, value: d.signal })) as any);

        const histSeries = paneChart.addHistogramSeries({
          priceFormat: { type: "volume" },
          priceScaleId: "macd-hist",
        });

        paneChart.priceScale("macd-hist").applyOptions({
          borderVisible: false,
          scaleMargins: { top: 0.2, bottom: 0.2 },
        });

        histSeries.setData(macdData.map(d => ({
          time: d.time,
          value: d.histogram,
          color: d.histogram >= 0 ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"
        })) as any);
      } else if (pane === "Stochastic" && indicatorDataRef.current.stoch) {
        const stochData = indicatorDataRef.current.stoch;

        const kSeries = paneChart.addLineSeries({
          color: "#2563eb",
          lineWidth: settings.lineThickness || 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        kSeries.setData(stochData.map(d => ({ time: d.time, value: d.k })) as any);

        const dSeries = paneChart.addLineSeries({
          color: "#ea580c",
          lineWidth: settings.lineThickness || 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        dSeries.setData(stochData.map(d => ({ time: d.time, value: d.d })) as any);

        kSeries.createPriceLine({
          price: 80,
          color: "rgba(239, 68, 68, 0.3)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
        });
        kSeries.createPriceLine({
          price: 20,
          color: "rgba(34, 197, 94, 0.3)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
        });
      } else if (pane === "ATR" && indicatorDataRef.current.atr) {
        const atrSeries = paneChart.addLineSeries({
          color: "#ec4899",
          lineWidth: settings.lineThickness || 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        atrSeries.setData(indicatorDataRef.current.atr as any);
      }

      // Time scale syncing
      const mainTimeScale = mainChart.timeScale();
      const paneTimeScale = paneChart.timeScale();

      const currentRange = mainTimeScale.getVisibleLogicalRange();
      if (currentRange) {
        paneTimeScale.setVisibleLogicalRange(currentRange);
      }

      let isSyncing = false;

      const mainListener = (range: any) => {
        if (isSyncing || !range) return;
        isSyncing = true;
        paneTimeScale.setVisibleLogicalRange(range);
        isSyncing = false;
      };

      const paneListener = (range: any) => {
        if (isSyncing || !range) return;
        isSyncing = true;
        mainTimeScale.setVisibleLogicalRange(range);
        isSyncing = false;
      };

      mainTimeScale.subscribeVisibleLogicalRangeChange(mainListener);
      paneTimeScale.subscribeVisibleLogicalRangeChange(paneListener);

      // Bidirectional Crosshair Syncing
      paneChart.subscribeCrosshairMove((param) => {
        if (isSyncingCrosshairRef.current) return;
        isSyncingCrosshairRef.current = true;

        const time = param.time;
        setHoveredTime(time as number | null);

        if (time) {
          const mainCandle = candles.find(c => c.time === time);
          if (mainCandle && candleSeriesRef.current) {
            mainChart.setCrosshairPosition(mainCandle.close, time, candleSeriesRef.current);
          }
        } else {
          mainChart.clearCrosshairPosition();
        }

        // Sync other sub-charts
        Object.keys(subChartsRef.current).forEach(otherPane => {
          if (otherPane === pane) return;
          const otherChart = subChartsRef.current[otherPane];
          if (!otherChart) return;

          if (time) {
            let otherPrice = 0;
            if (otherPane === "RSI" && indicatorDataRef.current.rsi) {
              otherPrice = indicatorDataRef.current.rsi.find(d => d.time === time)?.value ?? 50;
            } else if (otherPane === "MACD" && indicatorDataRef.current.macd) {
              otherPrice = indicatorDataRef.current.macd.find(d => d.time === time)?.macd ?? 0;
            } else if (otherPane === "Stochastic" && indicatorDataRef.current.stoch) {
              otherPrice = indicatorDataRef.current.stoch.find(d => d.time === time)?.k ?? 50;
            } else if (otherPane === "ATR" && indicatorDataRef.current.atr) {
              otherPrice = indicatorDataRef.current.atr.find(d => d.time === time)?.value ?? 0;
            }
            otherChart.setCrosshairPosition(otherPrice, time, null as any);
          } else {
            otherChart.clearCrosshairPosition();
          }
        });

        isSyncingCrosshairRef.current = false;
      });

      (paneChart as any)._cleanupSync = () => {
        mainTimeScale.unsubscribeVisibleLogicalRangeChange(mainListener);
        paneTimeScale.unsubscribeVisibleLogicalRangeChange(paneListener);
      };
    });

    const resizeObserver = new ResizeObserver(() => {
      const container = chartContainerRef.current;
      if (!container) return;

      activePanes.forEach(pane => {
        const paneChart = subChartsRef.current[pane];
        if (paneChart) {
          paneChart.applyOptions({ width: container.clientWidth });
        }
      });
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      activePanes.forEach(pane => {
        const paneChart = subChartsRef.current[pane];
        if (paneChart) {
          if (paneChart._cleanupSync) {
            paneChart._cleanupSync();
          }
          paneChart.remove();
        }
      });
      subChartsRef.current = {};
    };
  }, [activePanes, candles, loading, settings.gridVisible, settings.lineThickness]);

  const zoomIn = useCallback(() => {
    const range = chartRef.current?.timeScale().getVisibleLogicalRange();
    if (!range) return;
    chartRef.current?.timeScale().setVisibleLogicalRange({ from: range.from + 4, to: range.to - 4 });
  }, []);

  const zoomOut = useCallback(() => {
    const range = chartRef.current?.timeScale().getVisibleLogicalRange();
    if (!range) return;
    chartRef.current?.timeScale().setVisibleLogicalRange({ from: range.from - 4, to: range.to + 4 });
  }, []);

  const isMini = !!mini;
  const hasSymbol = !!symbol;

  if (isMini) {
    return (
      <div className="relative w-full h-full">
        {loading && <LoadingChart height={height} />}
        <div
          ref={chartContainerRef}
          className={`w-full h-full cursor-crosshair transition-opacity duration-300 ease-out ${loading ? "opacity-0 absolute pointer-events-none" : "opacity-100"
            }`}
          style={{ height: `${height}px` }}
        />
      </div>
    );
  }

  return (
    <div
      ref={chartWrapperRef}
      className={`w-full flex flex-col select-none transition-all duration-300 ${isFullscreen
          ? "bg-slate-900 dark:bg-night-950 p-6 overflow-y-auto fixed inset-0 z-[99] h-full w-full"
          : "space-y-4"
        }`}
    >
      {hasSymbol && (
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
      )}

      <div>
        {hasSymbol ? (
          <ChartToolbar
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={() => chartRef.current?.timeScale().fitContent()}
            showTimeframes={showTimeframes}
            onToggleTimeframes={() => setShowTimeframes(!showTimeframes)}
            activeOverlays={activeOverlays}
            activePanes={activePanes}
            onToggleOverlay={toggleOverlay}
            onTogglePane={togglePane}
            onClearAll={clearAllIndicators}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            onTakeScreenshot={handleTakeScreenshot}
            compareSymbol={compareSymbol}
            onCompareSymbol={setCompareSymbol}
            settings={settings}
            onSettingsChange={setSettings}
          />
        ) : (
          <div className="flex justify-end gap-1.5 mb-2">
            <button onClick={zoomIn} title="Zoom In" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all text-xs font-bold leading-none w-8 h-8 flex items-center justify-center">
              +
            </button>
            <button onClick={zoomOut} title="Zoom Out" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all text-xs font-bold leading-none w-8 h-8 flex items-center justify-center">
              -
            </button>
            <button onClick={() => chartRef.current?.timeScale().fitContent()} title="Reset Zoom" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all text-xs font-bold px-3 h-8 flex items-center justify-center">
              Reset
            </button>
          </div>
        )}

        {showTimeframes && hasSymbol && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <TimeframeSelector selected={currentTimeframe} onChange={handleTimeframeChange} />
          </div>
        )}

        {hasSymbol && fundamentals && metrics && (
          <PriceInfoBar
            hoveredData={hoveredCandle}
            fundamentals={fundamentals}
            metrics={metrics}
          />
        )}

        {/* Hovered Overlays Badge Row */}
        {!loading && hasSymbol && activeOverlays.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 px-3 bg-blue-50/20 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5 font-mono text-[11px] mb-4">
            <span className="font-bold text-slate-400 dark:text-slate-500 select-none">INDICATORS:</span>
            {activeOverlays.map(ov => {
              const time = hoveredTime || (candles.length > 0 ? candles[candles.length - 1].time : null);
              if (!time) return null;

              let valStr = "N/A";
              if (ov === "EMA 20" && indicatorDataRef.current.ema20) {
                const item = indicatorDataRef.current.ema20.find(d => d.time === time);
                if (item) valStr = item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              } else if (ov === "EMA 50" && indicatorDataRef.current.ema50) {
                const item = indicatorDataRef.current.ema50.find(d => d.time === time);
                if (item) valStr = item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              } else if (ov === "EMA 200" && indicatorDataRef.current.ema200) {
                const item = indicatorDataRef.current.ema200.find(d => d.time === time);
                if (item) valStr = item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              } else if (ov === "SMA" && indicatorDataRef.current.sma) {
                const item = indicatorDataRef.current.sma.find(d => d.time === time);
                if (item) valStr = item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              } else if (ov === "VWAP" && indicatorDataRef.current.vwap) {
                const item = indicatorDataRef.current.vwap.find(d => d.time === time);
                if (item) valStr = item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              } else if (ov === "Bollinger Bands" && indicatorDataRef.current.bb) {
                const item = indicatorDataRef.current.bb.find(d => d.time === time);
                if (item) valStr = `Basis:${item.middle.toFixed(2)} Upper:${item.upper.toFixed(2)} Lower:${item.lower.toFixed(2)}`;
              }

              let colorClass = "text-blue-500";
              if (ov === "EMA 50") colorClass = "text-emerald-500";
              if (ov === "EMA 200") colorClass = "text-rose-500";
              if (ov === "SMA") colorClass = "text-purple-500";
              if (ov === "VWAP") colorClass = "text-amber-500";
              if (ov === "Bollinger Bands") colorClass = "text-indigo-500";

              return (
                <div key={ov} className="flex items-center gap-1">
                  <span className="font-extrabold text-slate-400 dark:text-slate-500">{ov}:</span>
                  <span className={`font-black ${colorClass}`}>{valStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative w-full">
        {loading && <LoadingChart height={height} />}
        <div
          ref={chartContainerRef}
          className={`w-full cursor-crosshair transition-opacity duration-300 ease-out ${loading ? "opacity-0 absolute pointer-events-none" : "opacity-100"
            }`}
          style={{ height: `${height}px` }}
        />
      </div>

      {/* Synced Indicator Panes */}
      {!loading && hasSymbol && activePanes.map(pane => (
        <div key={pane} className="relative w-full border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-white/[0.01] p-2">
          <div className="absolute top-2 left-3 z-20 flex items-center justify-between w-[95%] pointer-events-none">
            <span className="text-[10px] font-black tracking-wider uppercase font-mono text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 shadow-sm">
              {pane === "RSI" && (() => {
                const time = hoveredTime || (candles.length > 0 ? candles[candles.length - 1].time : null);
                const item = time ? indicatorDataRef.current.rsi?.find(d => d.time === time) : null;
                return `RSI (14): ${item ? item.value.toFixed(2) : "N/A"}`;
              })()}
              {pane === "MACD" && (() => {
                const time = hoveredTime || (candles.length > 0 ? candles[candles.length - 1].time : null);
                const item = time ? indicatorDataRef.current.macd?.find(d => d.time === time) : null;
                return `MACD (12, 26, 9): ${item ? `MACD: ${item.macd.toFixed(2)}  Signal: ${item.signal.toFixed(2)}  Hist: ${item.histogram.toFixed(2)}` : "N/A"}`;
              })()}
              {pane === "Stochastic" && (() => {
                const time = hoveredTime || (candles.length > 0 ? candles[candles.length - 1].time : null);
                const item = time ? indicatorDataRef.current.stoch?.find(d => d.time === time) : null;
                return `Stochastic (14, 3, 3): ${item ? `%K: ${item.k.toFixed(2)}  %D: ${item.d.toFixed(2)}` : "N/A"}`;
              })()}
              {pane === "ATR" && (() => {
                const time = hoveredTime || (candles.length > 0 ? candles[candles.length - 1].time : null);
                const item = time ? indicatorDataRef.current.atr?.find(d => d.time === time) : null;
                return `ATR (14): ${item ? item.value.toFixed(2) : "N/A"}`;
              })()}
            </span>
            <button
              onClick={() => togglePane(pane)}
              className="text-slate-400 hover:text-rose-500 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors pointer-events-auto shadow-sm"
              title="Close indicator"
            >
              <X size={10} className="stroke-[3]" />
            </button>
          </div>
          <div
            id={`pane-container-${pane}`}
            className="w-full cursor-crosshair"
            style={{ height: "120px" }}
          />
        </div>
      ))}
    </div>
  );
}