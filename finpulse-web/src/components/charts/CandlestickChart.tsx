import {
  createChart,
  ColorType,
  CandlestickSeries,
} from "lightweight-charts";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Plus,
  Minus,
  RotateCcw,
} from "lucide-react";

import {
  getStockCandles,
} from "../../services/marketService";

interface Props {
  symbol: string;
  timeframe: string;
}

export default function CandlestickChart({
  symbol,
  timeframe,
}: Props) {
  const chartContainerRef =
    useRef<HTMLDivElement>(null);

  const chartRef =
    useRef<any>(null);

  const candleSeriesRef =
    useRef<any>(null);

  const [hoveredCandle,
    setHoveredCandle] =
    useState<any>(null);

  useEffect(() => {
    const container =
      chartContainerRef.current;

    if (!container) return;

    const chart = createChart(
      container,
      {
        layout: {
          background: {
            type:
              ColorType.Solid,
            color:
              "transparent",
          },
          textColor:
            "#94a3b8",
        },

        width:
          container.clientWidth,

        height: 550,

        grid: {
          vertLines: {
            color:
              "#1e293b20",
          },
          horzLines: {
            color:
              "#1e293b20",
          },
        },

        crosshair: {
          mode: 1,
        },

        rightPriceScale: {
          borderVisible: false,
        },

        timeScale: {
          borderVisible: false,
          timeVisible: true,
          secondsVisible: false,
        },
      }
    );

    chartRef.current = chart;

    const candleSeries =
      chart.addSeries(
        CandlestickSeries
      );

    candleSeriesRef.current =
      candleSeries;

    chart.subscribeCrosshairMove(
      (param) => {
        if (
          !param.seriesData ||
          !param.seriesData.size
        )
          return;

        const candle =
          param.seriesData.get(
            candleSeries
          );

        if (candle) {
          setHoveredCandle(
            candle
          );
        }
      }
    );

    async function loadData() {
      try {
        const data =
          await getStockCandles(
            symbol,
            timeframe
          );

        console.log(
          "Yahoo Response:",
          data
        );

        if (
          !data?.quotes ||
          !Array.isArray(
            data.quotes
          )
        ) {
          console.error(
            "No Yahoo candle data",
            data
          );
          return;
        }

        const candles =
          data.quotes
            .filter(
              (q: any) =>
                q &&
                q.date &&
                q.open != null &&
                q.high != null &&
                q.low != null &&
                q.close != null
            )
            .map(
              (q: any) => ({
                time:
                  Math.floor(
                    new Date(
                      q.date
                    ).getTime() /
                      1000
                  ) as any,

                open:
                  Number(
                    q.open
                  ),

                high:
                  Number(
                    q.high
                  ),

                low:
                  Number(
                    q.low
                  ),

                close:
                  Number(
                    q.close
                  ),
              })
            );

        if (
          !candles.length
        ) {
          console.error(
            "No valid candles found"
          );
          return;
        }

        console.log(
          "Candles Loaded:",
          candles.length
        );

        candleSeries.setData(
          candles
        );

        // Show latest candle
        setHoveredCandle(
          candles[
            candles.length -
              1
          ]
        );

        // Current price line
        candleSeries.createPriceLine(
          {
            price:
              candles[
                candles.length -
                  1
              ].close,

            color:
              "#22c55e",

            lineWidth:
              2,

            lineStyle:
              2,

            axisLabelVisible:
              true,

            title:
              "Current",
          }
        );

        chart
          .timeScale()
          .fitContent();
      } catch (error) {
        console.error(
          "Chart Error:",
          error
        );
      }
    }

    loadData();

    const resizeObserver =
      new ResizeObserver(
        (entries) => {
          if (
            !entries.length
          )
            return;

          chart.applyOptions({
            width:
              entries[0]
                .contentRect
                .width,
          });
        }
      );

    resizeObserver.observe(
      container
    );

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [symbol, timeframe]);

  const zoomIn = () => {
    const range =
      chartRef.current
        ?.timeScale()
        .getVisibleLogicalRange();

    if (!range) return;

    chartRef.current
      .timeScale()
      .setVisibleLogicalRange({
        from:
          range.from + 5,
        to:
          range.to - 5,
      });
  };

  const zoomOut = () => {
    const range =
      chartRef.current
        ?.timeScale()
        .getVisibleLogicalRange();

    if (!range) return;

    chartRef.current
      .timeScale()
      .setVisibleLogicalRange({
        from:
          range.from - 5,
        to:
          range.to + 5,
      });
  };

  const resetZoom = () => {
    chartRef.current
      ?.timeScale()
      .fitContent();
  };

  return (
    <div className="relative">
      {hoveredCandle && (
        <div
          className="
          flex
          flex-wrap
          gap-5
          mb-4
          text-sm
          font-medium
          text-slate-300
          "
        >
          <span>
            O{" "}
            {hoveredCandle.open?.toFixed(
              2
            )}
          </span>

          <span>
            H{" "}
            {hoveredCandle.high?.toFixed(
              2
            )}
          </span>

          <span>
            L{" "}
            {hoveredCandle.low?.toFixed(
              2
            )}
          </span>

          <span>
            C{" "}
            {hoveredCandle.close?.toFixed(
              2
            )}
          </span>
        </div>
      )}

      <div
        className="
        absolute
        top-0
        right-0
        z-20
        flex
        gap-2
        "
      >
        <button
          onClick={zoomIn}
          className="
          p-2
          rounded-lg
          bg-slate-800
          hover:bg-slate-700
          text-white
          "
        >
          <Plus size={16} />
        </button>

        <button
          onClick={zoomOut}
          className="
          p-2
          rounded-lg
          bg-slate-800
          hover:bg-slate-700
          text-white
          "
        >
          <Minus size={16} />
        </button>

        <button
          onClick={resetZoom}
          className="
          p-2
          rounded-lg
          bg-slate-800
          hover:bg-slate-700
          text-white
          "
        >
          <RotateCcw
            size={16}
          />
        </button>
      </div>

      <div
        ref={chartContainerRef}
        className="
        w-full
        h-[550px]
        "
      />
    </div>
  );
}