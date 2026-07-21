import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle
} from "lightweight-charts";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { getStockCandles, getAdvancedStockCandles, getFundamentals, mergeDailyMetrics, type DailyMarketMetrics } from "../../services/marketService";

import { ChartHeader } from "./ChartHeader";
import { PriceInfoBar } from "./PriceInfoBar";
import { ChartToolbar } from "./ChartToolbar";
import { LoadingChart } from "./LoadingChart";

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

const findClosestData = (data: any[] | undefined, targetTime: number): any => {
  if (!data || data.length === 0) return null;
  let closest = data[0];
  let minDiff = Math.abs(closest.time - targetTime);
  for (let i = 1; i < data.length; i++) {
    const diff = Math.abs(data[i].time - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = data[i];
    }
  }
  if (minDiff <= 604800) {
    return closest;
  }
  return null;
};

const getCurrencyFromSymbol = (sym: string): string => {
  if (!sym) return "USD";
  const upper = sym.toUpperCase();
  if (upper.endsWith(".NS") || upper.endsWith(".BO") || upper.startsWith("^CNX") || upper.startsWith("^NSE") || upper.startsWith("^BSESN")) {
    return "INR";
  }
  if (upper.endsWith(".DE") || upper.endsWith(".PA") || upper.endsWith(".MI") || upper.endsWith(".MC")) {
    return "EUR";
  }
  if (upper.endsWith(".L")) {
    return "GBP";
  }
  if (upper.endsWith(".TO")) {
    return "CAD";
  }
  if (upper.endsWith(".AX")) {
    return "AUD";
  }
  return "USD";
};

interface Props {
  symbol?: string;
  timeframe?: string;
  height?: number;
  mini?: boolean;
  chartType?: "candlestick" | "line" | "area" | "multiline";
  customData?: { time: string | number; value: number }[];
  customMultiData?: { time: string | number;[key: string]: any }[];
  seriesKeys?: { key: string; color: string }[];
  onCompareChange?: (symbol: string) => void;
  onMetaLoaded?: (meta: any) => void;
  currencySymbol?: string;
}

