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
    <div className="flex bg-[#0D0D0D] p-1 rounded-md border border-[#242424] text-xs font-semibold overflow-x-auto custom-scrollbar gap-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChangeTab(tab)}
          className={`px-3 py-1.5 rounded uppercase tracking-wide transition-all duration-150 whitespace-nowrap ${
            activeTab === tab
              ? "bg-[#1C1C1C] text-[#F5F5F5] border border-[#2A2A2A]"
              : "bg-[#141414] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#1C1C1C] border border-transparent"
          }`}
        >
          {getTabLabel(tab)}
        </button>
      ))}
    </div>
  );
}
