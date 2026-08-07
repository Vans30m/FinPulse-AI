function isMarketOpen(
  timezone: string,
  openHour: number,
  openMinute: number,
  closeHour: number,
  closeMinute: number
) {
  const localTime = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: timezone,
    })
  );

  const day = localTime.getDay();

  // Weekend
  if (day === 0 || day === 6) {
    return false;
  }

  const currentMinutes =
    localTime.getHours() * 60 +
    localTime.getMinutes();

  const openMinutes =
    openHour * 60 + openMinute;

  const closeMinutes =
    closeHour * 60 + closeMinute;

  return (
    currentMinutes >= openMinutes &&
    currentMinutes <= closeMinutes
  );
}

function getForexStatus() {
  const utc = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "UTC",
    })
  );

  const day = utc.getUTCDay();
  const hour = utc.getUTCHours();

  // Forex closes Friday 22:00 UTC
  if (day === 5 && hour >= 22) {
    return "CLOSED";
  }

  // Saturday closed
  if (day === 6) {
    return "CLOSED";
  }

  // Sunday opens 22:00 UTC
  if (day === 0 && hour < 22) {
    return "CLOSED";
  }

  return "OPEN";
}

export default function MarketStatusBar() {
  const indiaOpen = isMarketOpen(
    "Asia/Kolkata",
    9,
    15,
    15,
    30
  );

  const usOpen = isMarketOpen(
    "America/New_York",
    9,
    30,
    16,
    0
  );

  const europeOpen = isMarketOpen(
    "Europe/London",
    8,
    0,
    16,
    30
  );

  const japanOpen = isMarketOpen(
    "Asia/Tokyo",
    9,
    0,
    15,
    0
  );

  const hongKongOpen = isMarketOpen(
    "Asia/Hong_Kong",
    9,
    30,
    16,
    0
  );

  const koreaOpen = isMarketOpen(
    "Asia/Seoul",
    9,
    0,
    15,
    30
  );

  const taiwanOpen = isMarketOpen(
    "Asia/Taipei",
    9,
    0,
    13,
    30
  );

  const canadaOpen = isMarketOpen(
    "America/Toronto",
    9,
    30,
    16,
    0
  );

  const australiaOpen = isMarketOpen(
    "Australia/Sydney",
    10,
    0,
    16,
    0
  );

  const chinaOpen = isMarketOpen(
    "Asia/Shanghai",
    9,
    30,
    15,
    0
  );

  const brazilOpen = isMarketOpen(
    "America/Sao_Paulo",
    10,
    0,
    17,
    55
  );

  const mexicoOpen = isMarketOpen(
    "America/Mexico_City",
    8,
    30,
    15,
    0
  );

  const singaporeOpen = isMarketOpen(
    "Asia/Singapore",
    9,
    0,
    17,
    0
  );

  const commoditiesOpen = isMarketOpen(
    "America/New_York",
    9,
    0,
    17,
    0
  );

  const forexStatus = getForexStatus();

  const markets = [
    {
      name: "India",
      symbol: "🇮🇳",
      status: indiaOpen ? "OPEN" : "CLOSED",
      color: indiaOpen
        ? "text-emerald-500"
        : "text-rose-500",
    },

    {
      name: "US",
      symbol: "🇺🇸",
      status: usOpen ? "OPEN" : "CLOSED",
      color: usOpen
        ? "text-emerald-500"
        : "text-rose-500",
    },

    {
      name: "Europe",
      symbol: "🇪🇺",
      status: europeOpen ? "OPEN" : "CLOSED",
      color: europeOpen
        ? "text-emerald-500"
        : "text-rose-500",
    },

    {
      name: "Japan",
      symbol: "🇯🇵",
      status: japanOpen ? "OPEN" : "CLOSED",
      color: japanOpen
        ? "text-emerald-500"
        : "text-rose-500",
    },

    {
      name: "Taiwan",
      symbol: "🇹🇼",
      status: taiwanOpen ? "OPEN" : "CLOSED",
      color: taiwanOpen ? "text-emerald-500" : "text-rose-500",
    },

    {
      name: "Hong Kong",
      symbol: "🇭🇰",
      status: hongKongOpen
        ? "OPEN"
        : "CLOSED",
      color: hongKongOpen
        ? "text-emerald-500"
        : "text-rose-500",
    },

    {
      name: "South Korea",
      symbol: "🇰🇷",
      status: koreaOpen
        ? "OPEN"
        : "CLOSED",
      color: koreaOpen
        ? "text-emerald-500"
        : "text-rose-500",
    },

    {
      name: "Canada",
      symbol: "🇨🇦",
      status: canadaOpen ? "OPEN" : "CLOSED",
      color: canadaOpen ? "text-emerald-500" : "text-rose-500",
    },

    {
      name: "Australia",
      symbol: "🇦🇺",
      status: australiaOpen ? "OPEN" : "CLOSED",
      color: australiaOpen ? "text-emerald-500" : "text-rose-500",
    },

    {
      name: "China",
      symbol: "🇨🇳",
      status: chinaOpen ? "OPEN" : "CLOSED",
      color: chinaOpen ? "text-emerald-500" : "text-rose-500",
    },

    {
      name: "Brazil",
      symbol: "🇧🇷",
      status: brazilOpen ? "OPEN" : "CLOSED",
      color: brazilOpen ? "text-emerald-500" : "text-rose-500",
    },

    {
      name: "Mexico",
      symbol: "🇲🇽",
      status: mexicoOpen ? "OPEN" : "CLOSED",
      color: mexicoOpen ? "text-emerald-500" : "text-rose-500",
    },

    {
      name: "Singapore",
      symbol: "🇸🇬",
      status: singaporeOpen ? "OPEN" : "CLOSED",
      color: singaporeOpen ? "text-emerald-500" : "text-rose-500",
    },

    {
      name: "Crypto",
      symbol: "₿",
      status: "24/7",
      color: "text-cyan-500",
    },

    {
      name: "Forex",
      symbol: "💱",
      status: forexStatus,
      color:
        forexStatus === "OPEN"
          ? "text-violet-500"
          : "text-rose-500",
    },

    {
      name: "Commodities",
      symbol: "🛢",
      status: commoditiesOpen ? "OPEN" : "CLOSED",
      color: commoditiesOpen ? "text-emerald-500" : "text-rose-500",
    },
  ];

  const scrollingMarkets = [
    ...markets,
    ...markets,
    ...markets,
  ];

  return (
    <div
      className="
      relative flex items-center overflow-hidden w-full h-12 md:h-14
      rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md
      dark:bg-night-900/70 dark:border-night-800
    "
    >
      <div className="flex w-full overflow-hidden">
        <div
          className="
          flex gap-2 md:gap-4 items-center animate-marquee whitespace-nowrap
          hover:[animation-play-state:paused]
          cursor-pointer select-none
        "
        >
          {scrollingMarkets.map(
            (market, index) => (
              <div
                key={`${market.name}-${index}`}
                className="
                flex items-center gap-1.5 md:gap-2.5 shrink-0
                rounded-xl px-2 py-1 md:px-3.5 md:py-1.5
                border border-slate-100
                dark:border-night-700/40
                bg-slate-50/80
                dark:bg-night-800/50
                transition-all duration-200
                hover:scale-105
              "
              >
                <span className="text-xs md:text-base leading-none">
                  {market.symbol}
                </span>

                <span
                  className="
                  text-[10px] md:text-xs font-bold
                  text-slate-700
                  dark:text-slate-300
                "
                >
                  {market.name}
                </span>

                <div
                  className={`flex items-center gap-1 px-1 py-0.5 md:px-1.5 md:py-0.5 rounded-md bg-current/10 ${market.color}`}
                >
                  <span
                    className={`
                    h-1 w-1 md:h-1.5 md:w-1.5 rounded-full
                    ${
                      market.status !==
                        "CLOSED" &&
                      market.status !== "24/7"
                        ? "animate-pulse"
                        : ""
                    }
                    bg-current
                  `}
                  />

                  <span
                    className="
                    text-[8px] md:text-[10px]
                    font-black
                    tracking-wide
                    uppercase
                  "
                  >
                    {market.status}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}