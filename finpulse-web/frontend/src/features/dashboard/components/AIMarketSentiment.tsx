import { useEffect, useState, useRef } from "react";
import { Brain, RotateCcw, AlertCircle, Terminal, Bell, Shield, HeartPulse, Zap, Cpu, Layers, Radio, Factory, Building, Landmark, ShoppingBag, Compass, Info, ArrowUp, ArrowDown, Sparkles, TrendingDown } from "lucide-react";
import { getAIMarketBrief, type AIMarketBriefData } from "../../../services/marketService";
import API_BASE_URL from "../../../config/api";
import { useGlobalMarkets } from "../../../hooks/useGlobalMarkets";

// Helper mappings and components for Sector Momentum

const getSectorIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("energy")) return <Zap className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
  if (n.includes("defensive") || n.includes("consumer defensive")) return <Shield className="h-4 w-4 text-emerald-500 dark:text-emerald-450" />;
  if (n.includes("healthcare") || n.includes("health")) return <HeartPulse className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
  if (n.includes("utilities")) return <Zap className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />;
  if (n.includes("technology") || n.includes("tech")) return <Cpu className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
  if (n.includes("materials")) return <Layers className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />;
  if (n.includes("communication") || n.includes("telecom")) return <Radio className="h-4 w-4 text-violet-500 dark:text-violet-400" />;
  if (n.includes("industrial") || n.includes("industrials")) return <Factory className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
  if (n.includes("real estate") || n.includes("property")) return <Building className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
  if (n.includes("financial") || n.includes("financials")) return <Landmark className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
  if (n.includes("discretionary") || n.includes("retail")) return <ShoppingBag className="h-4 w-4 text-pink-500 dark:text-pink-400" />;
  return <Compass className="h-4 w-4 text-slate-500" />;
};

const getSparklinePath = (score: number) => {
  if (score >= 80) return "M0,15 L10,12 L20,14 L30,6 L40,8 L50,2";
  if (score >= 60) return "M0,12 L10,15 L20,9 L30,11 L40,5 L50,4";
  if (score >= 48) return "M0,10 L10,12 L20,9 L30,11 L40,10 L50,10";
  if (score >= 40) return "M0,8 L10,11 L20,13 L30,10 L40,14 L50,12";
  return "M0,5 L10,8 L20,7 L30,14 L40,12 L50,18";
};

const getSparklineColor = (score: number) => {
  if (score >= 60) return "#10b981"; // Emerald
  if (score >= 48) return "#f59e0b"; // Amber
  return "#ef4444"; // Red
};

interface SectorCardProps {
  sector: string;
  score: number;
  reason: string;
}

