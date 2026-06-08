import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown } from "lucide-react";
import StockSearch from "../components/ui/StockSearch";
import { useChart } from "../context/ChartContext";

interface MarketAsset {
  symbol: string;
  yahooSymbol: string;
  exchange: string;
  type: string;

  name: string;
  category: string;
  price: string;
  change: string;
  positive: boolean;
}

const marketData: MarketAsset[] = [
  // Stocks
      {
  symbol: "RELIANCE",
  yahooSymbol: "RELIANCE.NS",
  exchange: "NSE",
  type: "equity",

  name: "Reliance Ind.",
  category: "Stocks",
  price: "₹2,954.20",
  change: "+1.45%",
  positive: true
},
  {
  symbol: "AAPL",
  yahooSymbol: "AAPL",
  exchange: "NASDAQ",
  type: "equity",
  name: "Apple Inc.",
  category: "Stocks",
  price: "$150.25",
  change: "+2.15",
  positive: true
},
{
  symbol: "BTCUSD",
  yahooSymbol: "BTC-USD",
  exchange: "CRYPTO",
  type: "crypto",
  name: "Bitcoin",
  category: "Crypto",
  price: "$61,234.56",
  change: "+1,234.56",
  positive: true
},
{
  symbol: "XAUUSD",
  yahooSymbol: "GC=F",
  exchange: "COMEX",
  type: "commodity",
  name: "Gold",
  category: "Commodities",
  price: "$1,800.75",
  change: "+15.25",
  positive: true
}
];

export default function Markets() {
  const navigate = useNavigate();
  const { openChart } = useChart();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("All");

  const categories = [
    "All",
    "Stocks",
    "Crypto",
    "Forex",
    "Commodities",
  ];

  const filteredAssets = marketData.filter(
    (asset) => {
      const matchesSearch =
        asset.symbol
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        asset.name
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === "All" ||
        asset.category === activeCategory;

      return matchesSearch && matchesCategory;
    }
  );

  return (
    <div className="space-y-6">

      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold">
          Markets
        </h1>

        <p className="text-slate-500 mt-2">
          Explore Stocks, Crypto, Forex and
          Commodities.
        </p>
      </div>

      {/* Global Asset Search */}
<StockSearch
  placeholder="Search Markets"
  onSelect={(asset) => {
    openChart({
      symbol: asset.symbol,
      yahooSymbol:
        asset.yahooSymbol,
      name: asset.name,
      exchange:
        asset.exchange,
      type: asset.type,
    });
  }}
/>

      {/* Categories */}

      <div className="flex gap-3 flex-wrap">

        {categories.map((category) => (
          <button
            key={category}
            onClick={() =>
              setActiveCategory(category)
            }
            className={`
              px-4
              py-2
              rounded-xl
              font-medium
              transition-all

              ${
                activeCategory === category
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-100 dark:bg-night-800"
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Assets Grid */}

      <div
        className="
        grid
        md:grid-cols-2
        xl:grid-cols-3
        gap-4
        "
      >
        {filteredAssets.map((asset) => (
          <div
            key={asset.symbol}
            onClick={() =>
  openChart({
    symbol: asset.symbol,

    yahooSymbol:
      asset.category === "Crypto"
        ? `${asset.symbol.replace("USD", "")}-USD`
        : asset.symbol,

    name: asset.name,

    exchange:
      asset.category,

    type:
      asset.category.toLowerCase(),
  })
}
            className="
            cursor-pointer
            rounded-3xl
            border
            bg-white
            dark:bg-night-900
            p-5
            hover:shadow-xl
            hover:-translate-y-1
            transition-all
            "
          >
            <div className="flex justify-between">

              <div>
                <h3 className="font-bold text-lg">
                  {asset.symbol}
                </h3>

                <p className="text-sm text-slate-500">
                  {asset.name}
                </p>
              </div>

              <span
                className="
                text-xs
                px-3
                py-1
                rounded-full
                bg-slate-100
                dark:bg-night-800
                "
              >
                {asset.category}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-2xl font-bold">
                {asset.price}
              </p>

              <div
                className={`
                  flex
                  items-center
                  gap-2
                  mt-2

                  ${
                    asset.positive
                      ? "text-emerald-500"
                      : "text-red-500"
                  }
                `}
              >
                {asset.positive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}

                <span>
                  {asset.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}