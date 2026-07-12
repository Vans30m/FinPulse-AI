import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Newspaper,
  Brain,
  Activity,
  TrendingUp,
  Briefcase,
  ExternalLink,
  Compass,
  Layers,
  Calendar,
  Users,
  Scissors,
  DollarSign
} from "lucide-react";
import {
  getUnifiedAssetDetails,
  getFundamentals,
  getTechnicals,
  getAIScore
} from "../services/marketService";
import CandlestickChart from "../components/charts/CandlestickChart";
import { ChartHeader } from "../components/charts/ChartHeader";
import { isIndexSymbol } from "../utils/assetUtils";

import AssetOverview from "../components/asset/AssetOverview";
import AssetTabs from "../components/asset/AssetTabs";
import TechnicalCard from "../components/asset/TechnicalCard";
import AISummaryCard from "../components/asset/AISummaryCard";

type TabType =
  | "overview"
  | "financials"
  | "analysts"
  | "sentiment"
  | "events"
  | "ownership"
  | "technicals"
  | "performance"
  | "news";

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

function IndexDetails({ symbol }: { symbol: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeframe] = useState("1D");
  const [assetName, setAssetName] = useState(
    location.state?.name || symbol
  );

  const assetExchange = resolveExchangeLocation(symbol, "Index", location.state?.exchange);

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
    currency?: string;
    marketState?: string;
  }>({
    price: location.state?.price || 0.00,
    change: location.state?.change || 0.00,
    changePercent: location.state?.changePercent || 0.00,
  });

  const [technicals, setTechnicals] = useState<any>(null);
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
            price: fundData.price || prev.price || 0.0,
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
            currency: fundData.currency || "USD",
            marketState: fundData.marketState
          }));
        }
      } catch (e) {
        console.error("Failed to load initial quote data for index", e);
      }
    };

    fetchBaseQuote();
  }, [symbol]);

  useEffect(() => {
    const fetchTabDetails = async () => {
      setLoadingDetails(true);
      try {
        if (activeTab === "technicals") {
          const techData = await getTechnicals(symbol);
          setTechnicals(techData);
        } else if (activeTab === "ai_analysis") {
          const aiData = await getAIScore(symbol);
          setAiScore(aiData);
        }
      } catch (err) {
        console.error("Details fetch failed for index tab", activeTab, err);
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3]" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Tab Controller Space */}
      <div className="w-full space-y-6">
        <AssetTabs
          tabs={["overview", "chart", "technicals", "ai_analysis"]}
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
              assetType="Index"
            />
          )}

          {activeTab === "technicals" && (
            <TechnicalCard
              data={technicals}
              loading={loadingDetails}
              price={quoteData.price}
              dayHigh={quoteData.dayHigh}
              dayLow={quoteData.dayLow}
              previousClose={quoteData.previousClose}
            />
          )}

          {activeTab === "ai_analysis" && (
            <AISummaryCard
              symbol={symbol}
              support={quoteData.dayLow || quoteData.price * 0.98}
              resistance={quoteData.dayHigh || quoteData.price * 1.02}
              recommendation={(aiScore?.recommendation || aiScore?.verdict || "HOLD") as any}
              trend={aiScore?.trend || "Neutral"}
              momentum={aiScore?.momentum || "Neutral Momentum"}
              score={aiScore?.score || 65}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssetDetails() {
  const { symbol = "AAPL" } = useParams();
  const navigate = useNavigate();

  if (isIndexSymbol(symbol)) {
    return <IndexDetails symbol={symbol} />;
  }

  const tabContentRef = useRef<HTMLDivElement>(null);

  const assetType = useMemo(() => {
    const upper = symbol.toUpperCase();
    if (upper.endsWith("-USD")) return "Crypto";
    if (upper.endsWith("=X")) return "Forex";
    if (upper.endsWith("=F")) return "Commodities";
    return "Stock";
  }, [symbol]);

  const isSpecialAsset = assetType === "Crypto" || assetType === "Forex" || assetType === "Commodities";

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const upper = symbol.toUpperCase();
    const special = upper.endsWith("-USD") || upper.endsWith("=X") || upper.endsWith("=F");
    return special ? "sentiment" : "overview";
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [hasComparison, setHasComparison] = useState(false);
  const [timeframe, setTimeframe] = useState("1Y");

  useEffect(() => {
    if (isSpecialAsset) {
      setActiveTab("sentiment");
    } else {
      setActiveTab("overview");
    }
  }, [symbol, isSpecialAsset]);

  const availableTabs = useMemo(() => {
    const allTabs = [
      { id: "overview", label: "Overview", icon: Layers },
      { id: "financials", label: "Financials", icon: Briefcase },
      { id: "analysts", label: "Analyst Targets", icon: Compass },
      { id: "sentiment", label: "Stock Sentiment", icon: Brain },
      { id: "ownership", label: "Ownership", icon: Users },
      { id: "events", label: "Calendar Events", icon: Calendar },
      { id: "technicals", label: "Structural Levels", icon: Activity },
      { id: "performance", label: "Performance", icon: TrendingUp },
      { id: "news", label: "News Feed", icon: Newspaper }
    ];
    if (isSpecialAsset) {
      return allTabs.filter(tab =>
        tab.id !== "overview" &&
        tab.id !== "financials" &&
        tab.id !== "analysts" &&
        tab.id !== "ownership" &&
        tab.id !== "events"
      );
    }
    return allTabs;
  }, [isSpecialAsset]);

  // Financials state
  const [financialsPeriod, setFinancialsPeriod] = useState<"annual" | "quarterly">("annual");
  const [financialsTab, setFinancialsTab] = useState<"income" | "balance" | "cashflow">("income");

  useEffect(() => {
    if (!symbol) return;

    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const unifiedData = await getUnifiedAssetDetails(symbol);
        setData(unifiedData);

        const newMeta = {
          name: unifiedData.profile?.name || symbol,
          exchange: unifiedData.quote?.exchangeName || "GLOBAL",
          price: unifiedData.statistics?.price || 0,
          change: unifiedData.statistics?.change || 0,
          changePercent: unifiedData.statistics?.changePercent || 0,
          marketState: unifiedData.quote?.marketState || "CLOSED",
          currency: unifiedData.quote?.currency || "USD",
          performance: unifiedData.statistics?.performance || null
        };
        setMeta(newMeta);
      } catch (err: any) {
        console.error("Failed to load unified asset details:", err);
        setError("Failed to load asset details from Yahoo Finance.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [symbol]);

  // Format currency helpers
  const formatVal = (val: any, isCurrency = false, isPercent = false) => {
    if (val === undefined || val === null || val === "Not Available") return "N/A";
    const num = Number(val);
    if (isNaN(num)) return val;

    const getCurrencySymbol = (code: string) => {
      try {
        return (0).toLocaleString("en-US", {
          style: "currency",
          currency: code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).replace(/\d/g, "").trim();
      } catch {
        return "$";
      }
    };
    const currencySymbol = getCurrencySymbol(meta?.currency || "USD");

    if (isPercent) {
      return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
    }

    if (isCurrency) {
      if (Math.abs(num) >= 1e12) {
        return `${currencySymbol}${(num / 1e12).toFixed(2)}T`;
      }
      if (Math.abs(num) >= 1e9) {
        return `${currencySymbol}${(num / 1e9).toFixed(2)}B`;
      }
      if (Math.abs(num) >= 1e6) {
        return `${currencySymbol}${(num / 1e6).toFixed(2)}M`;
      }
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: meta?.currency || "USD"
      }).format(num);
    }

    if (Math.abs(num) >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  // Derive dynamic sentiment
  const sentiment = useMemo(() => {
    if (!data) return { score: 50, label: "Neutral", reasons: ["No coverage available"] };
    if (data.sentiment) {
      return {
        score: Number(data.sentiment.score ?? 50),
        label: String(data.sentiment.label ?? "Neutral"),
        reasons: Array.isArray(data.sentiment.reasons) ? data.sentiment.reasons : ["No coverage available"]
      };
    }
    let score = 50;
    const reasons: string[] = [];

    const recMean = Number(data.analysts?.recommendationMean);
    if (recMean > 0) {
      if (recMean <= 2) {
        score += 15;
        reasons.push("Strong analyst consensus buy rating");
      } else if (recMean >= 4) {
        score -= 15;
        reasons.push("Analyst consensus sell rating");
      }
    }

    const price = Number(data.statistics?.price);
    const dma50 = Number(data.statistics?.fiftyDayAverage);
    const dma200 = Number(data.statistics?.twoHundredDayAverage);

    if (price > 0 && dma200 > 0) {
      if (price > dma200) {
        score += 10;
        reasons.push("Trading above long-term 200 DMA");
      } else {
        score -= 10;
        reasons.push("Trading below long-term 200 DMA");
      }
    }

    if (price > 0 && dma50 > 0) {
      if (price > dma50) {
        score += 10;
        reasons.push("Trading above short-term 50 DMA");
      } else {
        score -= 10;
        reasons.push("Trading below short-term 50 DMA");
      }
    }

    const margin = Number(data.financialHealth?.profitMargin);
    if (margin > 0.15) {
      score += 10;
      reasons.push("Healthy profit margin above 15%");
    }

    const label = score >= 65 ? "Bullish" : score <= 35 ? "Bearish" : "Neutral";
    return { score: Math.min(Math.max(score, 0), 100), label, reasons };
  }, [data]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3]" />
          <span>Back</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="bg-[#0a0d1d]/60 border border-slate-850 p-6 rounded-2xl backdrop-blur-md">
        {meta ? (
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
        ) : (
          <div className="text-slate-400 font-medium animate-pulse">Loading stock details...</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left Side: Chart Terminal Frame */}
        <div className="bg-[#090d1a] border border-slate-900 rounded-2xl flex flex-col overflow-hidden shadow-inner">
          {/* Live Core Chart Port */}
          <div className="flex-1 min-h-[380px] relative p-2 bg-[#060812]">
            <CandlestickChart
              symbol={symbol}
              timeframe={timeframe}
              onCompareChange={(compareSym) => setHasComparison(!!compareSym)}
              onMetaLoaded={setMeta}
            />
          </div>
        </div>

        {/* Right Side Sidebar Analytics */}
        <div className="space-y-4">
          {/* Tab Navigation Menu */}
          <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-900/60 pb-2 mb-3">
              <span className="text-xs font-bold text-slate-350 tracking-wide">Navigation Control</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setTimeout(() => {
                      tabContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 80);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-left transition-all flex items-center gap-2.5 ${activeTab === tab.id
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                    }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SUB-TAB METRIC ARRAYS ==================== */}
      <div ref={tabContentRef} className="pt-4 border-t border-slate-900">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10 text-rose-500">{error}</div>
        ) : (
          <div>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && data && (
              <div className="space-y-6">
                <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md">
                  <h3 className="text-sm font-black uppercase text-slate-300 border-b border-slate-900 pb-3 mb-4">
                    Company Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-450">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Sector</span>
                      <span className="text-sm font-bold text-slate-300 mt-1 block">{data.profile.sector}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Industry</span>
                      <span className="text-sm font-bold text-slate-300 mt-1 block">{data.profile.industry}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Country</span>
                      <span className="text-sm font-bold text-slate-300 mt-1 block">{data.profile.country}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Employees</span>
                      <span className="text-sm font-bold text-slate-300 mt-1 block">{formatVal(data.profile.employees)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">CEO</span>
                      <span className="text-sm font-bold text-slate-300 mt-1 block">{data.profile.ceo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Website</span>
                      {data.profile.website !== "Not Available" ? (
                        <a
                          href={data.profile.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 mt-1"
                        >
                          <span>Visit Website</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-sm font-bold text-slate-300 mt-1 block">N/A</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-450 leading-relaxed mt-6 pt-6 border-t border-slate-900/60">
                    {data.profile.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Statistics Grid */}
                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-300 border-b border-slate-900 pb-2">
                      Key Ratios & Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">Market Cap</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.statistics.marketCap, true)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">EV</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.statistics.enterpriseValue, true)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">Shares Outstanding</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.statistics.sharesOutstanding)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">PE Ratio</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.statistics.pe)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">Forward PE</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.statistics.forwardPe)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">PEG Ratio</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.statistics.peg)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">Beta</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.statistics.beta)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">Dividend Yield</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.statistics.dividendYield * 100, false, true)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Health Grid */}
                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-300 border-b border-slate-900 pb-2">
                      Financial Condition
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">Total Cash</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.cash, true)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">Total Debt</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.debt, true)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">Revenue</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.revenue, true)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">EBITDA</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.ebitda, true)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">Operating Margin</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.operatingMargin * 100, false, true)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500">Profit Margin</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.profitMargin * 100, false, true)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FINANCIALS TAB */}
            {activeTab === "financials" && data && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#090d1a] border border-slate-900 p-4 rounded-xl">
                  <div className="flex gap-2">
                    {["income", "cashflow"].map((ft) => (
                      <button
                        key={ft}
                        onClick={() => setFinancialsTab(ft as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${financialsTab === ft
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                          : "text-slate-450 hover:text-white"
                          }`}
                      >
                        {ft}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {["annual", "quarterly"].map((fp) => (
                      <button
                        key={fp}
                        onClick={() => setFinancialsPeriod(fp as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${financialsPeriod === fp
                          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
                          : "text-slate-450 hover:text-white"
                          }`}
                      >
                        {fp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Highlight Summary Cards */}
                {(() => {
                  const moduleKey = `${financialsTab}StatementHistory${financialsPeriod === "quarterly" ? "Quarterly" : ""}`;
                  const baseKey = financialsTab === "income"
                    ? "incomeStatementHistory"
                    : "cashflowStatements";
                  const reports = data.financials?.[moduleKey]?.[baseKey] || data.financials?.[moduleKey]?.statements || [];
                  if (reports.length === 0) return null;

                  const reportLatest = reports[0];
                  const reportPrev = reports[1];

                  const title1 = financialsTab === "income" ? "Latest Total Revenue" : "Latest Operating Cash Flow";
                  const val1 = reportLatest?.totalRevenue ?? reportLatest?.totalCashFlowsFromOperatingActivities ?? (financialsTab === "income" ? data.financialHealth?.revenue : data.financialHealth?.operatingCashFlow);
                  const prevVal1 = reportPrev?.totalRevenue ?? reportPrev?.totalCashFlowsFromOperatingActivities;

                  const title2 = financialsTab === "income" ? "Latest Net Income" : "Latest Net Cash Flow";
                  const val2 = reportLatest?.netIncome ?? reportLatest?.netIncomeFromContinuingOperations ?? (financialsTab === "income" ? data.financialHealth?.netIncome : data.financialHealth?.freeCashFlow);
                  const prevVal2 = reportPrev?.netIncome ?? reportPrev?.netIncomeFromContinuingOperations;

                  const getGrowth = (latest: number | undefined, prev: number | undefined) => {
                    if (latest === undefined || prev === undefined || prev === 0) return null;
                    const pct = ((latest - prev) / Math.abs(prev)) * 100;
                    return pct;
                  };

                  const pct1 = getGrowth(val1, prevVal1);
                  const pct2 = getGrowth(val2, prevVal2);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Card 1 */}
                      <div className="bg-gradient-to-br from-[#0a0d1e] to-[#05070e] border border-blue-500/10 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">{title1}</span>
                          <h4 className="text-2xl font-black text-white font-mono mt-2">{formatVal(val1, true)}</h4>
                        </div>
                        {pct1 !== null && (
                          <div className="mt-4 flex items-center gap-2">
                            <span className={`text-xs font-mono font-black px-1.5 py-0.5 rounded ${pct1 >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {pct1 >= 0 ? '↑ +' : '↓ '}{pct1.toFixed(2)}%
                            </span>
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">vs previous period</span>
                          </div>
                        )}
                      </div>

                      {/* Card 2 */}
                      <div className="bg-gradient-to-br from-[#0a0d1e] to-[#05070e] border border-emerald-500/10 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">{title2}</span>
                          <h4 className="text-2xl font-black text-white font-mono mt-2">{formatVal(val2, true)}</h4>
                        </div>
                        {pct2 !== null && (
                          <div className="mt-4 flex items-center gap-2">
                            <span className={`text-xs font-mono font-black px-1.5 py-0.5 rounded ${pct2 >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {pct2 >= 0 ? '↑ +' : '↓ '}{pct2.toFixed(2)}%
                            </span>
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">vs previous period</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Multi-column Financials Data Table */}
                <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      {(() => {
                        const moduleKey = `${financialsTab}StatementHistory${financialsPeriod === "quarterly" ? "Quarterly" : ""}`;
                        const baseKey = financialsTab === "income"
                          ? "incomeStatementHistory"
                          : "cashflowStatements";
                        const reports = data.financials?.[moduleKey]?.[baseKey] || data.financials?.[moduleKey]?.statements || [];
                        if (reports.length === 0) return null;

                        return (
                          <tr className="border-b border-slate-800 text-slate-500 font-sans">
                            <th className="py-3 font-black uppercase text-[10px] tracking-wider">Statement Item</th>
                            {reports.map((report: any, idx: number) => {
                              const d = new Date(report.endDate || report.date);
                              const label = financialsPeriod === "quarterly"
                                ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                                : d.getFullYear().toString();
                              return (
                                <th key={idx} className="py-3 text-right font-black uppercase text-[10px] tracking-wider">
                                  {label}
                                </th>
                              );
                            })}
                            <th className="py-3 text-right font-black uppercase text-[10px] tracking-wider pl-4">Trend</th>
                          </tr>
                        );
                      })()}
                    </thead>
                    <tbody>
                      {(() => {
                        const moduleKey = `${financialsTab}StatementHistory${financialsPeriod === "quarterly" ? "Quarterly" : ""}`;
                        const baseKey = financialsTab === "income"
                          ? "incomeStatementHistory"
                          : "cashflowStatements";
                        const reports = data.financials?.[moduleKey]?.[baseKey] || data.financials?.[moduleKey]?.statements || [];
                        if (reports.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-4 text-center text-slate-500 font-sans">
                                No Statement Data Available
                              </td>
                            </tr>
                          );
                        }

                        const keys = Object.keys(reports[0]).filter(
                          (k) => k !== "date" && k !== "maxAge" && k !== "endDate"
                        );

                        return keys.map((key) => {
                          const valLatest = reports[0]?.[key];
                          const valPrev = reports[1]?.[key];
                          let trendBadge = null;

                          if (typeof valLatest === 'number' && typeof valPrev === 'number' && valPrev !== 0) {
                            const pct = ((valLatest - valPrev) / Math.abs(valPrev)) * 100;
                            const isPositive = pct >= 0;
                            trendBadge = (
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black font-mono leading-none ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                                }`}>
                                {isPositive ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
                              </span>
                            );
                          }

                          return (
                            <tr key={key} className="border-b border-slate-900/40 hover:bg-slate-900/20 group transition-colors">
                              <td className="py-3 font-sans capitalize text-slate-400 group-hover:text-slate-200 transition-colors">
                                {key.replace(/([A-Z])/g, ' $1')}
                              </td>
                              {reports.map((report: any, idx: number) => (
                                <td key={idx} className={`py-3 text-right font-bold transition-colors ${idx === 0 ? 'text-slate-200 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-350'
                                  }`}>
                                  {formatVal(report[key], true)}
                                </td>
                              ))}
                              <td className="py-3 text-right pl-4">
                                {trendBadge || <span className="text-slate-600 font-sans">-</span>}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ANALYST TARGETS */}
            {activeTab === "analysts" && data && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Panel 1: Rating Metrics & Consensus Gauge */}
                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
                    <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-2 mb-6 tracking-wider">
                      Analyst Recommendation Rating
                    </h4>

                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Consensus Rating</span>
                        <span className="text-3xl font-black text-white mt-1 block capitalize font-sans">
                          {data.analysts.recommendationKey}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Mean Score (1-5)</span>
                        <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono">
                          {typeof data.analysts.recommendationMean === 'number'
                            ? data.analysts.recommendationMean.toFixed(2)
                            : data.analysts.recommendationMean}
                        </span>
                      </div>
                    </div>

                    {/* Consensus Gauge Track */}
                    {typeof data.analysts.recommendationMean === 'number' && (
                      <div className="space-y-4 mb-6">
                        <div className="relative h-2 bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500 rounded-full w-full">
                          {/* Glowing Pointer */}
                          <div
                            className="absolute -top-1.5 -ml-2.5 w-5 h-5 bg-white border-2 border-slate-950 rounded-full shadow-lg shadow-white/30 flex items-center justify-center transition-all duration-500"
                            style={{ left: `${Math.max(0, Math.min(100, ((data.analysts.recommendationMean - 1) / 4) * 100))}%` }}
                          >
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          </div>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500 font-black uppercase tracking-wider">
                          <span>Strong Buy (1.0)</span>
                          <span>Hold (3.0)</span>
                          <span>Strong Sell (5.0)</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-[#0c1022] p-4 rounded-xl border border-slate-900/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Coverage Pool</span>
                        <span className="text-slate-300 text-xs mt-0.5 block font-sans">Based on professional analyst evaluations</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-white font-mono">{data.analysts.numberOfAnalysts}</span>
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Analysts</span>
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Price Targets Spectrum */}
                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
                    <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-2 mb-6 tracking-wider">
                      Price Target Thresholds
                    </h4>

                    {/* Price Targets Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-8">
                      <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/40 text-center">
                        <span className="text-[9px] text-slate-500 uppercase font-black block">Low</span>
                        <span className="text-xs font-black font-mono text-white block mt-1">
                          {formatVal(data.analysts.targetLow, true)}
                        </span>
                      </div>
                      <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/40 text-center">
                        <span className="text-[9px] text-slate-500 uppercase font-black block">Median</span>
                        <span className="text-xs font-black font-mono text-white block mt-1">
                          {formatVal(data.analysts.targetMedian, true)}
                        </span>
                      </div>
                      <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/40 text-center">
                        <span className="text-[9px] text-slate-500 uppercase font-black block">Mean</span>
                        <span className="text-xs font-black font-mono text-white block mt-1">
                          {formatVal(data.analysts.targetMeanPrice, true)}
                        </span>
                      </div>
                      <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/40 text-center">
                        <span className="text-[9px] text-slate-500 uppercase font-black block">High</span>
                        <span className="text-xs font-black font-mono text-white block mt-1">
                          {formatVal(data.analysts.targetHigh, true)}
                        </span>
                      </div>
                    </div>

                    {/* Price Target spectrum visualization */}
                    {(() => {
                      const low = Number(data.analysts.targetLow);
                      const high = Number(data.analysts.targetHigh);
                      const current = Number(data.statistics.price);
                      const median = Number(data.analysts.targetMedian);

                      if (isNaN(low) || isNaN(high) || isNaN(current) || low === 0 || high === 0) return null;

                      // Calculate percentage positions
                      const minVal = Math.min(low, current) * 0.95;
                      const maxVal = Math.max(high, current) * 1.05;
                      const range = maxVal - minVal;

                      const getPct = (val: number) => ((val - minVal) / range) * 100;

                      const currentPct = getPct(current);
                      const lowPct = getPct(low);
                      const medianPct = getPct(median);
                      const highPct = getPct(high);

                      return (
                        <div className="relative h-24 w-full mt-10">
                          {/* Track bar */}
                          <div className="absolute top-12 left-0 right-0 h-1.5 bg-slate-800 rounded-full" />

                          {/* Target range highlight track */}
                          <div
                            className="absolute top-12 h-1.5 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-emerald-500/40 rounded-full"
                            style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
                          />

                          {/* Low Marker Anchor & Label */}
                          <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${lowPct}%` }}>
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">Low</span>
                            <span className="text-[10px] font-black text-slate-300 font-mono mt-0.5">{formatVal(low, true)}</span>
                            <div className="w-0.5 h-3.5 bg-blue-500/40 my-0.5" />
                            <div className="w-3.5 h-3.5 bg-blue-500 border-2 border-slate-900 rounded-full shadow-md shadow-blue-500/30" />
                          </div>

                          {/* Median Marker Anchor & Label */}
                          <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${medianPct}%` }}>
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider">Median</span>
                            <span className="text-[10px] font-black text-slate-300 font-mono mt-0.5">{formatVal(median, true)}</span>
                            <div className="w-0.5 h-3.5 bg-purple-500/40 my-0.5" />
                            <div className="w-3.5 h-3.5 bg-purple-500 border-2 border-slate-900 rounded-full shadow-md shadow-purple-500/30" />
                          </div>

                          {/* High Marker Anchor & Label */}
                          <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${highPct}%` }}>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">High</span>
                            <span className="text-[10px] font-black text-slate-300 font-mono mt-0.5">{formatVal(high, true)}</span>
                            <div className="w-0.5 h-3.5 bg-emerald-500/40 my-0.5" />
                            <div className="w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-md shadow-emerald-500/30" />
                          </div>

                          {/* Current Price Pointer */}
                          <div className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-10" style={{ left: `${currentPct}%` }}>
                            <span className="text-[9px] font-black text-slate-900 bg-white px-1.5 py-0.5 rounded uppercase shadow-md leading-none tracking-wider">Current</span>
                            <span className="text-[10px] font-black text-white font-mono mt-0.5">{formatVal(current, true)}</span>
                            <div className="w-0.5 h-3.5 bg-white/70 my-0.5" />
                            <div className="w-2.5 h-4 bg-white border border-slate-950 shadow-md shadow-white/50 rounded-full" />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* MARKET SENTIMENT */}
            {activeTab === "sentiment" && data && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md flex flex-col items-center justify-center">
                    <span className="text-xs font-black uppercase text-slate-500">Sentiment Score</span>
                    <span className="text-5xl font-black text-white mt-4 font-mono">{sentiment.score}%</span>
                    <span className={`text-sm font-black uppercase mt-3 tracking-wide ${sentiment.label === "Bullish" ? "text-emerald-400" : sentiment.label === "Bearish" ? "text-rose-400" : "text-amber-500"
                      }`}>
                      {sentiment.label}
                    </span>
                  </div>

                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md col-span-2 space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-2">
                      Sentiment Analysis Parameters
                    </h4>
                    <ul className="space-y-3 text-xs text-slate-300">
                      {sentiment.reasons.map((reason: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* OWNERSHIP TAB */}
            {activeTab === "ownership" && data && (
              <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md space-y-6">
                <h3 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-3 tracking-wider">
                  Share Ownership Breakdown
                </h3>

                {(() => {
                  const inst = Number(data.ownership.institutionOwnership) * 100 || 0;
                  const insider = Number(data.ownership.insiderOwnership) * 100 || 0;
                  const retail = Math.max(0, 100 - (inst + insider));
                  const instFloat = Number(data.ownership.institutionsFloatPercentHeld) * 100 || 0;
                  const instCount = data.ownership.institutionsCount || "N/A";

                  return (
                    <div className="space-y-6">
                      {/* Visual Progress Bar Chart */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-450 uppercase font-black tracking-wider">
                          <span>Holding Distribution</span>
                          <span>Total: 100%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-3 flex overflow-hidden border border-slate-900">
                          {inst > 0 && (
                            <div style={{ width: `${inst}%` }} className="bg-cyan-500 h-full transition-all duration-500" title={`Institutions: ${inst.toFixed(2)}%`} />
                          )}
                          {insider > 0 && (
                            <div style={{ width: `${insider}%` }} className="bg-purple-500 h-full transition-all duration-500" title={`Insiders: ${insider.toFixed(2)}%`} />
                          )}
                          {retail > 0 && (
                            <div style={{ width: `${retail}%` }} className="bg-emerald-500 h-full transition-all duration-500" title={`Retail/Public: ${retail.toFixed(2)}%`} />
                          )}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-cyan-500 inline-block rounded-full" />
                            Institutions ({inst.toFixed(2)}%)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-purple-500 inline-block rounded-full" />
                            Corporate Insiders ({insider.toFixed(2)}%)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-emerald-500 inline-block rounded-full" />
                            Retail & Public ({retail.toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      {/* Detailed Statistics Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#0c1022] p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
                          <span className="text-[10px] text-slate-555 uppercase font-black tracking-wider leading-none">Institutional Holdings</span>
                          <span className="text-2xl font-black text-white font-mono mt-3">{inst > 0 ? `${inst.toFixed(2)}%` : "N/A"}</span>
                        </div>

                        <div className="bg-[#0c1022] p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
                          <span className="text-[10px] text-slate-555 uppercase font-black tracking-wider leading-none">Insider Holdings</span>
                          <span className="text-2xl font-black text-white font-mono mt-3">{insider > 0 ? `${insider.toFixed(2)}%` : "N/A"}</span>
                        </div>

                        <div className="bg-[#0c1022] p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
                          <span className="text-[10px] text-slate-555 uppercase font-black tracking-wider leading-none">Retail & Public</span>
                          <span className="text-2xl font-black text-white font-mono mt-3">{retail > 0 ? `${retail.toFixed(2)}%` : "N/A"}</span>
                        </div>

                        <div className="bg-[#0c1022] p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
                          <span className="text-[10px] text-slate-555 uppercase font-black tracking-wider leading-none">Institutional Float / Count</span>
                          <span className="text-xs font-black text-slate-300 font-mono mt-3 block leading-tight">
                            Float: {instFloat > 0 ? `${instFloat.toFixed(2)}%` : "N/A"}<br />
                            Holders: {instCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* CALENDAR EVENTS TAB */}
            {activeTab === "events" && data && (
              <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md space-y-6">
                <h3 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-3 tracking-wider">
                  Calendar Events & Estimates Forecasts
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Col 1: Date Timeline */}
                  <div className="lg:col-span-1 space-y-4">
                    <h4 className="text-[10px] text-slate-550 uppercase font-black tracking-wider mb-4">Upcoming Schedule</h4>

                    <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {/* Earnings Date */}
                      <div className="flex gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 z-10 shrink-0">
                          <Calendar className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Upcoming Earnings Date</span>
                          <span className="text-sm font-black text-slate-200 mt-0.5 block">
                            {data.events.earnings?.earningsDate?.[0]
                              ? new Date(data.events.earnings.earningsDate[0]).toLocaleDateString(undefined, { dateStyle: 'long' })
                              : "Not Available"}
                          </span>
                        </div>
                      </div>

                      {/* Ex-Dividend Date */}
                      <div className="flex gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 z-10 shrink-0">
                          <Scissors className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Ex-Dividend Date</span>
                          <span className="text-sm font-black text-slate-200 mt-0.5 block">
                            {data.events.exDividendDate
                              ? new Date(data.events.exDividendDate).toLocaleDateString(undefined, { dateStyle: 'long' })
                              : "Not Available"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: EPS Estimates */}
                  <div className="bg-[#0c1022] p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Earnings Per Share (EPS) Estimate</span>
                      <span className="text-3xl font-black text-white font-mono mt-4 block">
                        {data.events.earnings?.earningsAverage !== undefined && data.events.earnings?.earningsAverage !== null && data.events.earnings?.earningsAverage !== "Not Available"
                          ? formatVal(data.events.earnings.earningsAverage, true)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="border-t border-slate-900/60 pt-4 mt-6">
                      <div className="flex justify-between text-[10px] font-bold text-slate-550">
                        <span>Low Target</span>
                        <span>High Target</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-slate-350 font-mono mt-1">
                        <span>
                          {data.events.earnings?.earningsLow !== undefined && data.events.earnings?.earningsLow !== null && data.events.earnings?.earningsLow !== "Not Available"
                            ? formatVal(data.events.earnings.earningsLow, true)
                            : "N/A"}
                        </span>
                        <span>
                          {data.events.earnings?.earningsHigh !== undefined && data.events.earnings?.earningsHigh !== null && data.events.earnings?.earningsHigh !== "Not Available"
                            ? formatVal(data.events.earnings.earningsHigh, true)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Col 3: Revenue Estimates */}
                  <div className="bg-[#0c1022] p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-550 uppercase font-black tracking-wider block">Revenue Estimate Forecast</span>
                      <span className="text-3xl font-black text-white font-mono mt-4 block">
                        {data.events.earnings?.revenueAverage !== undefined && data.events.earnings?.revenueAverage !== null && data.events.earnings?.revenueAverage !== "Not Available"
                          ? formatVal(data.events.earnings.revenueAverage, true)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="border-t border-slate-900/60 pt-4 mt-6">
                      <div className="flex justify-between text-[10px] font-bold text-slate-555">
                        <span>Low Target</span>
                        <span>High Target</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-slate-350 font-mono mt-1">
                        <span>
                          {data.events.earnings?.revenueLow !== undefined && data.events.earnings?.revenueLow !== null && data.events.earnings?.revenueLow !== "Not Available"
                            ? formatVal(data.events.earnings.revenueLow, true)
                            : "N/A"}
                        </span>
                        <span>
                          {data.events.earnings?.revenueHigh !== undefined && data.events.earnings?.revenueHigh !== null && data.events.earnings?.revenueHigh !== "Not Available"
                            ? formatVal(data.events.earnings.revenueHigh, true)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TECHNICALS TAB */}
            {activeTab === "technicals" && data && (
              <div className="space-y-6">
                {/* Consensus Gauge Card */}
                {(() => {
                  const price = meta?.price || Number(data.statistics?.price) || 0;
                  const rsi = Number(data.technicals?.rsi) || 50;
                  const macd = Number(data.technicals?.macd) || 0;
                  const macdSignal = Number(data.technicals?.macdSignal) || 0;

                  let buyCount = 0;
                  let sellCount = 0;
                  let neutralCount = 0;

                  // RSI
                  if (rsi < 30) buyCount++;
                  else if (rsi > 70) sellCount++;
                  else neutralCount++;

                  // MAs
                  const mas = [
                    { name: "20", ema: Number(data.technicals?.ema20), sma: Number(data.technicals?.sma20) },
                    { name: "50", ema: Number(data.technicals?.ema50), sma: Number(data.technicals?.sma50) },
                    { name: "100", ema: Number(data.technicals?.ema100), sma: Number(data.technicals?.sma100) },
                    { name: "200", ema: Number(data.technicals?.ema200), sma: Number(data.technicals?.sma200) }
                  ];

                  mas.forEach(ma => {
                    if (ma.sma && price) {
                      if (price > ma.sma) buyCount++;
                      else sellCount++;
                    }
                    if (ma.ema && price) {
                      if (price > ma.ema) buyCount++;
                      else sellCount++;
                    }
                  });

                  // MACD
                  if (macd !== 0 || macdSignal !== 0) {
                    if (macd > macdSignal) buyCount++;
                    else sellCount++;
                  }

                  const high = Number(data.statistics?.dayHigh) || Number(data.statistics?.fiftyTwoWeekHigh) || price;
                  const low = Number(data.statistics?.dayLow) || Number(data.statistics?.fiftyTwoWeekLow) || price;
                  const close = Number(data.statistics?.previousClose) || price;

                  const hasKeyLevels = price > 0 && high > 0 && low > 0;
                  let PP = 0, R1 = 0, S1 = 0, R2 = 0, S2 = 0;
                  let keyVerdict = "Neutral";
                  let verdictBadgeColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";

                  if (hasKeyLevels) {
                    PP = (high + low + close) / 3;
                    R1 = (2 * PP) - low;
                    S1 = (2 * PP) - high;
                    R2 = PP + (high - low);
                    S2 = PP - (high - low);

                    if (price > R1) {
                      keyVerdict = "Bullish";
                      verdictBadgeColor = "text-emerald-450 bg-emerald-500/10 border-emerald-500/20";
                    } else if (price < S1) {
                      keyVerdict = "Bearish";
                      verdictBadgeColor = "text-rose-455 bg-rose-500/10 border-rose-500/20";
                    } else {
                      keyVerdict = "Neutral";
                      verdictBadgeColor = "text-amber-450 bg-amber-500/10 border-amber-500/20";
                    }
                  }

                  let summaryVerdict = "NEUTRAL";
                  let verdictColor = "bg-gradient-to-r from-slate-950 to-slate-900 border-slate-850 text-slate-300";

                  if (buyCount > sellCount + 2) {
                    summaryVerdict = "STRONG BUY";
                    verdictColor = "bg-gradient-to-r from-emerald-500/15 via-teal-500/5 to-transparent border-emerald-500/30 text-emerald-400";
                  } else if (buyCount > sellCount) {
                    summaryVerdict = "BUY";
                    verdictColor = "bg-gradient-to-r from-cyan-500/15 via-blue-500/5 to-transparent border-cyan-500/30 text-cyan-400";
                  } else if (sellCount > buyCount + 2) {
                    summaryVerdict = "STRONG SELL";
                    verdictColor = "bg-gradient-to-r from-rose-500/15 via-red-500/5 to-transparent border-rose-500/30 text-rose-400";
                  } else if (sellCount > buyCount) {
                    summaryVerdict = "SELL";
                    verdictColor = "bg-gradient-to-r from-orange-500/15 via-red-500/5 to-transparent border-orange-500/30 text-orange-400";
                  }

                  const totalSignals = buyCount + sellCount + neutralCount;

                  return (
                    <div className="space-y-6">
                      {/* Summary Banner */}
                      <div className={`border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md ${verdictColor}`}>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider leading-none">Consensus Verdict</span>
                          <h4 className="text-2xl font-black mt-2 tracking-tight">{summaryVerdict}</h4>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Buy</span>
                            <span className="text-lg font-black text-emerald-400 font-mono block mt-0.5">{buyCount}</span>
                          </div>
                          <div className="text-center border-l border-slate-900/60 pl-6">
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Neutral</span>
                            <span className="text-lg font-black text-slate-400 font-mono block mt-0.5">{neutralCount}</span>
                          </div>
                          <div className="text-center border-l border-slate-900/60 pl-6">
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Sell</span>
                            <span className="text-lg font-black text-rose-400 font-mono block mt-0.5">{sellCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Oscillators + Key Levels Stack */}
                        <div className="space-y-6 col-span-1">
                          {/* Oscillators */}
                          <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md space-y-6">
                            <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-3 tracking-wider">
                              Oscillators
                            </h4>

                            {/* RSI (14) */}
                            <div className="space-y-2.5">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-slate-400 font-sans font-bold">RSI (14)</span>
                                <span className={`font-black ${rsi < 30 ? "text-emerald-400" : rsi > 70 ? "text-rose-400" : "text-slate-200"}`}>
                                  {rsi.toFixed(2)} ({rsi < 30 ? "Oversold" : rsi > 70 ? "Overbought" : "Neutral"})
                                </span>
                              </div>
                              <div className="relative w-full bg-slate-950 rounded-full h-3 border border-slate-900 overflow-hidden">
                                <div className="absolute left-0 w-[30%] h-full bg-emerald-500/20" />
                                <div className="absolute left-[30%] w-[40%] h-full bg-slate-800/30" />
                                <div className="absolute left-[70%] w-[30%] h-full bg-rose-500/20" />
                                <div
                                  style={{ left: `${Math.min(97, Math.max(3, rsi))}%` }}
                                  className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/80 border-2 border-[#090d1a] ring-2 ring-cyan-400/30"
                                />
                              </div>
                              <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                                <span>Oversold (30)</span>
                                <span>Neutral</span>
                                <span>Overbought (70)</span>
                              </div>
                            </div>

                            {/* MACD */}
                            <div className="space-y-4 pt-2">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-slate-550 font-sans font-bold">MACD Crossover</span>
                                <span className={`font-black ${macd > macdSignal ? "text-emerald-450" : "text-rose-455"}`}>
                                  {macd > macdSignal ? "Bullish Crossover" : "Bearish Crossover"}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-center font-mono">
                                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Value</span>
                                  <span className="text-sm font-black text-slate-200 block mt-1">{macd.toFixed(3)}</span>
                                </div>
                                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Signal</span>
                                  <span className="text-sm font-black text-slate-200 block mt-1">{macdSignal.toFixed(3)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Major Key Levels */}
                          {hasKeyLevels ? (
                            <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md space-y-4">
                              <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
                                <h4 className="text-xs font-black uppercase text-slate-355 tracking-wider">
                                  Major Key Levels
                                </h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${verdictBadgeColor}`}>
                                  {keyVerdict}
                                </span>
                              </div>

                              <div className="space-y-3 text-xs font-mono">
                                <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
                                  <span className="text-rose-455 font-sans font-bold">R2 (Resistance 2)</span>
                                  <span className="text-slate-200 font-bold">
                                    {formatVal(R2, true)} <span className="text-[10px] text-slate-500 font-sans">({price >= R2 ? "Above" : "Below"})</span>
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
                                  <span className="text-rose-400 font-sans font-bold">R1 (Resistance 1)</span>
                                  <span className="text-slate-200 font-bold">
                                    {formatVal(R1, true)} <span className={`text-[10px] font-sans ${price >= R1 ? "text-emerald-400" : "text-rose-400"}`}>({price >= R1 ? "Above" : "Below"})</span>
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-900/40 bg-blue-500/5 px-2 rounded-lg">
                                  <span className="text-blue-400 font-sans font-bold">PP (Pivot Point)</span>
                                  <span className="text-slate-200 font-bold">
                                    {formatVal(PP, true)} <span className={`text-[10px] font-sans ${price >= PP ? "text-emerald-400" : "text-rose-400"}`}>({price >= PP ? "Above" : "Below"})</span>
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
                                  <span className="text-emerald-455 font-sans font-bold">S1 (Support 1)</span>
                                  <span className="text-slate-200 font-bold">
                                    {formatVal(S1, true)} <span className={`text-[10px] font-sans ${price >= S1 ? "text-emerald-400" : "text-rose-400"}`}>({price >= S1 ? "Above" : "Below"})</span>
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-emerald-400 font-sans font-bold">S2 (Support 2)</span>
                                  <span className="text-slate-200 font-bold">
                                    {formatVal(S2, true)} <span className="text-[10px] text-slate-500 font-sans">({price >= S2 ? "Above" : "Below"})</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md text-center text-xs text-slate-500 py-8">
                              No price data available to compute pivot levels.
                            </div>
                          )}
                        </div>

                        {/* Moving Averages */}
                        <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md col-span-2 space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-3 tracking-wider">
                            Moving Averages (MAs)
                          </h4>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs font-mono text-left">
                              <thead>
                                <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                                  <th className="pb-3 font-sans">Period</th>
                                  <th className="pb-3 text-center">Simple (SMA)</th>
                                  <th className="pb-3 text-right">Exponential (EMA)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900/40">
                                {mas.map((ma, i) => {
                                  const smaDiff = ma.sma ? ((price - ma.sma) / ma.sma) * 100 : 0;
                                  const emaDiff = ma.ema ? ((price - ma.ema) / ma.ema) * 100 : 0;

                                  return (
                                    <tr key={i} className="hover:bg-white/[0.01] transition-colors duration-150">
                                      <td className="py-3 font-sans font-bold text-slate-400">
                                        MA {ma.name}
                                      </td>
                                      <td className="py-3 text-center">
                                        <div className="inline-flex flex-col items-center">
                                          <span className="text-slate-200 font-bold">{formatVal(ma.sma, true)}</span>
                                          {ma.sma > 0 && (
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-1 ${price >= ma.sma ? "bg-emerald-500/10 text-emerald-450" : "bg-rose-500/10 text-rose-455"}`}>
                                              {price >= ma.sma ? "▲ Above" : "▼ Below"} ({Math.abs(smaDiff).toFixed(1)}%)
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 text-right">
                                        <div className="inline-flex flex-col items-end">
                                          <span className="text-slate-200 font-bold">{formatVal(ma.ema, true)}</span>
                                          {ma.ema > 0 && (
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-1 ${price >= ma.ema ? "bg-emerald-500/10 text-emerald-450" : "bg-rose-500/10 text-rose-455"}`}>
                                              {price >= ma.ema ? "▲ Above" : "▼ Below"} ({Math.abs(emaDiff).toFixed(1)}%)
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* PERFORMANCE COMPARISON TAB */}
            {activeTab === "performance" && meta && (
              <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-300 border-b border-slate-900 pb-3">
                  Historical Total Return Comparison
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                  {[
                    { label: "1D", key: "1D" },
                    { label: "1W", key: "1W" },
                    { label: "3M", key: "3M" },
                    { label: "6M", key: "6M" },
                    { label: "YTD", key: "YTD" },
                    { label: "1Y", key: "1Y" },
                    { label: "5Y", key: "5Y" },
                    { label: "All Time", key: "All Time" }
                  ].map((item, idx) => {
                    const val = meta.performance?.[item.key];
                    const isPositive = val >= 0;
                    return (
                      <div key={idx} className="bg-[#0c1022] p-4 rounded-xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-500 uppercase font-black block tracking-wider">{item.label}</span>
                        <span className={`text-base font-mono font-black mt-2 block ${val != null ? (isPositive ? "text-emerald-450" : "text-rose-455") : "text-slate-600"
                          }`}>
                          {formatVal(val, false, true)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NEWS TAB */}
            {activeTab === "news" && data && (
              <div className="space-y-4">
                {data.news?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-md flex gap-4 hover:border-slate-800 transition-colors">
                    {item.thumbnail?.resolutions?.[0]?.url && (
                      <img
                        src={item.thumbnail.resolutions[0].url}
                        alt="Article thumbnail"
                        className="w-24 h-16 rounded-xl object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{item.title}</h4>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-0.5 shrink-0 ml-2"
                        >
                          <span>Read</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {item.summary || item.title}
                      </p>
                      <div className="flex gap-4 text-[9px] text-slate-550 font-bold uppercase tracking-wider mt-2.5">
                        <span>{item.publisher}</span>
                        <span>{new Date(item.providerPublishTime * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}