export default function CandlestickChart({
  symbol = "",
  timeframe: propTimeframe = "24H",
  height = 350,
  mini = false,
  chartType = "candlestick",
  customData,
  customMultiData,
  seriesKeys,
  onCompareChange,
  onMetaLoaded,
  currencySymbol = "$",
}: Props) {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  // Price Lines Array Reference to clear overlays during re-renders smoothly
  const addedPriceLinesRef = useRef<any[]>([]);

  // 1. Persistent Timeframe Range and Candle Interval in LocalStorage
  const [currentTimeframe, setCurrentTimeframe] = useState<string>(() => {
    return localStorage.getItem("finpulse_chart_timeframe") || propTimeframe || "1D";
  });

  const [currentInterval, setCurrentInterval] = useState<string>(() => {
    return localStorage.getItem("finpulse_chart_interval") || "1 day";
  });

  const handleTimeframeChange = (tf: string) => {
    setCurrentTimeframe(tf);
    localStorage.setItem("finpulse_chart_timeframe", tf);

    // Map Range to standard default Interval
    let defaultInterval = "1 day";
    if (tf === "1m") defaultInterval = "1 min";
    else if (tf === "5m") defaultInterval = "5 mins";
    else if (tf === "15m") defaultInterval = "15 mins";
    else if (tf === "30m") defaultInterval = "30 mins";
    else if (tf === "1h") defaultInterval = "1 hour";
    else if (tf === "4h") defaultInterval = "4 hours";
    else if (tf === "1D") defaultInterval = "5 mins";
    else if (tf === "5D") defaultInterval = "15 mins";
    else if (tf === "1M") defaultInterval = "1 day";
    else if (tf === "3M") defaultInterval = "1 day";
    else if (tf === "6M") defaultInterval = "1 day";
    else if (tf === "YTD") defaultInterval = "1 day";
    else if (tf === "1Y") defaultInterval = "1 day";
    else if (tf === "3Y") defaultInterval = "1 week";
    else if (tf === "5Y") defaultInterval = "1 week";
    else if (tf === "MAX") defaultInterval = "1 month";

    setCurrentInterval(defaultInterval);
    localStorage.setItem("finpulse_chart_interval", defaultInterval);
  };

  const handleIntervalChange = (val: string) => {
    setCurrentInterval(val);
    localStorage.setItem("finpulse_chart_interval", val);

    // Map Interval to standard default Range
    let range = "1D";
    if (val === "1 min") range = "1m";
    else if (val === "5 mins") range = "5m";
    else if (val === "15 mins") range = "15m";
    else if (val === "30 mins") range = "30m";
    else if (val === "1 hour") range = "1h";
    else if (val === "4 hours") range = "4h";
    else if (val === "1 day") range = "1Y";
    else if (val === "1 week") range = "5Y";
    else if (val === "1 month" || val === "3 months") range = "MAX";

    setCurrentTimeframe(range);
    localStorage.setItem("finpulse_chart_timeframe", range);
  };

  const convertToIstTimestamp = useCallback((dateStr: string): number => {
    const utcSeconds = Math.floor(new Date(dateStr).getTime() / 1000);
    const intradayTimeframes = ["1m", "2m", "3m", "5m", "15m", "30m", "1h", "1H", "4h", "4H", "24H", "1D", "5D", "1 min", "2 mins", "3 mins", "5 mins", "15 mins", "30 mins", "1 hour", "4 hours"];
    if (intradayTimeframes.includes(currentTimeframe) || intradayTimeframes.includes(currentInterval)) {
      const istOffsetSeconds = 5.5 * 3600; // 19800 seconds (5.5 hours) for IST
      return utcSeconds + istOffsetSeconds;
    }
    return utcSeconds;
  }, [currentTimeframe, currentInterval]);

  // 2. Persistent Indicators in LocalStorage
  const [activeOverlays, setActiveOverlays] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("finpulse_active_overlays");
      return saved ? JSON.parse(saved) : ["Last Price", "Previous Close", "Day High", "Day Low"];
    } catch {
      return ["Last Price", "Previous Close", "Day High", "Day Low"];
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
  const [candles, setCandles] = useState<any[]>([]);
  const [hoveredCandle, setHoveredCandle] = useState<any>(null);
  const [hoveredCompareCandle, setHoveredCompareCandle] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [positionLinesTrigger, setPositionLinesTrigger] = useState(0);
  const [fundamentals, setFundamentals] = useState<any>(null);
  const [metrics, setMetrics] = useState<DailyMarketMetrics | null>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compareSymbol, setCompareSymbol] = useState("");
  const [compareCandles, setCompareCandles] = useState<any[]>([]);
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
    const handleStorageChange = () => {
      setPositionLinesTrigger(prev => prev + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Render active position lines (Entry, SL, TP) on the chart
  useEffect(() => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series || !symbol || loading) return;

    // Clear existing price lines first
    addedPriceLinesRef.current.forEach(line => {
      try {
        series.removePriceLine(line);
      } catch (err) {
        console.error("Failed to remove price line:", err);
      }
    });
    addedPriceLinesRef.current = [];

    // Find if we have an active position for this symbol
    try {
      const stored = localStorage.getItem('finpulse_virtual_holdings');
      if (stored) {
        const holdings = JSON.parse(stored);
        const position = holdings.find((h: any) => h.ticker.toUpperCase() === symbol.toUpperCase());
        if (position && Math.abs(position.shares) > 0.0001) {
          // 1. Entry Price Line
          const entryLine = series.createPriceLine({
            price: position.avgCost,
            color: '#3b82f6', // blue
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `Entry (${position.shares < 0 ? 'Short' : 'Long'}) @ ${position.avgCost.toFixed(2)}`,
          });
          addedPriceLinesRef.current.push(entryLine);

          // 2. Stop Loss (SL) Line
          if (position.sl) {
            const slLine = series.createPriceLine({
              price: position.sl,
              color: '#ef4444', // red
              lineWidth: 2,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `SL @ ${position.sl.toFixed(2)}`,
            });
            addedPriceLinesRef.current.push(slLine);
          }

          // 3. Take Profit (TP) Line
          if (position.tp) {
            const tpLine = series.createPriceLine({
              price: position.tp,
              color: '#10b981', // green
              lineWidth: 2,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `TP @ ${position.tp.toFixed(2)}`,
            });
            addedPriceLinesRef.current.push(tpLine);
          }
        }
      }
    } catch (err) {
      console.error("Failed to draw position lines:", err);
    }
  }, [symbol, loading, candles, positionLinesTrigger]);



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
  const compareSymbolRef = useRef(compareSymbol);
  const compareIndicatorDataRef = useRef<{
    ema20?: { time: number; value: number }[];
    ema50?: { time: number; value: number }[];
    ema200?: { time: number; value: number }[];
    sma?: { time: number; value: number }[];
    vwap?: { time: number; value: number }[];
    bb?: { time: number; middle: number; upper: number; lower: number }[];
  }>({});

  // FX Rate conversion states & Memos for converting other currencies to USD
  const [compareFundamentals, setCompareFundamentals] = useState<any>(null);
  const [mainFxRate, setMainFxRate] = useState<number>(1);
  const [compareFxRate, setCompareFxRate] = useState<number>(1);

  // Fetch FX rates when main fundamentals currency updates
  useEffect(() => {
    const currency = fundamentals?.currency || getCurrencyFromSymbol(symbol);
    if (!currency || currency === "USD") {
      setMainFxRate(1);
      return;
    }
    let active = true;
    async function fetchMainFx() {
      try {
        const res = await getFundamentals(`USD${currency}=X`);
        if (active && res && res.price) {
          setMainFxRate(res.price);
        }
      } catch (e) {
        console.error("Failed to load main FX rate", e);
      }
    }
    fetchMainFx();
    return () => { active = false; };
  }, [fundamentals?.currency, symbol]);

  // Fetch FX rates when compared fundamentals currency updates
  useEffect(() => {
    const currency = compareFundamentals?.currency || getCurrencyFromSymbol(compareSymbol);
    if (!currency || currency === "USD") {
      setCompareFxRate(1);
      return;
    }
    let active = true;
    async function fetchCompareFx() {
      try {
        const res = await getFundamentals(`USD${currency}=X`);
        if (active && res && res.price) {
          setCompareFxRate(res.price);
        }
      } catch (e) {
        console.error("Failed to load compare FX rate", e);
      }
    }
    fetchCompareFx();
    return () => { active = false; };
  }, [compareFundamentals?.currency, compareSymbol]);

  const displayCandles = useMemo(() => {
    return candles;
  }, [candles]);

  const displayCompareCandles = useMemo(() => {
    if (!compareSymbol) return compareCandles;
    const conversionFactor = mainFxRate / compareFxRate;
    if (conversionFactor === 1) return compareCandles;
    return compareCandles.map(c => ({
      ...c,
      open: c.open * conversionFactor,
      high: c.high * conversionFactor,
      low: c.low * conversionFactor,
      close: c.close * conversionFactor,
    }));
  }, [compareCandles, compareSymbol, mainFxRate, compareFxRate]);

  const displayFundamentals = useMemo(() => {
    return fundamentals;
  }, [fundamentals]);

  const displayMetrics = useMemo(() => {
    return metrics;
  }, [metrics]);

  const displayCompareFundamentals = useMemo(() => {
    if (!compareFundamentals) return null;
    const conversionFactor = mainFxRate / compareFxRate;
    if (conversionFactor === 1) return compareFundamentals;
    return {
      ...compareFundamentals,
      price: compareFundamentals.price * conversionFactor,
      open: compareFundamentals.open ? compareFundamentals.open * conversionFactor : undefined,
      previousClose: compareFundamentals.previousClose ? compareFundamentals.previousClose * conversionFactor : undefined,
      dayHigh: compareFundamentals.dayHigh ? compareFundamentals.dayHigh * conversionFactor : undefined,
      dayLow: compareFundamentals.dayLow ? compareFundamentals.dayLow * conversionFactor : undefined,
    };
  }, [compareFundamentals, mainFxRate, compareFxRate]);

  const indicatorData = useMemo(() => {
    if (!displayCandles || displayCandles.length === 0) return {};
    return {
      ema20: calculateEMA(displayCandles, 20),
      ema50: calculateEMA(displayCandles, 50),
      ema200: calculateEMA(displayCandles, 200),
      sma: calculateSMA(displayCandles, 20),
      vwap: calculateVWAP(displayCandles),
      bb: calculateBollingerBands(displayCandles, 20, 2),
      rsi: calculateRSI(displayCandles, 14),
      macd: calculateMACD(displayCandles),
      stoch: calculateStochastic(displayCandles),
      atr: calculateATR(displayCandles)
    };
  }, [displayCandles]);

  const compareIndicatorData = useMemo(() => {
    if (!displayCompareCandles || displayCompareCandles.length === 0) return {};
    return {
      ema20: calculateEMA(displayCompareCandles, 20),
      ema50: calculateEMA(displayCompareCandles, 50),
      ema200: calculateEMA(displayCompareCandles, 200),
      sma: calculateSMA(displayCompareCandles, 20),
      vwap: calculateVWAP(displayCompareCandles),
      bb: calculateBollingerBands(displayCompareCandles, 20, 2),
    };
  }, [displayCompareCandles]);

  useEffect(() => {
    indicatorDataRef.current = indicatorData;
  }, [indicatorData]);

  useEffect(() => {
    compareIndicatorDataRef.current = compareIndicatorData;
  }, [compareIndicatorData]);

  useEffect(() => {
    compareSymbolRef.current = compareSymbol;
    onCompareChange?.(compareSymbol);
  }, [compareSymbol, onCompareChange]);

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

  // Load Compare candles & fundamentals
  useEffect(() => {
    setCompareCandles([]);
    setCompareFundamentals(null);

    if (!compareSymbol || !symbol) {
      return;
    }
    async function loadCompareData() {
      try {
        const [res, compFundamentals] = await Promise.all([
          getAdvancedStockCandles(compareSymbol, currentInterval),
          getFundamentals(compareSymbol).catch(() => null)
        ]);
        if (compFundamentals) {
          setCompareFundamentals(compFundamentals);
        }
        if (res?.quotes && Array.isArray(res.quotes)) {
          const mapped = res.quotes
            .filter((q: any) => q && q.date && q.open != null && q.high != null && q.low != null && q.close != null)
            .map((q: any) => ({
              time: convertToIstTimestamp(q.date),
              open: Number(q.open),
              high: Number(q.high),
              low: Number(q.low),
              close: Number(q.close)
            }));
          setCompareCandles(mapped);
        }
      } catch (err) {
        console.error("Failed to load compare candles:", err);
      }
    }
    loadCompareData();
  }, [compareSymbol, currentInterval, symbol]);

  useEffect(() => {
    if (propTimeframe) {
      setCurrentTimeframe(propTimeframe);
    }
  }, [propTimeframe]);

  // Main Effect: Fetch Candle Data & Build Main Candlestick Chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    let active = true;

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
        attributionLogo: false,
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
        setHoveredCompareCandle(null);
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
      } else if (customMultiData) {
        const hoveredPoint = customMultiData.find(d => d.time === time);
        if (hoveredPoint) {
          setHoveredCandle(hoveredPoint);
        } else {
          setHoveredCandle(null);
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

      // Track comparison series crosshair hover data
      if (compareSymbolRef.current && displayCompareCandles && displayCompareCandles.length > 0) {
        const compCandle = findClosestData(displayCompareCandles, time as number);
        if (compCandle) {
          setHoveredCompareCandle(compCandle);
        } else {
          setHoveredCompareCandle(null);
        }
      } else {
        setHoveredCompareCandle(null);
      }

      // Sync sub charts crosshair
      Object.keys(subChartsRef.current).forEach(pane => {
        const subChart = subChartsRef.current[pane];
        if (!subChart) return;

        if (time) {
          let price = 0;
          if (pane === "Comparison" && displayCompareCandles && displayCompareCandles.length > 0) {
            const compCandle = findClosestData(displayCompareCandles, time as number);
            price = compCandle ? compCandle.close : 0;
          } else if (pane === "RSI" && indicatorDataRef.current.rsi) {
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
      if (!active) return;
      chart.timeScale().fitContent();
    };
    container.addEventListener("dblclick", handleDoubleClickReset);

    async function loadData() {
      // 1. Handle custom single series rendering
      if (customData) {
        if (!active) return;
        if (mainSeries) {
          mainSeries.setData(customData as any);
        }
        chart.timeScale().fitContent();
        setLoading(false);
        return;
      }

      // 2. Handle custom multiline comparison rendering
      if (customMultiData && seriesKeys) {
        if (!active) return;
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
        if (active) setLoading(false);
        return;
      }

      try {
        const [data, fundamentalsResponse] = await Promise.all([
          getAdvancedStockCandles(symbol, currentInterval),
          getFundamentals(symbol).catch(() => null)
        ]);

        if (!active) return;

        if (!data?.quotes || !Array.isArray(data.quotes)) {
          console.error("No valid chart candle payload available:", data);
          setLoading(false);
          return;
        }

        // Structural translation mapping parameters 
        const mappedCandles = data.quotes
          .filter((q: any) => q && q.date && q.open != null && q.high != null && q.low != null && q.close != null)
          .map((q: any) => ({
            time: convertToIstTimestamp(q.date),
            open: Number(q.open),
            high: Number(q.high),
            low: Number(q.low),
            close: Number(q.close),
            volume: q.volume ? Number(q.volume) : 0
          }));

        if (!mappedCandles.length) {
          setLoading(false);
          return;
        }

        if (fundamentalsResponse) {
          setFundamentals(fundamentalsResponse);
        }

        const newMeta = {
          name: fundamentalsResponse?.name || (meta?.name || "Asset"),
          exchange: fundamentalsResponse?.marketState ? "GLOBAL" : "INDEX",
          price: fundamentalsResponse?.price || (mappedCandles[mappedCandles.length - 1]?.close || 0),
          change: fundamentalsResponse?.change || 0,
          changePercent: fundamentalsResponse?.changePercent || 0,
          marketState: fundamentalsResponse?.marketState || "CLOSED",
          currency: fundamentalsResponse?.currency || "USD",
          performance: fundamentalsResponse?.performance || null
        };
        setMeta(newMeta);
        if (onMetaLoaded) {
          onMetaLoaded(newMeta);
        }

        // Set candles data
        if (candleSeriesRef.current) {
          candleSeriesRef.current.setData(mappedCandles);
        }
        setCandles(mappedCandles);

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
        if (active) setLoading(false);
      }
    }

    loadData();

    let lastWidth = container.clientWidth;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length || !active) return;
      const newWidth = entries[0].contentRect.width;
      if (Math.abs(newWidth - lastWidth) > 3) {
        chart.resize(newWidth, height);
        lastWidth = newWidth;
      }
    });
    resizeObserver.observe(container);

    return () => {
      active = false;
      container.removeEventListener("dblclick", handleDoubleClickReset);
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [symbol, currentTimeframe, currentInterval, height, customData, customMultiData, seriesKeys, mini, chartType, settings.lineThickness]);

  // Real-time live ticking simulator (just like TradingView)
  useEffect(() => {
    if (loading || !candles.length || !candleSeriesRef.current) return;

    const isMarketOpen = meta.marketState?.toUpperCase() === "REGULAR" || meta.marketState?.toUpperCase() === "OPEN";
    if (!isMarketOpen) return;

    const interval = setInterval(() => {
      const changePercent = (Math.random() - 0.5) * 0.0004; // small fluctuation
      
      setCandles(prev => {
        if (!prev.length) return prev;
        const next = [...prev];
        const lastIndex = next.length - 1;
        const lastCandle = { ...next[lastIndex] };
        
        const oldClose = lastCandle.close;
        const newClose = Number((oldClose * (1 + changePercent)).toFixed(2));
        
        lastCandle.close = newClose;
        if (newClose > lastCandle.high) lastCandle.high = newClose;
        if (newClose < lastCandle.low) lastCandle.low = newClose;
        
        if (candleSeriesRef.current) {
          candleSeriesRef.current.update(lastCandle);
        }
        
        setMeta(prevMeta => {
          const delta = newClose - (prevMeta.price || oldClose);
          const newPrice = newClose;
          const newChange = prevMeta.change + delta;
          const newChangePercent = (newChange / (newPrice - newChange)) * 100;
          
          const updatedMeta = {
            ...prevMeta,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent
          };
          
          if (onMetaLoaded) {
            onMetaLoaded(updatedMeta);
          }
          return updatedMeta;
        });

        next[lastIndex] = lastCandle;
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [loading, candles.length, onMetaLoaded, meta.marketState]);

  // Effect: Render main chart overlay indicators (EMA, SMA, VWAP, Bollinger Bands) & Comparison line
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !displayCandles.length) return;

    if (candleSeries) {
      candleSeries.setData(displayCandles);
    }

    // Remove existing price lines
    addedPriceLinesRef.current.forEach(line => {
      try {
        if (candleSeries) {
          candleSeries.removePriceLine(line);
        }
      } catch (e) {
        console.error("Failed to remove price line", e);
      }
    });
    addedPriceLinesRef.current = [];

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
        addLineOverlay("EMA 20", indicatorDataRef.current.ema20, "#38bdf8");
      }
      if (activeOverlays.includes("EMA 50") && indicatorDataRef.current.ema50) {
        addLineOverlay("EMA 50", indicatorDataRef.current.ema50, "#10b981");
      }
      if (activeOverlays.includes("EMA 200") && indicatorDataRef.current.ema200) {
        addLineOverlay("EMA 200", indicatorDataRef.current.ema200, "#f43f5e");
      }
      if (activeOverlays.includes("SMA") && indicatorDataRef.current.sma) {
        addLineOverlay("SMA", indicatorDataRef.current.sma, "#a855f7");
      }
      if (activeOverlays.includes("VWAP") && indicatorDataRef.current.vwap) {
        addLineOverlay("VWAP", indicatorDataRef.current.vwap, "#eab308");
      }
      if (activeOverlays.includes("Bollinger Bands") && indicatorDataRef.current.bb) {
        const bbData = indicatorDataRef.current.bb;
        const basisData = bbData.map(d => ({ time: d.time, value: d.middle }));
        const upperData = bbData.map(d => ({ time: d.time, value: d.upper }));
        const lowerData = bbData.map(d => ({ time: d.time, value: d.lower }));

        const basisSeries = chart.addLineSeries({
          color: "#f97316",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        const upperSeries = chart.addLineSeries({
          color: "#fdba74",
          lineWidth: settings.lineThickness || 2,
          lineStyle: LineStyle.Solid,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        const lowerSeries = chart.addLineSeries({
          color: "#fdba74",
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



    // 6. Render price lines conditionally
    if (candleSeries && displayMetrics) {
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

      const currentPriceVal = displayFundamentals?.price || displayMetrics.currentPrice;
      const prevCloseVal = displayMetrics.previousClose;
      const dayHighVal = displayMetrics.dayHigh;
      const dayLowVal = displayMetrics.dayLow;

      if (activeOverlays.includes("Last Price")) {
        appendTrackingLine(currentPriceVal, "#3b82f6", LineStyle.Solid, "LAST");
      }
      if (activeOverlays.includes("Previous Close")) {
        appendTrackingLine(prevCloseVal, "#64748b", LineStyle.Dashed, "PREV CLOSE");
      }
      if (activeOverlays.includes("Day High")) {
        appendTrackingLine(dayHighVal, "#22c55e", LineStyle.Dotted, "DAY HIGH");
      }
      if (activeOverlays.includes("Day Low")) {
        appendTrackingLine(dayLowVal, "#ef4444", LineStyle.Dotted, "DAY LOW");
      }
    }

    // 7. Remove volume below the chart when doing comparison
    if (volumeSeriesRef.current) {
      if (compareSymbol) {
        volumeSeriesRef.current.setData([]);
      } else if (displayCandles.length > 0) {
        const volumeBars = displayCandles.map((c: any) => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "rgba(34, 197, 94, 0.45)" : "rgba(239, 68, 68, 0.45)"
        }));
        volumeSeriesRef.current.setData(volumeBars);
      }
    }
  }, [activeOverlays, displayCandles, loading, compareSymbol, displayCompareCandles, settings.lineThickness, displayMetrics, displayFundamentals]);

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

    const panesToDraw = [...activePanes];
    if (compareSymbol && displayCompareCandles.length > 0) {
      panesToDraw.push("Comparison");
    }

    panesToDraw.forEach(pane => {
      const containerId = `pane-container-${pane}`;
      const containerEl = document.getElementById(containerId);
      if (!containerEl) return;

      const isDark = document.documentElement.classList.contains("dark");
      const textColorVal = isDark ? "#94a3b8" : "#64748b";
      const gridColorVal = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(30, 41, 59, 0.04)";
      const isComparison = pane === "Comparison";

      // Create sub-chart pane
      const paneChart = createChart(containerEl, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: textColorVal,
          fontSize: 10,
          fontFamily: "JetBrains Mono, Menlo, monospace",
          attributionLogo: false,
        },
        width: containerEl.clientWidth,
        height: isComparison ? 200 : 120,
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
        },
        handleScroll: isMini ? false : { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        handleScale: isMini ? false : { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      });

      subChartsRef.current[pane] = paneChart;

      // Render respective series
      if (pane === "Comparison") {
        const compareCandleSeries = paneChart.addCandlestickSeries({
          upColor: "#ffffff",
          downColor: "#3b82f6",
          borderVisible: true,
          borderUpColor: "#ffffff",
          borderDownColor: "#3b82f6",
          wickUpColor: "#ffffff",
          wickDownColor: "#3b82f6",
          priceLineVisible: false,
          lastValueVisible: true,
        });
        compareCandleSeries.setData(displayCompareCandles as any);

        const addCompareIndicatorLine = (lineData: { time: number; value: number }[], color: string, style?: any) => {
          if (!lineData || !lineData.length) return;
          const lineSeries = paneChart.addLineSeries({
            color,
            lineWidth: settings.lineThickness || 2,
            lineStyle: style ?? LineStyle.Solid,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lineSeries.setData(lineData as any);
        };

        if (activeOverlays.includes("EMA 20") && compareIndicatorData.ema20) {
          addCompareIndicatorLine(compareIndicatorData.ema20, "#38bdf8");
        }
        if (activeOverlays.includes("EMA 50") && compareIndicatorData.ema50) {
          addCompareIndicatorLine(compareIndicatorData.ema50, "#10b981");
        }
        if (activeOverlays.includes("EMA 200") && compareIndicatorData.ema200) {
          addCompareIndicatorLine(compareIndicatorData.ema200, "#f43f5e");
        }
        if (activeOverlays.includes("SMA") && compareIndicatorData.sma) {
          addCompareIndicatorLine(compareIndicatorData.sma, "#a855f7");
        }
        if (activeOverlays.includes("VWAP") && compareIndicatorData.vwap) {
          addCompareIndicatorLine(compareIndicatorData.vwap, "#eab308");
        }
        if (activeOverlays.includes("Bollinger Bands") && compareIndicatorData.bb) {
          const bbData = compareIndicatorData.bb;
          addCompareIndicatorLine(bbData.map(d => ({ time: d.time, value: d.middle })), "#f97316", LineStyle.Dashed);
          addCompareIndicatorLine(bbData.map(d => ({ time: d.time, value: d.upper })), "#fdba74");
          addCompareIndicatorLine(bbData.map(d => ({ time: d.time, value: d.lower })), "#fdba74");
        }
      } else if (pane === "RSI" && indicatorDataRef.current.rsi) {
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
          const mainCandle = findClosestData(candles, time as number);
          if (mainCandle && candleSeriesRef.current) {
            mainChart.setCrosshairPosition(mainCandle.close, time, candleSeriesRef.current);
            setHoveredCandle(mainCandle);
          }
          if (compareSymbolRef.current && displayCompareCandles && displayCompareCandles.length > 0) {
            const compCandle = findClosestData(displayCompareCandles, time as number);
            setHoveredCompareCandle(compCandle);
          }
        } else {
          mainChart.clearCrosshairPosition();
          setHoveredCandle(null);
          setHoveredCompareCandle(null);
        }

        // Sync other sub-charts
        Object.keys(subChartsRef.current).forEach(otherPane => {
          if (otherPane === pane) return;
          const otherChart = subChartsRef.current[otherPane];
          if (!otherChart) return;

          if (time) {
            let otherPrice = 0;
            if (otherPane === "Comparison" && displayCompareCandles.length > 0) {
              const compCandle = findClosestData(displayCompareCandles, time as number);
              otherPrice = compCandle ? compCandle.close : 0;
            } else if (otherPane === "RSI" && indicatorDataRef.current.rsi) {
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

    let lastSubWidth = chartContainerRef.current?.clientWidth || 0;
    const resizeObserver = new ResizeObserver(() => {
      const container = chartContainerRef.current;
      if (!container) return;
      const newWidth = container.clientWidth;
      if (Math.abs(newWidth - lastSubWidth) > 3) {
        activePanes.forEach(pane => {
          const paneChart = subChartsRef.current[pane];
          if (paneChart) {
            paneChart.applyOptions({ width: newWidth });
          }
        });
        lastSubWidth = newWidth;
      }
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
  }, [activePanes, candles, loading, settings.gridVisible, settings.lineThickness, compareSymbol, displayCompareCandles, activeOverlays, compareIndicatorData]);

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
      className={`w-full flex flex-col select-none ${isFullscreen
        ? "bg-slate-900 dark:bg-night-950 p-6 overflow-y-auto fixed inset-0 z-[99] h-full w-full"
        : "space-y-4"
        }`}
    >
      {hasSymbol && !onMetaLoaded && (
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
            currentTimeframe={currentTimeframe}
            onTimeframeChange={handleTimeframeChange}
            currentInterval={currentInterval}
            onIntervalChange={handleIntervalChange}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3 pb-2 border-b border-slate-100 dark:border-white/5">
            {/* Hovered stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              {hoveredCandle ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-slate-450 dark:text-slate-500 font-bold uppercase">Invested:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black">
                      {currencySymbol}{Number(hoveredCandle.invested).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pl-3 border-l border-slate-150 dark:border-white/5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-450 dark:text-slate-500 font-bold uppercase">Current Value:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black">
                      {currencySymbol}{Number(hoveredCandle.value).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pl-3 border-l border-slate-150 dark:border-white/5">
                    <span className="text-slate-450 dark:text-slate-500 font-bold uppercase">P&L:</span>
                    <span className={`font-black ${Number(hoveredCandle.value) >= Number(hoveredCandle.invested) ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {Number(hoveredCandle.value) >= Number(hoveredCandle.invested) ? '+' : ''}
                      {currencySymbol}{(Number(hoveredCandle.value) - Number(hoveredCandle.invested)).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 font-bold italic">Hover on graph to view details</span>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex gap-1.5 ml-auto">
              <button onClick={zoomIn} title="Zoom In" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-350 transition-all text-xs font-bold leading-none w-8 h-8 flex items-center justify-center">
                +
              </button>
              <button onClick={zoomOut} title="Zoom Out" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-350 transition-all text-xs font-bold leading-none w-8 h-8 flex items-center justify-center">
                -
              </button>
              <button onClick={() => chartRef.current?.timeScale().fitContent()} title="Reset Zoom" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-355 transition-all text-xs font-bold px-3 h-8 flex items-center justify-center">
                Reset
              </button>
            </div>
          </div>
        )}



        {hasSymbol && displayFundamentals && displayMetrics && (
          <PriceInfoBar
            hoveredData={hoveredCandle}
            fundamentals={displayFundamentals}
            metrics={displayMetrics}
            compareSymbol={compareSymbol}
            hoveredCompareCandle={hoveredCompareCandle}
            compareCandles={displayCompareCandles}
            compareFundamentals={displayCompareFundamentals}
          />
        )}

        {/* Hovered Overlays Badge Row */}
        {!loading && hasSymbol && activeOverlays.filter(ov => !["Last Price", "Previous Close", "Day High", "Day Low"].includes(ov)).length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 px-3 bg-blue-50/20 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5 font-mono text-[11px] mb-4">
            <span className="font-bold text-slate-400 dark:text-slate-500 select-none">INDICATORS:</span>
            {activeOverlays
              .filter(ov => !["Last Price", "Previous Close", "Day High", "Day Low"].includes(ov))
              .map(ov => {
                const time = hoveredTime || (displayCandles.length > 0 ? displayCandles[displayCandles.length - 1].time : null);
                if (!time) return null;

                let valStr = "N/A";
                if (ov === "EMA 20" && indicatorDataRef.current.ema20) {
                  const item = findClosestData(indicatorDataRef.current.ema20, time);
                  if (item) valStr = item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                } else if (ov === "EMA 50" && indicatorDataRef.current.ema50) {
                  const item = findClosestData(indicatorDataRef.current.ema50, time);
                  if (item) valStr = item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                } else if (ov === "EMA 200" && indicatorDataRef.current.ema200) {
                  const item = findClosestData(indicatorDataRef.current.ema200, time);
                  if (item) valStr = item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                } else if (ov === "SMA" && indicatorDataRef.current.sma) {
                  const item = findClosestData(indicatorDataRef.current.sma, time);
                  if (item) valStr = item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                } else if (ov === "VWAP" && indicatorDataRef.current.vwap) {
                  const item = findClosestData(indicatorDataRef.current.vwap, time);
                  if (item) valStr = item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                } else if (ov === "Bollinger Bands" && indicatorDataRef.current.bb) {
                  const item = findClosestData(indicatorDataRef.current.bb, time);
                  if (item) valStr = `Basis:${item.middle.toFixed(2)} Upper:${item.upper.toFixed(2)} Lower:${item.lower.toFixed(2)}`;
                }

                let compValFormatted = "";
                if (compareSymbol && compareIndicatorDataRef.current) {
                  let compVal: number | string | null = null;
                  const timeData = compareIndicatorDataRef.current;
                  if (ov === "EMA 20" && timeData.ema20) {
                    compVal = findClosestData(timeData.ema20, time)?.value ?? null;
                  } else if (ov === "EMA 50" && timeData.ema50) {
                    compVal = findClosestData(timeData.ema50, time)?.value ?? null;
                  } else if (ov === "EMA 200" && timeData.ema200) {
                    compVal = findClosestData(timeData.ema200, time)?.value ?? null;
                  } else if (ov === "SMA" && timeData.sma) {
                    compVal = findClosestData(timeData.sma, time)?.value ?? null;
                  } else if (ov === "VWAP" && timeData.vwap) {
                    compVal = findClosestData(timeData.vwap, time)?.value ?? null;
                  } else if (ov === "Bollinger Bands" && timeData.bb) {
                    const item = findClosestData(timeData.bb, time);
                    if (item) compVal = `Basis:${item.middle.toFixed(2)} Upper:${item.upper.toFixed(2)} Lower:${item.lower.toFixed(2)}`;
                  }

                  if (compVal != null) {
                    compValFormatted = typeof compVal === "number"
                      ? compVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : compVal;
                  }
                }

                let colorClass = "text-sky-500";
                if (ov === "EMA 50") colorClass = "text-emerald-500";
                if (ov === "EMA 200") colorClass = "text-rose-500";
                if (ov === "SMA") colorClass = "text-purple-500";
                if (ov === "VWAP") colorClass = "text-yellow-500";
                if (ov === "Bollinger Bands") colorClass = "text-orange-500";

                return (
                  <div key={ov} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/5 shadow-sm text-[11px]">
                    <span className="font-extrabold text-slate-400 dark:text-slate-500">{ov}:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase font-black tracking-wider leading-none">{symbol}</span>
                      <span className={`font-black ${colorClass}`}>{valStr}</span>
                    </div>
                    {compValFormatted && (
                      <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-white/10">
                        <span className="text-[8px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-500 uppercase font-black tracking-wider leading-none">{compareSymbol}</span>
                        <span className="font-extrabold text-blue-500 dark:text-blue-400">{compValFormatted}</span>
                      </div>
                    )}
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
      <div
        className={`relative w-full border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-white/[0.01] p-2 mt-2 ${!compareSymbol || displayCompareCandles.length === 0 ? "hidden" : ""
          }`}
      >
        <div className="absolute top-2 left-3 z-20 flex items-center justify-between w-[95%] pointer-events-none">
          <span className="text-[10px] font-black tracking-wider uppercase font-mono text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 shadow-sm">
            Comparison: {compareSymbol}
          </span>
          <button
            onClick={() => setCompareSymbol("")}
            className="text-slate-400 hover:text-rose-500 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors pointer-events-auto shadow-sm"
            title="Close comparison"
          >
            <X size={10} className="stroke-[3]" />
          </button>
        </div>
        <div
          id="pane-container-Comparison"
          className="w-full cursor-crosshair"
          style={{ height: "200px" }}
        />
      </div>

      {!loading && hasSymbol && activePanes.map(pane => (
        <div key={pane} className="relative w-full border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-white/[0.01] p-2">
          <div className="absolute top-2 left-3 z-20 flex items-center justify-between w-[95%] pointer-events-none">
            <span className="text-[10px] font-black tracking-wider uppercase font-mono text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 shadow-sm">
              {pane === "RSI" && (() => {
                const time = hoveredTime || (displayCandles.length > 0 ? displayCandles[displayCandles.length - 1].time : null);
                const item = time ? indicatorDataRef.current.rsi?.find(d => d.time === time) : null;
                return `RSI (14): ${item ? item.value.toFixed(2) : "N/A"}`;
              })()}
              {pane === "MACD" && (() => {
                const time = hoveredTime || (displayCandles.length > 0 ? displayCandles[displayCandles.length - 1].time : null);
                const item = time ? indicatorDataRef.current.macd?.find(d => d.time === time) : null;
                return `MACD (12, 26, 9): ${item ? `MACD: ${item.macd.toFixed(2)}  Signal: ${item.signal.toFixed(2)}  Hist: ${item.histogram.toFixed(2)}` : "N/A"}`;
              })()}
              {pane === "Stochastic" && (() => {
                const time = hoveredTime || (displayCandles.length > 0 ? displayCandles[displayCandles.length - 1].time : null);
                const item = time ? indicatorDataRef.current.stoch?.find(d => d.time === time) : null;
                return `Stochastic (14, 3, 3): ${item ? `%K: ${item.k.toFixed(2)}  %D: ${item.d.toFixed(2)}` : "N/A"}`;
              })()}
              {pane === "ATR" && (() => {
                const time = hoveredTime || (displayCandles.length > 0 ? displayCandles[displayCandles.length - 1].time : null);
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