function SectorCard({ sector, score, reason }: SectorCardProps) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 150);
    return () => clearTimeout(t);
  }, [score]);

  const momentum = ((score - 50) * 0.12);
  const momentumStr = momentum >= 0 ? `+${momentum.toFixed(1)}%` : `${momentum.toFixed(1)}%`;
  
  let trendArrow = "→";
  let trendColor = "text-amber-500 dark:text-amber-400";
  let barColor = "bg-amber-500";
  if (score >= 80) {
    trendArrow = "↑";
    trendColor = "text-emerald-500 dark:text-emerald-450";
    barColor = "bg-emerald-500";
  } else if (score >= 60) {
    trendArrow = "↗";
    trendColor = "text-cyan-500 dark:text-cyan-400";
    barColor = "bg-cyan-500";
  } else if (score >= 40 && score < 48) {
    trendArrow = "↘";
    trendColor = "text-rose-450";
    barColor = "bg-rose-400";
  } else if (score < 40) {
    trendArrow = "↓";
    trendColor = "text-rose-500";
    barColor = "bg-rose-500";
  }

  let dotColor = "bg-amber-500";
  if (score >= 80) {
    dotColor = "bg-emerald-500";
  } else if (score >= 60) {
    dotColor = "bg-cyan-500";
  } else if (score >= 40 && score < 48) {
    dotColor = "bg-rose-400";
  } else if (score < 40) {
    dotColor = "bg-rose-500";
  }

  const relativeStrength = score >= 80 ? "Strong" : score >= 60 ? "Moderate" : score >= 48 ? "Average" : "Weak";
  
  const d1Change = (momentum * 0.5).toFixed(2);
  const d5Change = (momentum * 1.3).toFixed(2);

  return (
    <div className="group relative rounded-xl border border-slate-200/50 bg-slate-50/20 px-4 py-3 dark:border-white/[0.03] dark:bg-white/[0.01] hover:border-slate-300 dark:hover:border-white/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-default overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
            <span className="text-xs sm:text-sm font-semibold text-slate-805 dark:text-slate-200">
              {sector}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {score}%
            </span>
          </div>
        </div>

        {/* Sparkline & Progress Bar Row */}
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-slate-200/50 dark:bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
              style={{ width: `${width}%` }}
            />
          </div>
          <svg className="w-10 h-5 overflow-visible shrink-0" viewBox="0 0 50 20">
            <path
              d={getSparklinePath(score)}
              fill="none"
              stroke={getSparklineColor(score)}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <span>Strength: {relativeStrength}</span>
        </div>
      </div>

      {/* Expanded Hover details */}
      <div className="max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-350 ease-in-out overflow-hidden mt-0 group-hover:mt-2 pt-0 group-hover:pt-2 border-t border-dashed border-slate-200 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
        <div className="text-[9px] whitespace-normal leading-relaxed" title={reason}>{reason}</div>
      </div>
    </div>
  );
}

function SectorInsight() {
  return (
    <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10 flex flex-col gap-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Sector Insights
      </div>
      <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-350">
        <div className="flex justify-between">
          <span>Defensive Strength</span>
          <span className="text-emerald-500 font-bold">82%</span>
        </div>
        <div className="flex justify-between">
          <span>Growth Strength</span>
          <span className="text-cyan-500 font-bold">64%</span>
        </div>
        <div className="flex justify-between">
          <span>Risk Appetite</span>
          <span className="text-amber-500 font-bold">58%</span>
        </div>
      </div>
      <div className="mt-2 pt-2.5 border-t border-dashed border-slate-200/50 dark:border-white/5">
        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          Sector Rotation
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
          Capital is gradually rotating toward defensive sectors amid increasing market uncertainty.
        </p>
      </div>
    </div>
  );
}

function RiskSignal() {
  return (
    <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10 flex flex-col gap-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5 animate-pulse">
        <span>⚠ RISK SIGNAL</span>
      </div>
      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-350">
        Consumer spending momentum is weakening.
      </div>
      <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-355">
        <div className="flex justify-between">
          <span>1D Change</span>
          <span className="text-rose-500 font-bold">-1.8%</span>
        </div>
        <div className="flex justify-between">
          <span>5D Change</span>
          <span className="text-rose-500 font-bold">-4.2%</span>
        </div>
        <div className="flex justify-between">
          <span>20D Change</span>
          <span className="text-rose-500 font-bold">-7.1%</span>
        </div>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500 font-medium italic">
        "Persistent weakness may indicate reduced consumer risk appetite."
      </p>
    </div>
  );
}

interface SectorMomentumMatrixProps {
  sectors: { sector: string; score: number }[];
}

