import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
} from "lightweight-charts";

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
  const [rawJson, setRawJson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // CREATE SIMPLE CANDLESTICK CHART
  // --------------------------------------------------

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 450,

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

    // IMPORTANT:
    // Your installed lightweight-charts version uses
    // addCandlestickSeries(), not addSeries(CandlestickSeries,...)

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

    const handleResize = () => {
      if (!chartContainerRef.current) return;

      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // --------------------------------------------------
  // UPDATE CHART
  // --------------------------------------------------

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) {
      return;
    }

    seriesRef.current.setData(candles);

    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // --------------------------------------------------
  // FETCH YAHOO THROUGH CHROME EXTENSION
  // --------------------------------------------------

  const testYahooCandles = () => {
    setLoading(true);
    setError("");
    setCandles([]);
    setRawJson(null);

    const requestId = crypto.randomUUID();

    const yahooUrl =
      "https://query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS?range=1mo&interval=1d";

    const timeout = setTimeout(() => {
      window.removeEventListener("message", handleResponse);

      setLoading(false);

      setError(
        "Extension did not respond. Make sure the FinPulse Chrome extension is installed and enabled."
      );
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

      setLoading(false);

      // --------------------------------------------------
      // HANDLE ERROR
      // --------------------------------------------------

      if (!message.response?.ok) {
        setError(
          message.response?.error ||
            `Yahoo returned HTTP ${message.response?.status}`
        );

        return;
      }

      // --------------------------------------------------
      // PARSE COMPLETE JSON
      // --------------------------------------------------

      try {
        const json = JSON.parse(message.response.body);

        // Keep the COMPLETE Yahoo response.
        setRawJson(json);

        console.log("COMPLETE YAHOO RESPONSE:");
        console.log(json);

        // --------------------------------------------------
        // EXTRACT CANDLE DATA ONLY FOR THE CHART
        // --------------------------------------------------

        const result = json?.chart?.result?.[0];

        if (!result) {
          setError("Yahoo returned no chart result.");
          return;
        }

        const timestamps = result.timestamp || [];
        const quote = result.indicators?.quote?.[0];

        if (!quote) {
          setError("Yahoo returned no OHLC data.");
          return;
        }

        const parsedCandles: Candle[] = timestamps
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

        console.log("CANDLES:");
        console.log(parsedCandles);

        setCandles(parsedCandles);

      } catch (err) {
        console.error(err);

        setError("Could not parse Yahoo response.");
      }
    }

    window.addEventListener("message", handleResponse);

    // --------------------------------------------------
    // SEND REQUEST TO CHROME EXTENSION
    // --------------------------------------------------

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
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <h1 className="text-3xl font-bold">
          FinPulse Yahoo Chart Test
        </h1>

        <p className="text-slate-400 mt-2">
          RELIANCE.NS · 1 Month · Daily Candles
        </p>

        {/* TEST BUTTON */}

        <button
          onClick={testYahooCandles}
          disabled={loading}
          className="mt-6 px-5 py-3 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading
            ? "Fetching Yahoo Data..."
            : "Fetch Yahoo Data"}
        </button>

        {/* ERROR */}

        {error && (
          <div className="mt-6 p-4 rounded-lg border border-red-500 bg-red-950 text-red-300">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {rawJson && (
          <div className="mt-6">
            <p className="text-green-400 font-semibold">
              ✓ Yahoo data received through Chrome extension
            </p>

            <p className="text-slate-400 text-sm mt-1">
              Complete Yahoo response received.{" "}
              {candles.length} candles extracted for the chart.
            </p>
          </div>
        )}

        {/* SIMPLE CANDLESTICK CHART */}

        {candles.length > 0 && (
          <div className="mt-8">

            <h2 className="text-xl font-semibold mb-4">
              RELIANCE.NS Candlestick Chart
            </h2>

            <div
              ref={chartContainerRef}
              className="w-full rounded-xl overflow-hidden border border-slate-800"
            />

          </div>
        )}

        {/* COMPLETE JSON */}

        {rawJson && (
          <div className="mt-8">

            <h2 className="text-xl font-semibold mb-4">
              Complete Yahoo Finance JSON
            </h2>

            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-auto">
              <pre className="p-5 text-sm text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(rawJson, null, 2)}
              </pre>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}