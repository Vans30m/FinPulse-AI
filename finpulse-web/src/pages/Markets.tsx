import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

interface MarketAsset {
  symbol: string;
  name: string;
  category: string;
  price: string;
  change: string;
  positive: boolean;
}

const marketData: MarketAsset[] = [
  // Stocks
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    category: "Stocks",
    price: "$175.43",
    change: "+0.68%",
    positive: true,
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    category: "Stocks",
    price: "$312.10",
    change: "-0.76%",
    positive: false,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    category: "Stocks",
    price: "$982.11",
    change: "+2.45%",
    positive: true,
  },

  // Crypto
  {
    symbol: "BTCUSD",
    name: "Bitcoin",
    category: "Crypto",
    price: "$64,200",
    change: "+1.90%",
    positive: true,
  },
  {
    symbol: "ETHUSD",
    name: "Ethereum",
    category: "Crypto",
    price: "$3,120",
    change: "+1.12%",
    positive: true,
  },

  // Forex
  {
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    category: "Forex",
    price: "1.0845",
    change: "-0.20%",
    positive: false,
  },
  {
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    category: "Forex",
    price: "1.2760",
    change: "+0.18%",
    positive: true,
  },

  // Commodities
  {
    symbol: "XAUUSD",
    name: "Gold",
    category: "Commodities",
    price: "$2,350",
    change: "+0.44%",
    positive: true,
  },
  {
    symbol: "XAGUSD",
    name: "Silver",
    category: "Commodities",
    price: "$30.15",
    change: "-0.11%",
    positive: false,
  },
];

export default function Markets() {
  const navigate = useNavigate();

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

      {/* Search */}

      <div className="relative">

        <Search
          className="
          absolute
          left-4
          top-1/2
          -translate-y-1/2
          h-4
          w-4
          text-slate-400
          "
        />

        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="
          w-full
          pl-11
          pr-4
          py-3
          rounded-2xl
          border
          bg-white
          dark:bg-night-900
          "
        />
      </div>

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
              navigate(
                `/asset/${asset.symbol}`
              )
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