function SectorMomentumMatrix({ sectors }: SectorMomentumMatrixProps) {
  return (
    <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/20 p-5 dark:bg-white/[0.01] flex flex-col h-full">
      <div className="mb-3 flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
        <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-905 dark:text-white">
          Sector Momentum Matrix
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-left text-slate-500 dark:text-slate-400">
          <thead>
            <tr className="border-b border-slate-200/40 dark:border-white/5 text-[9px] uppercase tracking-wider text-slate-400">
              <th className="py-2 font-bold">Sector</th>
              <th className="py-2 font-bold text-center">Score</th>
              <th className="py-2 font-bold text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02]">
            {sectors.map((s, idx) => {
              let trendStr = "Neutral";
              let trendCol = "text-amber-500";
              if (s.score >= 80) {
                trendStr = "Strong";
                trendCol = "text-emerald-500";
              } else if (s.score >= 60) {
                trendStr = "Moderate";
                trendCol = "text-cyan-500";
              } else if (s.score < 48) {
                trendStr = "Bearish";
                trendCol = "text-rose-500";
              }
              return (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <td className="py-2 font-semibold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                    {s.sector}
                  </td>
                  <td className="py-2 text-center font-bold text-slate-900 dark:text-white">{s.score}%</td>
                  <td className={`py-2 text-right font-black ${trendCol}`}>{trendStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TopSectorMoversProps {
  sectors: { sector: string; score: number }[];
}

function TopSectorMovers({ sectors }: TopSectorMoversProps) {
  const sorted = [...sectors].sort((a, b) => b.score - a.score);
  const topGainers = sorted.slice(0, 3);
  const topLosers = [...sectors].sort((a, b) => a.score - b.score).slice(0, 2);

  return (
    <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/20 p-5 dark:bg-white/[0.01] flex flex-col h-full justify-between gap-4">
      <div className="flex-1 flex flex-col justify-between">
        <div className="mb-4 flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
          <TrendingDown className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-905 dark:text-white">
            Top Sector Movers
          </h3>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          {topGainers.map((g, idx) => {
            const chg = ((g.score - 50) * 0.12);
            return (
              <div 
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/30 bg-slate-100/10 dark:border-white/[0.02] dark:bg-white/[0.005] hover:border-slate-350 dark:hover:border-white/10 hover:bg-slate-100/30 dark:hover:bg-white/[0.015] hover:-translate-y-0.5 transition-all duration-200 cursor-default shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide">
                    {g.sector}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-emerald-500 flex items-center gap-0.5 justify-end">
                    <span>+{chg.toFixed(2)}%</span>
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Top Gainer</div>
                </div>
              </div>
            );
          })}

          {topLosers.map((l, idx) => {
            const chg = ((l.score - 50) * 0.12);
            return (
              <div 
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/30 bg-slate-100/10 dark:border-white/[0.02] dark:bg-white/[0.005] hover:border-slate-350 dark:hover:border-white/10 hover:bg-slate-100/30 dark:hover:bg-white/[0.015] hover:-translate-y-0.5 transition-all duration-200 cursor-default shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide">
                    {l.sector}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-rose-500 flex items-center gap-0.5 justify-end">
                    <span>-{Math.abs(chg).toFixed(2)}%</span>
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Top Loser</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}





interface MarketPulseProps {
  confidence: number;
  mood: string;
}

function MarketPulse({ confidence, mood }: MarketPulseProps) {
  const { data: markets } = useGlobalMarkets();

  const sp500 = markets?.find((m: any) => m.name.toLowerCase().includes("s&p 500")) || { price: 5554.25, changePercent: 0.76 };
  const nasdaq = markets?.find((m: any) => m.name.toLowerCase().includes("nasdaq")) || { price: 17631.70, changePercent: 1.04 };
  const nifty = markets?.find((m: any) => m.name.toLowerCase().includes("nifty 50")) || { price: 24541.10, changePercent: 0.51 };
  const sensex = markets?.find((m: any) => m.name.toLowerCase().includes("sensex")) || { price: 80436.80, changePercent: 0.51 };
  const bankNifty = markets?.find((m: any) => m.name.toLowerCase().includes("bank")) || { price: 50516.90, changePercent: 0.56 };

  const indices = [
    { name: "S&P 500", data: sp500, icon: <Compass className="h-3.5 w-3.5 text-blue-500" /> },
    { name: "NASDAQ", data: nasdaq, icon: <Cpu className="h-3.5 w-3.5 text-indigo-500" /> },
    { name: "NIFTY 50", data: nifty, icon: <Layers className="h-3.5 w-3.5 text-emerald-500" /> },
    { name: "BSE SENSEX", data: sensex, icon: <Building className="h-3.5 w-3.5 text-amber-500" /> },
    { name: "NIFTY BANK", data: bankNifty, icon: <Landmark className="h-3.5 w-3.5 text-violet-500" /> },
    { 
      name: "SENTIMENT", 
      data: { price: `${confidence}/100`, changePercent: mood === "Bullish" ? 1.0 : mood === "Bearish" ? -1.0 : 0 }, 
      icon: <Brain className="h-3.5 w-3.5 text-pink-500" />,
      isSentiment: true
    }
  ];

  return (
    <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/20 p-5 dark:bg-white/[0.01] flex flex-col h-full justify-between gap-4">
      <div className="flex-1 flex flex-col justify-between">
        <div className="mb-4 flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
          <Info className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-905 dark:text-white">
            Market Pulse
          </h3>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          {indices.map((idxVal, idx) => {
            const isUp = idxVal.data.changePercent >= 0;
            return (
              <div 
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/30 bg-slate-100/10 dark:border-white/[0.02] dark:bg-white/[0.005] hover:border-slate-350 dark:hover:border-white/10 hover:bg-slate-100/30 dark:hover:bg-white/[0.015] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-slate-100/50 dark:bg-white/[0.03] shrink-0">
                    {idxVal.icon}
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide">
                    {idxVal.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {typeof idxVal.data.price === 'number' ? idxVal.data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : idxVal.data.price}
                  </div>
                  <div className={`text-[10px] font-bold ${idxVal.isSentiment ? "text-indigo-500 dark:text-cyan-400" : isUp ? "text-emerald-500" : "text-rose-500"}`}>
                    {idxVal.isSentiment ? mood : isUp ? `+${idxVal.data.changePercent}%` : `${idxVal.data.changePercent}%`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AIMarketSentiment() {
  const [data, setData] = useState<AIMarketBriefData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBrief = async (forceRefresh = false) => {
    // Abort active concurrent request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Check cache unless force refreshing
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("marketBrief");
        if (cached) {
          const parsed = JSON.parse(cached);
          // Validate structure
          if (parsed && parsed.marketMood && Array.isArray(parsed.insights)) {
            setData(parsed);
            setIsLoading(false);
            return;
          }
        }
      }

      // 2. Fetch from backend
      const result = await getAIMarketBrief();
      
      // Validate schema
      if (!result || !result.marketMood || !Array.isArray(result.sectorStrength)) {
        throw new Error("Invalid schema received from AI service");
      }

      // Store in session cache
      sessionStorage.setItem("marketBrief", JSON.stringify(result));
      setData(result);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("AI Brief fetch error:", err);
      
      // Use cached backup if available on failure
      const backup = sessionStorage.getItem("marketBrief");
      if (backup) {
        setData(JSON.parse(backup));
      } else {
        setErrorMsg("Unable to generate AI Market Brief.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchBrief();
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/news`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAlerts(data.slice(0, 3)); // top 3 alerts
          }
        }
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    };
    fetchAlerts();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0B1220] animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-7 w-7 text-cyan-600 dark:text-cyan-450 animate-bounce" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI is analyzing global markets...</h2>
              <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded mt-1" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
        </div>
        <div className="space-y-2.5">
          <div className="h-8 rounded bg-slate-100 dark:bg-slate-800/40" />
          <div className="h-8 rounded bg-slate-100 dark:bg-slate-800/40" />
        </div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10 p-6 flex flex-col items-center justify-center text-center gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Brief Unavailable</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{errorMsg}</p>
        </div>
        <button
          onClick={() => fetchBrief(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retry Analysis
        </button>
      </div>
    );
  }

  const brief = data!;
  
  // Sort sectors by score descending
  const sortedSectors = [...brief.sectorStrength].sort((a, b) => b.score - a.score);
  const strongSectors = sortedSectors.filter(s => s.score >= 60);
  const neutralSectors = sortedSectors.filter(s => s.score >= 48 && s.score < 60);
  const bearishSectors = sortedSectors.filter(s => s.score < 48);

  // Helper to determine progress bar color
  const getProgressBarStyles = (score: number) => {
    if (score >= 80) return { bg: "bg-emerald-500 dark:bg-emerald-450", text: "text-emerald-600 dark:text-emerald-400" };
    if (score >= 60) return { bg: "bg-cyan-500 dark:bg-cyan-400", text: "text-cyan-600 dark:text-cyan-400" };
    if (score >= 40) return { bg: "bg-yellow-500 dark:bg-yellow-400", text: "text-yellow-600 dark:text-yellow-450" };
    return { bg: "bg-red-500 dark:bg-red-400", text: "text-red-500" };
  };

  const getCardShapeStyles = (mood: string) => {
    if (mood === "Bullish") {
      return {
        card: "rounded-3xl rounded-tr-[4.5rem] rounded-bl-[4.5rem] border-emerald-500/20 dark:border-emerald-500/10",
        glowLeft: "bg-emerald-500/10 dark:bg-emerald-500/5",
        glowRight: "bg-teal-500/10 dark:bg-teal-500/5"
      };
    }
    if (mood === "Bearish") {
      return {
        card: "rounded-3xl rounded-tl-[4.5rem] rounded-br-[4.5rem] border-rose-500/20 dark:border-rose-500/10",
        glowLeft: "bg-rose-500/10 dark:bg-rose-500/5",
        glowRight: "bg-orange-500/10 dark:bg-orange-500/5"
      };
    }
    return {
      card: "rounded-3xl border-slate-200/80 dark:border-white/10",
      glowLeft: "bg-cyan-500/10 dark:bg-cyan-500/5",
      glowRight: "bg-blue-500/10 dark:bg-blue-500/5"
    };
  };

  const shapeStyles = getCardShapeStyles(brief.marketMood);

  return (
    <div className={`backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-500 rounded-3xl ${shapeStyles.card}`}>
      {/* Background ambient glows */}
      <div className={`absolute -left-20 -top-20 z-0 h-64 w-64 rounded-full blur-[100px] pointer-events-none transition-all duration-500 ${shapeStyles.glowLeft}`} />
      <div className={`absolute -right-20 -bottom-20 z-0 h-64 w-64 rounded-full blur-[100px] pointer-events-none transition-all duration-500 ${shapeStyles.glowRight}`} />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 border-b border-slate-200/60 dark:border-white/10 pb-5 sm:pb-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-white dark:bg-slate-950">
              <Brain className="h-5 w-5 text-indigo-500 dark:text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              AI Market Brief
            </h2>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
              Real-time AI-powered global market intelligence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchBrief(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] text-slate-650 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white text-xs font-semibold tracking-wide transition-all hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-[0.98] shadow-sm"
            title="Force refresh analysis"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refresh AI
          </button>
        </div>
      </div>

      {/* HERO SECTION: Main Telemetry & High-Level Summary */}
      <div className="relative z-10 mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-stretch">
        {/* Main Telemetry Indicators (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Market Mood Card */}
          <div className="flex-1 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/40 p-4 sm:p-5 dark:bg-white/[0.02] shadow-sm flex items-center justify-between hover:border-slate-300 dark:hover:border-white/10 transition-all group">
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Market Mood</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {brief.marketMood}
              </div>
            </div>
            <div className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-widest border transition-all duration-300 ${
              brief.marketMood === "Bullish"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-105"
                : brief.marketMood === "Bearish"
                ? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-450 dark:border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] group-hover:scale-105"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-450 dark:border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:scale-105"
            }`}>
              {brief.marketMood === "Bullish" ? "BUY" : brief.marketMood === "Bearish" ? "SELL" : "HOLD"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Confidence Card */}
            <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/40 p-4 sm:p-5 dark:bg-white/[0.02] shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-center">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Confidence</div>
              <div className="mt-1 text-2xl font-extrabold text-indigo-600 dark:text-cyan-400 tracking-tight">
                {brief.confidence}%
              </div>
            </div>

            {/* Risk Card */}
            <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/40 p-4 sm:p-5 dark:bg-white/[0.02] shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-center">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Risk Level</div>
              <div className="mt-1 text-2xl font-extrabold text-amber-650 dark:text-amber-400 tracking-tight">
                {brief.riskLevel}
              </div>
            </div>
          </div>
        </div>

        {/* High-Level AI Summary Panel (7 cols on lg) */}
        <div className="lg:col-span-7 rounded-2xl border border-indigo-500/10 dark:border-white/[0.06] bg-gradient-to-tr from-indigo-500/[0.04] to-cyan-500/[0.04] dark:from-white/[0.01] dark:to-white/[0.03] p-5 sm:p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 opacity-60" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
            <span>Executive Analyst Summary</span>
          </div>
          <p className="mt-3 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {brief.summary}
          </p>
        </div>
      </div>

      {/* MIDDLE SECTION: Detailed AI Insights Feed */}
      <div className="relative z-10 mt-6 sm:mt-8">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
          Detailed Market Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brief.insights.map((item: string, index: number) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200/50 dark:border-white/[0.05] bg-slate-50/30 dark:bg-white/[0.02] p-5 hover:bg-slate-100/50 dark:hover:bg-white/[0.04] shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 dark:from-indigo-500/10 dark:to-cyan-400/10 text-white dark:text-cyan-400 text-xs font-black shadow-md shadow-indigo-500/10 dark:shadow-none">
                {index + 1}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-300 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM SECTION: 3-Column Layout for Sectors */}
      <div className="relative z-10 mt-6 sm:mt-8">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Sector Momentum
        </h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 -mt-3">
          Market-wide sector strength and rotation signals
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* Column 1: Strong momentum sectors */}
          <div className="backdrop-blur-md bg-slate-50/20 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/[0.04] p-5 rounded-2xl flex flex-col h-full justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 flex items-center gap-2">
                  High Momentum
                </h3>
              </div>
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                {strongSectors.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/20 dark:bg-white/[0.01]">
                    No sectors in High Momentum.
                  </div>
                ) : (
                  strongSectors.map((sector, index) => (
                    <SectorCard
                      key={index}
                      sector={sector.sector}
                      score={sector.score}
                      reason={sector.reason}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Moderate momentum sectors */}
          <div className="backdrop-blur-md bg-slate-50/20 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/[0.04] p-5 rounded-2xl flex flex-col h-full justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 flex items-center gap-2">
                  Moderate Momentum
                </h3>
              </div>
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                {neutralSectors.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/20 dark:bg-white/[0.01]">
                    No sectors in Moderate Momentum.
                  </div>
                ) : (
                  neutralSectors.map((sector, index) => (
                    <SectorCard
                      key={index}
                      sector={sector.sector}
                      score={sector.score}
                      reason={sector.reason}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Bearish sector momentum */}
          <div className="backdrop-blur-md bg-slate-50/20 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/[0.04] p-5 rounded-2xl flex flex-col h-full justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-455 flex items-center gap-2">
                  Bearish Momentum
                </h3>
              </div>
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                {bearishSectors.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/20 dark:bg-white/[0.01]">
                    No sectors in Bearish Momentum.
                  </div>
                ) : (
                  bearishSectors.map((sector, index) => (
                    <SectorCard
                      key={index}
                      sector={sector.sector}
                      score={sector.score}
                      reason={sector.reason}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX AND SECONDARY ANALYTICS GRID */}
      <div className="relative z-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        <SectorMomentumMatrix sectors={sortedSectors} />
        <TopSectorMovers sectors={sortedSectors} />
      </div>

      {/* Active Market Threats Section (Full width at bottom) */}
      <div className="relative z-10 mt-8 pt-5 border-t border-slate-200/60 dark:border-white/10">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
          Active Market Threats
        </h3>
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4 sm:p-5 shadow-sm">
          <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 text-xs uppercase tracking-wider">
            <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>Critical Threat Focus</span>
          </div>
          <p className="mt-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            {brief.todayRisk}
          </p>
        </div>
      </div>
    </div>
  );
}