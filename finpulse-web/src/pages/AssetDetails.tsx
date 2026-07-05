import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getFundamentals,
  getFinancialHealth,
  getTechnicals,
  getCompanyNews,
  getAIScore
} from "../services/marketService";
import { ArrowLeft } from "lucide-react";

import AssetOverview from "../components/asset/AssetOverview";
import AssetTabs from "../components/asset/AssetTabs";
import TechnicalCard from "../components/asset/TechnicalCard";
import FinancialCard from "../components/asset/FinancialCard";
import AISummaryCard from "../components/asset/AISummaryCard";
import CandlestickChart from "../components/charts/CandlestickChart";

function resolveSymbolType(symbol: string): "Stock" | "Index" | "Crypto" | "Forex" | "Commodities" {
  if (!symbol) return "Stock";
  const upper = symbol.toUpperCase();
  if (upper.endsWith("=X")) return "Forex";
  if (upper.endsWith("-USD")) return "Crypto";
  if (upper.endsWith("=F")) return "Commodities";
  if (upper.startsWith("^") || upper.endsWith(".NS")) return "Index";
  return "Stock";
}

function resolveExchangeLocation(symbol: string, assetType: string, stateExchange?: string): string {
  if (stateExchange) return stateExchange;
  if (assetType === "Crypto") return "BINANCE";
  if (assetType === "Forex") return "FOREX";
  if (assetType === "Commodities") return "COMMODITIES";
  if (assetType === "Index") {
    const upper = symbol.toUpperCase();
    if (upper.endsWith(".NS") || upper.endsWith(".BO") || upper.startsWith("^CNX") || upper.startsWith("^NSE") || upper.startsWith("^BSESN")) {
      return "Domestic";
    }
    const usIndices = ["^GSPC", "^IXIC", "^DJI", "^RUT", "^NDX", "^VIX"];
    if (usIndices.includes(upper)) {
      return "US";
    }
    return "GLOBAL";
  }
  return "GLOBAL";
}

export default function AssetDetails() {
  const { symbol = "AAPL" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const assetType = resolveSymbolType(symbol);
  
  const [assetName, setAssetName] = useState(
    location.state?.name || symbol
  );
  
  const assetExchange = resolveExchangeLocation(symbol, assetType, location.state?.exchange);

  const tabsMap: Record<string, string[]> = {
    Stock: ["overview", "chart", "financials", "technicals", "ai_analysis"],
    Index: ["overview", "chart", "technicals", "ai_analysis"],
    Crypto: ["overview", "chart", "ai_analysis"],
    Forex: ["overview", "chart", "ai_analysis"],
    Commodities: ["overview", "chart"]
  };
  const tabs = tabsMap[assetType] || ["overview", "chart"];

  const [activeTab, setActiveTab] = useState("overview");
  const [timeframe] = useState("1D");

  const [quoteData, setQuoteData] = useState<{
    price: number;
    change: number;
    changePercent: number;
    open?: number;
    previousClose?: number;
    dayHigh?: number;
    dayLow?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    volume?: number;
    marketCap?: number;
    circulatingSupply?: number;
    currency?: string;
    marketState?: string;
  }>({
    price: location.state?.price || 150.00,
    change: location.state?.change || 0.00,
    changePercent: location.state?.changePercent || 0.00,
  });

  const [financials, setFinancials] = useState<any>(null);
  const [technicals, setTechnicals] = useState<any>(null);
  const [_news, setNews] = useState<any[]>([]);
  const [aiScore, setAiScore] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchBaseQuote = async () => {
      try {
        const fundData = await getFundamentals(symbol);
        if (fundData) {
          if (fundData?.name) {
            setAssetName(fundData.name);
          }
          setQuoteData(prev => ({
            ...prev,
            price: fundData.price || prev.price || 150.0,
            change: fundData.change !== undefined ? fundData.change : prev.change,
            changePercent: fundData.changePercent !== undefined ? fundData.changePercent : prev.changePercent,
            open: fundData.open,
            previousClose: fundData.previousClose,
            dayHigh: fundData.dayHigh,
            dayLow: fundData.dayLow,
            fiftyTwoWeekHigh: fundData.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: fundData.fiftyTwoWeekLow,
            volume: fundData.volume,
            marketCap: fundData.marketCap,
            circulatingSupply: fundData.circulatingSupply,
            currency: fundData.currency || "USD",
            marketState: fundData.marketState
          }));
        }
      } catch (e) {
        console.error("Failed to load initial quote data", e);
      }
    };

    fetchBaseQuote();
  }, [symbol]);

  useEffect(() => {
    const fetchTabDetails = async () => {
      setLoadingDetails(true);
      try {
        if (activeTab === "financials") {
          const finData = await getFinancialHealth(symbol);
          const fundData = await getFundamentals(symbol);
          setFinancials({ ...finData, peRatio: fundData?.peRatio, eps: fundData?.eps });
        } else if (activeTab === "technicals") {
          const techData = await getTechnicals(symbol);
          setTechnicals(techData);
        } else if (activeTab === "news") {
          const newsData = await getCompanyNews(symbol);
          setNews(newsData);
        } else if (activeTab === "ai_analysis") {
          const aiData = await getAIScore(symbol);
          setAiScore(aiData);
        }
      } catch (err) {
        console.error("Details fetch failed for tab", activeTab, err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchTabDetails();
  }, [symbol, activeTab]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 transition-colors">

      {/* Navigation Row */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold bg-white dark:bg-night-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3]" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Tab Controller Space */}
      <div className="w-full space-y-6">
        <AssetTabs
          tabs={tabs}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />

        <div className="transition-all duration-300">
          {activeTab === "chart" && (
            <CandlestickChart symbol={symbol} timeframe={timeframe} />
          )}

          {activeTab === "overview" && (
            <AssetOverview
              name={assetName}
              symbol={symbol}
              price={quoteData.price}
              open={quoteData.open}
              previousClose={quoteData.previousClose}
              dayHigh={quoteData.dayHigh}
              dayLow={quoteData.dayLow}
              fiftyTwoWeekHigh={quoteData.fiftyTwoWeekHigh}
              fiftyTwoWeekLow={quoteData.fiftyTwoWeekLow}
              volume={quoteData.volume}
              marketCap={quoteData.marketCap}
              currency={quoteData.currency}
              exchange={assetExchange}
              assetType={assetType}
            />
          )}

          {activeTab === "financials" && (
            <FinancialCard data={financials} loading={loadingDetails} />
          )}

          {activeTab === "technicals" && (
            <TechnicalCard data={technicals} loading={loadingDetails} />
          )}

          {activeTab === "ai_analysis" && (
            <AISummaryCard
              symbol={symbol}
              support={quoteData.dayLow || quoteData.price * 0.98}
              resistance={quoteData.dayHigh || quoteData.price * 1.02}
              recommendation={aiScore?.verdict || "HOLD"}
              score={aiScore?.score || 65}
            />
          )}
        </div>
      </div>

    </div>
  );
}