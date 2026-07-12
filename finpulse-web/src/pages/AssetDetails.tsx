import { useParams, useNavigate } from "react-router-dom";
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
  Users
} from "lucide-react";
import { getUnifiedAssetDetails } from "../services/marketService";
import CandlestickChart from "../components/charts/CandlestickChart";
import { ChartHeader } from "../components/charts/ChartHeader";

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

export default function AssetDetails() {
  const { symbol = "AAPL" } = useParams();
  const navigate = useNavigate();
  const tabContentRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [hasComparison, setHasComparison] = useState(false);
  const [timeframe, setTimeframe] = useState("1Y");

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

    const currencySymbol = meta?.currency === "INR" ? "₹" : "$";

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
              {[
                { id: "overview", label: "Overview", icon: Layers },
                { id: "financials", label: "Financials", icon: Briefcase },
                { id: "analysts", label: "Analyst Targets", icon: Compass },
                { id: "sentiment", label: "Market Sentiment", icon: Brain },
                { id: "ownership", label: "Ownership", icon: Users },
                { id: "events", label: "Calendar Events", icon: Calendar },
                { id: "technicals", label: "Technicals", icon: Activity },
                { id: "performance", label: "Performance", icon: TrendingUp },
                { id: "news", label: "News Feed", icon: Newspaper }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setTimeout(() => {
                      tabContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 80);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-left transition-all flex items-center gap-2.5 ${
                    activeTab === tab.id
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
                    {["income", "balance", "cashflow"].map((ft) => (
                      <button
                        key={ft}
                        onClick={() => setFinancialsTab(ft as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                          financialsTab === ft
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                          financialsPeriod === fp
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
                            : "text-slate-450 hover:text-white"
                        }`}
                      >
                        {fp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="py-3 font-sans">Statement Item</th>
                        <th className="py-3 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const moduleKey = `${financialsTab}StatementHistory${financialsPeriod === "quarterly" ? "Quarterly" : ""}`;
                        const reports = data.financials?.[moduleKey]?.statements || [];
                        if (reports.length === 0) {
                          return (
                            <tr>
                              <td colSpan={2} className="py-4 text-center text-slate-500 font-sans">
                                No Statement Data Available
                              </td>
                            </tr>
                          );
                        }
                        const report = reports[0];
                        return Object.keys(report)
                          .filter((k) => k !== "date")
                          .map((key) => (
                            <tr key={key} className="border-b border-slate-900/40 hover:bg-slate-900/20">
                              <td className="py-2.5 font-sans capitalize text-slate-400">{key.replace(/([A-Z])/g, ' $1')}</td>
                              <td className="py-2.5 text-right font-bold text-slate-250">
                                {formatVal(report[key], true)}
                              </td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ANALYST TARGETS */}
            {activeTab === "analysts" && data && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md">
                    <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-2 mb-4">
                      Rating Metrics
                    </h4>
                    <div className="space-y-3 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Consensus Rating</span>
                        <span className="text-emerald-450 font-bold uppercase">{data.analysts.recommendationKey}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mean Score (1-5)</span>
                        <span className="text-slate-300 font-bold">{data.analysts.recommendationMean}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Analyst Coverage</span>
                        <span className="text-slate-300 font-bold">{data.analysts.numberOfAnalysts}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md col-span-2">
                    <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-2 mb-4">
                      Price Target Thresholds
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Low Target</span>
                        <span className="text-sm font-black font-mono text-white block mt-1">
                          {formatVal(data.analysts.targetLow, true)}
                        </span>
                      </div>
                      <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Median Target</span>
                        <span className="text-sm font-black font-mono text-white block mt-1">
                          {formatVal(data.analysts.targetMedian, true)}
                        </span>
                      </div>
                      <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mean Target</span>
                        <span className="text-sm font-black font-mono text-white block mt-1">
                          {formatVal(data.analysts.targetMeanPrice, true)}
                        </span>
                      </div>
                      <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">High Target</span>
                        <span className="text-sm font-black font-mono text-white block mt-1">
                          {formatVal(data.analysts.targetHigh, true)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md">
                  <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-3 mb-4">
                    Upgrade / Downgrade History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="py-2">Date</th>
                          <th className="py-2">Firm</th>
                          <th className="py-2">From Rating</th>
                          <th className="py-2">To Rating</th>
                          <th className="py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.analysts.upgradesDowngrades.slice(0, 10).map((hist: any, i: number) => (
                          <tr key={i} className="border-b border-slate-900/40 hover:bg-slate-900/25">
                            <td className="py-2 text-slate-400">{new Date(hist.epochDate * 1000).toLocaleDateString()}</td>
                            <td className="py-2 text-slate-300 font-sans font-bold">{hist.financialSupervisor}</td>
                            <td className="py-2 text-slate-400 capitalize">{hist.fromGrade || "N/A"}</td>
                            <td className="py-2 text-slate-200 capitalize font-bold">{hist.toGrade || "N/A"}</td>
                            <td className={`py-2 text-right uppercase font-bold ${
                              hist.action === "upgrade" ? "text-emerald-450" : "text-rose-455"
                            }`}>
                              {hist.action}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                    <span className={`text-sm font-black uppercase mt-3 tracking-wide ${
                      sentiment.label === "Bullish" ? "text-emerald-400" : sentiment.label === "Bearish" ? "text-rose-400" : "text-amber-500"
                    }`}>
                      {sentiment.label}
                    </span>
                  </div>

                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md col-span-2 space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-2">
                      Sentiment Analysis Parameters
                    </h4>
                    <ul className="space-y-3 text-xs text-slate-300">
                      {sentiment.reasons.map((reason, i) => (
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
                <h3 className="text-sm font-black uppercase text-slate-350 border-b border-slate-900 pb-3">
                  Share Ownership Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                  <div className="bg-[#0c1022] p-6 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-500 uppercase font-black tracking-wider">Institutional Ownership</span>
                    <span className="text-3xl font-black text-white font-mono block mt-3">
                      {formatVal(data.ownership.institutionOwnership * 100, false, true)}
                    </span>
                  </div>
                  <div className="bg-[#0c1022] p-6 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-500 uppercase font-black tracking-wider">Insider Ownership</span>
                    <span className="text-3xl font-black text-white font-mono block mt-3">
                      {formatVal(data.ownership.insiderOwnership * 100, false, true)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CALENDAR EVENTS TAB */}
            {activeTab === "events" && data && (
              <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md space-y-6">
                <h3 className="text-sm font-black uppercase text-slate-350 border-b border-slate-900 pb-3">
                  Calendar & Dividends
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 uppercase font-bold tracking-wider block">Upcoming Earnings Date</span>
                    <span className="text-sm font-bold text-slate-200 mt-1 block">
                      {data.events.earnings?.earningsDate
                        ? new Date(data.events.earnings.earningsDate[0] * 1000).toLocaleDateString()
                        : "Not Available"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold tracking-wider block">Ex-Dividend Date</span>
                    <span className="text-sm font-bold text-slate-200 mt-1 block">
                      {data.events.exDividendDate
                        ? new Date(data.events.exDividendDate * 1000).toLocaleDateString()
                        : "Not Available"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold tracking-wider block">Dividend Payment Date</span>
                    <span className="text-sm font-bold text-slate-200 mt-1 block">
                      {data.events.dividendDate
                        ? new Date(data.events.dividendDate * 1000).toLocaleDateString()
                        : "Not Available"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TECHNICALS TAB */}
            {activeTab === "technicals" && data && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md">
                    <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-2 mb-4">
                      Oscillators
                    </h4>
                    <div className="space-y-3 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">RSI (14)</span>
                        <span className="text-slate-200 font-bold">{data.technicals?.rsi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">MACD Value</span>
                        <span className="text-slate-200 font-bold">{data.technicals?.macd}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">MACD Signal</span>
                        <span className="text-slate-200 font-bold">{data.technicals?.macdSignal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md col-span-2">
                    <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-2 mb-4">
                      Moving Averages
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-sans">EMA 20</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.technicals?.ema20)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-sans">SMA 20</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.technicals?.sma20)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-sans">EMA 50</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.technicals?.ema50)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-sans">SMA 50</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.technicals?.sma50)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-sans">EMA 100</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.technicals?.ema100)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-sans">SMA 100</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.technicals?.sma100)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-sans">EMA 200</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.technicals?.ema200)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-sans">SMA 200</span>
                        <span className="text-slate-300 font-bold">{formatVal(data.technicals?.sma200)}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
                        <span className={`text-base font-mono font-black mt-2 block ${
                          val != null ? (isPositive ? "text-emerald-450" : "text-rose-455") : "text-slate-600"
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