import { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export default function YahooExtensionTest() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const [candles, setCandles] = useState<Candle[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);

  const [lastYahooUpdate, setLastYahooUpdate] = useState("");
  const [requestCount, setRequestCount] = useState(0);
  const [error, setError] = useState("");

  // =========================================================
  // CREATE SIMPLE CANDLESTICK CHART
  // =========================================================

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,

      layout: {
        background: {
          type: ColorType.Solid,
          color: "#020617",
        },
        textColor: "#94a3b8",
      },

      grid: {
        vertLines: {
          color: "#1e293b",
        },
        horzLines: {
          color: "#1e293b",
        },
      },

      rightPriceScale: {
        borderColor: "#334155",
      },

      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resize = () => {
      if (!chartContainerRef.current) return;

      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, []);

  // =========================================================
  // UPDATE CHART
  // =========================================================

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    seriesRef.current.setData(candles);

    chartRef.current?.timeScale().scrollToRealTime();
  }, [candles]);

  // =========================================================
  // FETCH YAHOO
  // =========================================================

  const fetchYahoo = async () => {
    return new Promise<void>((resolve, reject) => {
      const requestId = crypto.randomUUID();

      const yahooUrl =
        "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?range=1d&interval=1m";

      const timeout = setTimeout(() => {
        window.removeEventListener("message", handleResponse);

        reject(new Error("Yahoo request timed out."));
      }, 15000);

      function handleResponse(event: MessageEvent) {
        if (event.source !== window) return;

        const message = event.data;

        if (
          message?.source !== "FINPULSE_YAHOO_BRIDGE" ||
          message?.requestId !== requestId
        ) {
          return;
        }

        clearTimeout(timeout);
        window.removeEventListener("message", handleResponse);

        if (!message.response?.ok) {
          reject(
            new Error(
              message.response?.error ||
                `Yahoo returned HTTP ${message.response?.status}`
            )
          );

          return;
        }

        try {
          const json = JSON.parse(message.response.body);

          console.log("Yahoo response:", json);

          const result = json?.chart?.result?.[0];

          if (!result) {
            reject(new Error("Yahoo returned no chart result."));
            return;
          }

          const timestamps = result.timestamp || [];
          const quote = result.indicators?.quote?.[0];

          if (!quote) {
            reject(new Error("Yahoo returned no OHLC data."));
            return;
          }

          const parsed: Candle[] = timestamps
            .map((timestamp: number, index: number) => ({
              time: timestamp,
              open: quote.open?.[index],
              high: quote.high?.[index],
              low: quote.low?.[index],
              close: quote.close?.[index],
            }))
            .filter(
              (candle: Candle) =>
                candle.open != null &&
                candle.high != null &&
                candle.low != null &&
                candle.close != null
            );

          if (parsed.length === 0) {
            reject(new Error("No candles received."));
            return;
          }

          // -------------------------------------------------
          // GET LATEST PRICE
          // -------------------------------------------------

          const latest = parsed[parsed.length - 1];

          setPreviousPrice((oldPrice) => {
            setPrice(latest.close);
            return oldPrice;
          });

          // -------------------------------------------------
          // UPDATE CHART
          // -------------------------------------------------

          setCandles(parsed);

          // -------------------------------------------------
          // UPDATE STATUS
          // -------------------------------------------------

          setLastYahooUpdate(
            new Date().toLocaleTimeString("en-IN")
          );

          setRequestCount((count) => count + 1);

          resolve();

        } catch (err) {
          reject(
            err instanceof Error
              ? err
              : new Error("Could not parse Yahoo response.")
          );
        }
      }

      window.addEventListener("message", handleResponse);

      // =====================================================
      // SEND REQUEST TO YOUR CHROME EXTENSION
      // =====================================================

      window.postMessage(
        {
          source: "FINPULSE",
          type: "YAHOO_REQUEST",
          requestId,
          url: yahooUrl,
          method: "GET",
        },
        "*"
      );
    });
  };

  // =========================================================
  // AUTOMATIC POLLING
  // =========================================================

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const update = async () => {
      if (stopped) return;

      try {
        setError("");

        await fetchYahoo();

      } catch (err) {
        if (!stopped) {
          setError(
            err instanceof Error
              ? err.message
              : "Yahoo request failed."
          );
        }
      }

      if (!stopped) {
        // Poll Yahoo automatically every 5 seconds
        timer = setTimeout(update, 5000);
      }
    };

    // Automatically start
    update();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  // =========================================================
  // PRICE DIRECTION
  // =========================================================

  const priceChanged =
    previousPrice !== null &&
    price !== null &&
    price !== previousPrice;

  const priceDirection =
    price !== null && previousPrice !== null
      ? price > previousPrice
        ? "UP"
        : price < previousPrice
          ? "DOWN"
          : "UNCHANGED"
      : "WAITING";

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <h1 className="text-3xl font-bold">
          FinPulse Live Gold Test
        </h1>

        <p className="text-slate-400 mt-2">
          GC=F · Gold Futures · 1 Day · 1 Minute Candles
        </p>

        {/* LIVE STATUS */}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">

            <div className="text-sm text-slate-500">
              Current price
            </div>

            <div className="text-3xl font-bold mt-1">
              {price !== null
                ? `$${price.toFixed(2)}`
                : "Loading..."}
            </div>

          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">

            <div className="text-sm text-slate-500">
              Price status
            </div>

            <div
              className={`text-xl font-bold mt-2 ${
                priceDirection === "UP"
                  ? "text-green-400"
                  : priceDirection === "DOWN"
                    ? "text-red-400"
                    : "text-slate-400"
              }`}
            >
              {priceChanged
                ? `● ${priceDirection}`
                : "● Waiting for change"}
            </div>

          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">

            <div className="text-sm text-slate-500">
              Yahoo requests
            </div>

            <div className="text-2xl font-bold mt-1">
              {requestCount}
            </div>

          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">

            <div className="text-sm text-slate-500">
              Last Yahoo response
            </div>

            <div className="text-lg font-semibold mt-1">
              {lastYahooUpdate || "Waiting..."}
            </div>

          </div>

        </div>

        {/* LIVE INDICATOR */}

        <div className="mt-6 flex items-center gap-3">

          <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />

          <span className="text-green-400 font-semibold">
            AUTOMATIC LIVE POLLING
          </span>

          <span className="text-slate-500">
            Yahoo checked every 5 seconds
          </span>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-5 p-4 rounded-xl border border-red-500 bg-red-950 text-red-300">
            {error}
          </div>
        )}

        {/* CHART */}

        <div className="mt-8">

          <h2 className="text-xl font-semibold mb-4">
            Gold — 1 Minute Candlestick Chart
          </h2>

          <div
            ref={chartContainerRef}
            className="w-full rounded-xl overflow-hidden border border-slate-800"
          />

        </div>

        {/* LATEST CANDLE */}

        {candles.length > 0 && (
          <div className="mt-6 p-5 rounded-xl bg-slate-900 border border-slate-800">

            <h2 className="font-semibold mb-4">
              Current 1-Minute Candle
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

              <div>
                <div className="text-xs text-slate-500">
                  Open
                </div>

                <div className="text-lg">
                  ${candles.at(-1)?.open?.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  High
                </div>

                <div className="text-lg">
                  ${candles.at(-1)?.high?.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  Low
                </div>

                <div className="text-lg">
                  ${candles.at(-1)?.low?.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  Close
                </div>

                <div className="text-xl font-bold">
                  ${candles.at(-1)?.close?.toFixed(2)}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}