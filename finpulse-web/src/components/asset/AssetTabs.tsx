interface AssetTabsProps {
  tabs: string[];
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

export default function AssetTabs({ tabs, activeTab, onChangeTab }: AssetTabsProps) {
  const getTabLabel = (tab: string) => {
    const labelMap: Record<string, string> = {
      overview: "Overview",
      chart: "Interactive Chart",
      financials: "Financial Data",
      technicals: "Structural Levels",
      news: "News Feed",
      ai_analysis: "AI Sentiment",
      market_cap: "Market Cap",
      supply: "Token Supply",
      volume: "Trading Volume",
      high: "Day High",
      low: "Day Low",
      "52w_high": "52W High",
      "52w_low": "52W Low",
      open: "Open Price",
      previous_close: "Previous Close"
    };
    return labelMap[tab] || tab.replace("_", " ");
  };

  return (
    <div className="flex bg-slate-100/80 dark:bg-white/[0.02] p-1 rounded-2xl border border-slate-200/50 dark:border-white/5 text-xs font-bold shadow-inner overflow-x-auto custom-scrollbar gap-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChangeTab(tab)}
          className={`px-4 py-2.5 rounded-xl capitalize transition-all duration-300 whitespace-nowrap ${
            activeTab === tab
              ? "bg-white dark:bg-white/10 text-blue-600 dark:text-cyan-400 shadow-md border border-slate-200/60 dark:border-white/5"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          {getTabLabel(tab)}
        </button>
      ))}
    </div>
  );
}
