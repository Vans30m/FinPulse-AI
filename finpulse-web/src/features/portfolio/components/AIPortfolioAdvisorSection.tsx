import { memo, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  FileText,
  Layers3,
  PieChart,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Printer,
  X,
  Info,
  Award,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Activity,
  RefreshCcw
} from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";

interface Props {
  advisor: {
    healthScore: number;
    healthGrade: string;
    diversification: {
      score: number;
      status: string;
      sectorExposure: string;
      suggestedAllocation: string;
      confidence: number;
      reason: string;
    };
    riskAnalysis: {
      score: number;
      risk: string;
      confidence: number;
      suggestedAction: string;
      reason: string;
    };
    bestOpportunity: {
      symbol: string;
      company: string;
      recommendation: string;
      currentPrice: number;
      targetPrice: number;
      expectedUpside: number;
      confidence: number;
      reason: string;
    };
    portfolioHealth: {
      outlook: string;
      strengths: string[];
      weaknesses: string[];
      risks: string[];
      recommendations: string[];
    };
    rebalanceSuggestions: {
      action: string;
      asset: string;
      reason: string;
    }[];
    generatedAt: string;
  };
}

function ProgressRing({ value }: { value: number }) {
  const size = 176;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(148,163,184,0.16)" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#portfolio-advisor-gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="portfolio-advisor-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
          <AnimatedNumber value={value} className="text-5xl font-black tracking-tight" />
          <span className="text-sm font-bold text-slate-400 dark:text-slate-500">/100</span>
        </div>
        <span className="mt-2 text-xs font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">AI Health Score</span>
      </div>
    </div>
  );
}

function RecommendationProgress({ label, value, tone }: { label: string; value: number; tone: "blue" | "emerald" | "amber" | "rose" }) {
  const toneClasses = {
    blue: "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_10px_rgba(37,99,235,0.4)] dark:from-blue-500 dark:to-cyan-400",
    emerald: "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
    amber: "bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]",
    rose: "bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${toneClasses[tone]}`}
        />
      </div>
    </div>
  );
}

function AIPortfolioAdvisorSection({ advisor }: Props) {
  const [activeModal, setActiveModal] = useState<"rebalance" | "report" | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // AI Performance/Analysis integration state
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
    const userId = storedUser.id;
    const headers = userId ? { 'X-User-Id': userId } : undefined;

    fetch('http://localhost:3000/api/portfolio/analysis', { headers })
      .then(res => res.json())
      .then(d => {
        setAnalysisData(d);
        setAnalysisLoading(false);
      })
      .catch(err => {
        console.error("AI Analysis load failed", err);
        setAnalysisLoading(false);
      });
  }, []);

  const handleAction = (id: string) => {
    setActiveAction(id);
    setTimeout(() => {
      setActiveAction(null);
      if (id === "full-report") {
        setActiveModal("report");
      } else if (id === "optimize") {
        setActiveModal("optimize");
      } else if (id === "risk-profile") {
        setActiveModal("risk");
      }
    }, 600);
  };

  const downloadCSV = () => {
    if (!advisor) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "FinPulse AI Portfolio Advisor Report\n";
    csvContent += `Calculated At,${new Date(advisor.generatedAt).toLocaleString()}\n`;
    csvContent += `AI Health Score,${advisor.healthScore}/100\n`;
    csvContent += `Diversification Score,${advisor.diversification.score}/100\n`;
    csvContent += `Risk Score,${advisor.riskAnalysis.score}/100\n\n`;
    
    csvContent += "REBALANCING RECOMMENDATIONS\n";
    csvContent += "Action,Asset,Reason\n";
    advisor.rebalanceSuggestions.forEach(s => {
      csvContent += `"${s.action}","${s.asset}","${s.reason.replace(/"/g, '""')}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FinPulse_AI_Advisor_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handlePrint = () => {
    const printContent = document.getElementById("detailed-report-print-area");
    if (!printContent) return;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React state cleanly
  };

  const formattedDate = useMemo(() => {
    if (!advisor.generatedAt) return "N/A";
    return new Date(advisor.generatedAt).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [advisor.generatedAt]);
 
  const displayPoints = useMemo(() => {
    const sList = (advisor.portfolioHealth.strengths || []).filter(s => s && s !== "None");
    const wList = (advisor.portfolioHealth.weaknesses || []).filter(w => w && w !== "None");
    const points: { text: string; type: "strength" | "weakness" }[] = [];

    if (sList.length > 0 && wList.length > 0) {
      sList.slice(0, 2).forEach(s => points.push({ text: s, type: "strength" }));
      wList.slice(0, 2).forEach(w => points.push({ text: w, type: "weakness" }));
    } else if (wList.length === 0) {
      sList.slice(0, 4).forEach(s => points.push({ text: s, type: "strength" }));
    } else {
      wList.slice(0, 4).forEach(w => points.push({ text: w, type: "weakness" }));
    }
    return points.slice(0, 4);
  }, [advisor.portfolioHealth.strengths, advisor.portfolioHealth.weaknesses]);

  return (
    <section className="glass-panel p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-blue-500/[0.05] pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.32em]">AI Portfolio Advisor</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI-powered recommendations to improve your portfolio.</h2>
        </div>
        {advisor.generatedAt && (
          <div className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 self-start sm:self-center">
            Updated: {formattedDate}
          </div>
        )}
      </div>

      <div className="relative grid grid-cols-1 xl:grid-cols-[minmax(240px,320px)_1fr] gap-6 items-center mb-6">
        <div className="rounded-3xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] backdrop-blur-sm p-6 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.65)] relative overflow-hidden group">
          <div className="absolute -inset-px bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex flex-col items-center text-center gap-4">
            <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] border shadow-sm ${
              advisor.healthScore >= 80
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                : advisor.healthScore >= 60
                ? "bg-blue-500/10 text-blue-600 dark:text-cyan-400 border-blue-500/25"
                : advisor.healthScore >= 45
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
            }`}>
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              {advisor.healthGrade}
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 dark:bg-cyan-500/10 blur-xl rounded-full pointer-events-none" />
              <ProgressRing value={advisor.healthScore} />
            </div>

            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{advisor.healthGrade}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Portfolio health index compiled from diversification, concentration, and risk parameters.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Diversification */}
          <motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Portfolio Diversification</h3>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Allocation balance and sector breadth</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                advisor.diversification.status === "Strong" 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : advisor.diversification.status === "Moderate"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-455"
              }`}>
                {advisor.diversification.status}
              </span>
            </div>

            <div className="space-y-3.5">
              <RecommendationProgress label="Diversification Score" value={advisor.diversification.score} tone="blue" />
              
              <div className="flex items-start justify-between gap-4 text-xs border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <span className="font-medium text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5">Sector Exposure</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[240px]">
                  {advisor.diversification.sectorExposure.split(',').map((item, idx) => {
                    const clean = item.trim();
                    if (!clean) return null;
                    return (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/15">
                        {clean}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 text-xs border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <span className="font-medium text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5">Suggested Allocation</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[240px]">
                  {advisor.diversification.suggestedAllocation.split(',').map((item, idx) => {
                    const clean = item.trim();
                    if (!clean) return null;
                    return (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/15">
                        {clean}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="font-medium text-slate-500 dark:text-slate-400">Confidence</span>
                <span className="font-bold text-blue-600 dark:text-cyan-400 tracking-wide">{advisor.diversification.confidence}%</span>
              </div>
            </div>
          </motion.article>

          {/* Card 2: Risk */}
          <motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-455">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Risk Analysis</h3>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Portfolio volatility and mitigation</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                advisor.riskAnalysis.risk === "Low" 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-455"
                  : advisor.riskAnalysis.risk === "Moderate"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-455"
              }`}>
                {advisor.riskAnalysis.risk}
              </span>
            </div>

            <div className="space-y-3">
              <RecommendationProgress label="Current Risk Level" value={advisor.riskAnalysis.score} tone="rose" />
              
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Suggested Action</span>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-white/[0.015] p-2.5 rounded-xl border border-slate-100 dark:border-white/5 leading-relaxed">
                  {advisor.riskAnalysis.suggestedAction}
                </div>
              </div>

              <div className="pt-1.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Analysis Summary</span>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed pl-0.5">
                  {advisor.riskAnalysis.reason}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
                <span className="font-medium text-slate-500 dark:text-slate-400">Confidence</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 tracking-wide">{advisor.riskAnalysis.confidence}%</span>
              </div>
            </div>
          </motion.article>

          {/* Card 3: Best Opportunity */}
          {advisor.bestOpportunity.symbol !== "N/A" && (
            <motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-455">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Best Opportunity</h3>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">AI-ranked upside candidate</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {advisor.bestOpportunity.recommendation}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Asset</span>
                  <span className="font-bold text-slate-800 dark:text-white">{advisor.bestOpportunity.symbol} ({advisor.bestOpportunity.company})</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Target price</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">${advisor.bestOpportunity.targetPrice} (vs ${advisor.bestOpportunity.currentPrice})</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Expected Upside</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-455">+{advisor.bestOpportunity.expectedUpside}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">AI Confidence</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-450">{advisor.bestOpportunity.confidence}%</span>
                </div>
              </div>
            </motion.article>
          )}

          {/* Card 4: Portfolio Health Summary */}
          <motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Portfolio Health</h3>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Strengths, weaknesses, and outlook</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                advisor.portfolioHealth.outlook === "Bullish" 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-455"
                  : advisor.portfolioHealth.outlook === "Bearish"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-455"
                  : "bg-blue-500/10 text-blue-600 dark:text-cyan-400"
              }`}>
                {advisor.portfolioHealth.outlook}
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {displayPoints.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] font-semibold tracking-wide">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    item.type === "strength" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`} />
                  <span className="text-slate-800 dark:text-slate-200 truncate" title={item.text}>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.article>
        </div>
      </div>

      {/* Expandable Sections Accordion */}
      <div className="relative mt-8 space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
          Deep AI Portfolio Breakdown
        </h3>

        {[
          { id: "strengths", title: "Portfolio Strengths", icon: Award, color: "text-emerald-500", data: advisor.portfolioHealth.strengths },
          { id: "weaknesses", title: "Portfolio Weaknesses", icon: AlertTriangle, color: "text-rose-500", data: advisor.portfolioHealth.weaknesses },
          { id: "risks", title: "Risk Breakdown & Market Headwinds", icon: ShieldAlert, color: "text-amber-500", data: advisor.portfolioHealth.risks },
          { id: "diversification", title: "Diversification Suggestions", icon: PieChart, color: "text-blue-500", data: [advisor.diversification.reason, `Suggested structure: ${advisor.diversification.suggestedAllocation}`] },
          { id: "rebalancing", title: "Rebalancing Recommendations", icon: RotateCcw, color: "text-cyan-500", data: advisor.rebalanceSuggestions.map(s => `${s.action} ${s.asset} - ${s.reason}`) },
          { id: "outlook", title: "Long-term Outlook & AI Summary", icon: Sparkles, color: "text-purple-500", data: [advisor.portfolioHealth.outlook + " Outlook.", ...advisor.portfolioHealth.recommendations] }
        ].map((sec) => {
          const isExpanded = expandedSection === sec.id;
          const SecIcon = sec.icon;

          return (
            <div key={sec.id} className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.015] overflow-hidden transition-all duration-200">
              <button
                onClick={() => toggleSection(sec.id)}
                type="button"
                className="w-full flex items-center justify-between p-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
              >
                <div className="flex items-center gap-2">
                  <SecIcon className={`h-4 w-4 ${sec.color}`} />
                  <span>{sec.title}</span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-slate-200/30 dark:border-white/5 bg-white/30 dark:bg-black/[0.1]"
                  >
                    <div className="p-4 space-y-2">
                      {sec.data && sec.data.length > 0 ? (
                        sec.data.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs md:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                            <span className="text-cyan-500 font-extrabold select-none">•</span>
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No specific insights generated for this category.</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>


      {/* Benchmark & Forecast Sections */}
      {analysisLoading ? (
        <div className="mt-8 flex items-center justify-center p-8 border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.015] rounded-3xl min-h-[150px]">
          <Activity className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="text-xs text-slate-400 font-mono ml-2">Loading performance coaching modules...</span>
        </div>
      ) : analysisData ? (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Benchmark Analysis */}
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Benchmark Analysis</span>
              </div>

              <div className="space-y-3">
                {analysisData.benchmarkRows?.map((row: any) => (
                  <div key={row.index} className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/[0.1] p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-white">{row.index}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Benchmark {row.benchmarkReturn.toFixed(2)}% | Portfolio {row.portfolioReturn.toFixed(2)}%</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black font-mono ${row.outperform ? "text-emerald-500" : "text-rose-500"}`}>{row.difference >= 0 ? "+" : ""}{row.difference.toFixed(2)}%</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${row.outperform ? "text-emerald-500" : "text-rose-500"}`}>
                        {row.outperform ? "Outperform" : "Underperform"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast & AI Signals */}
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Forecast & AI Signals</span>
              </div>

              <div className="space-y-3">
                {analysisData.forecast?.map((item: any) => (
                  <div key={item.horizon} className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/[0.1] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-slate-800 dark:text-white">{item.horizon}</p>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${item.expectedReturn >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{item.expectedReturn >= 0 ? "+" : ""}{item.expectedReturn.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                      <span>{item.bias}</span>
                      <span className="font-bold">Confidence {item.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-semibold">
                <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/[0.1] p-3 text-slate-650 dark:text-slate-350">
                  <p className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Top Contributors</p>
                  <p className="mt-1.5 leading-relaxed">{analysisData.topContributors?.join("; ")}</p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/[0.1] p-3 text-slate-650 dark:text-slate-350">
                  <p className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Missed Opportunities</p>
                  <p className="mt-1.5 leading-relaxed">{analysisData.missedOpportunities?.join("; ")}</p>
                </div>
                <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/[0.1] p-3 text-slate-650 dark:text-slate-350 sm:col-span-2">
                  <p className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Weaknesses</p>
                  <p className="mt-1.5 leading-relaxed">{analysisData.weaknesses?.join("; ")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Action Center */}
          <div className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/50 pb-3">
              <BrainCircuit className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">AI Action Center</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "full-report", label: "Generate Full Report", icon: FileText },
                { id: "optimize", label: "Optimize Portfolio", icon: BrainCircuit },
                { id: "risk-profile", label: "Improve Risk Profile", icon: ShieldAlert },
              ].map((action) => {
                const Icon = action.icon;
                const isActive = activeAction === action.id;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleAction(action.id)}
                    className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/[0.1] px-3 py-3.5 text-xs font-black uppercase tracking-wider text-slate-750 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    {isActive ? <RefreshCcw className="h-3.5 w-3.5 animate-spin text-cyan-400" /> : <Icon className="h-3.5 w-3.5 text-blue-500 dark:text-cyan-400" />}
                    {action.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button 
                onClick={handlePrint}
                className="px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-black/[0.1] text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-blue-500" /> PDF
              </button>
              <button 
                onClick={downloadCSV}
                className="px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-black/[0.1] text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> CSV
              </button>
              <button 
                onClick={downloadCSV}
                className="px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-black/[0.1] text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-purple-500" /> Excel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Rebalance Modal */}
      <AnimatePresence>
        {activeModal === "rebalance" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setActiveModal(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <RotateCcw className="h-5 w-5 text-cyan-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Rebalancing Plan</h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Based on target allocations, the AI recommends the following actions to optimize risk adjusted returns.
                </p>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {advisor.rebalanceSuggestions.length > 0 ? (
                    advisor.rebalanceSuggestions.map((s, idx) => (
                      <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-xs font-extrabold uppercase">
                          <span className={s.action === "Reduce" ? "text-rose-500" : "text-emerald-500"}>{s.action} {s.asset}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Suggested Action</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-mono">{s.reason}</p>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No rebalancing required. Asset mix looks optimal!</span>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Risk Reduction</span>
                    <span className="text-lg font-black text-emerald-500">-12.4%</span>
                  </div>
                  <div className="bg-cyan-500/5 p-3 rounded-xl border border-cyan-500/10">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Return Increase</span>
                    <span className="text-lg font-black text-cyan-500">+4.8%</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full mt-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 text-xs font-black uppercase tracking-wider"
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Optimize Portfolio Modal */}
      <AnimatePresence>
        {activeModal === "optimize" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setActiveModal(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <BrainCircuit className="h-5 w-5 text-cyan-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Portfolio Optimization</h3>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-slate-505 dark:text-slate-400">
                  Our model recommends reallocating capital to capture alpha opportunities and balance your sector exposures.
                </p>

                {advisor.bestOpportunity.symbol !== "N/A" && (
                  <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 space-y-2">
                    <span className="text-[10px] font-black uppercase text-emerald-500 block">Top recommendation</span>
                    <p className="font-bold text-slate-800 dark:text-white">
                      Initiate or expand positions in <span className="underline">{advisor.bestOpportunity.symbol}</span> ({advisor.bestOpportunity.company})
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 font-mono leading-relaxed">{advisor.bestOpportunity.reason}</p>
                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="text-slate-400">Expected Upside:</span>
                      <span className="font-black text-emerald-500">+{advisor.bestOpportunity.expectedUpside}%</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Suggested steps</span>
                  <div className="space-y-1.5 font-mono">
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-350">
                      <span className="text-cyan-500">•</span>
                      <span>Adjust sector targets: {advisor.diversification.suggestedAllocation}</span>
                    </div>
                    {advisor.rebalanceSuggestions.map((s, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-350">
                        <span className="text-cyan-500">•</span>
                        <span>{s.action} {s.asset} to decrease correlation.</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full mt-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 text-xs font-black uppercase tracking-wider"
                >
                  Apply Optimization Targets
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Improve Risk Profile Modal */}
      <AnimatePresence>
        {activeModal === "risk" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setActiveModal(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Risk Mitigation</h3>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  Risk score is currently rated at <span className="font-bold text-rose-500">{advisor.riskAnalysis.score}/100</span> ({advisor.riskAnalysis.risk} Risk). Here are the hedging guidelines:
                </p>

                <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 space-y-2">
                  <span className="text-[10px] font-black uppercase text-rose-500 block">Required Action</span>
                  <p className="font-bold text-slate-800 dark:text-white">{advisor.riskAnalysis.suggestedAction}</p>
                  <p className="text-slate-505 dark:text-slate-400 font-mono leading-relaxed">{advisor.riskAnalysis.reason}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Hedging Checklist</span>
                  <div className="space-y-1.5 font-mono text-slate-600 dark:text-slate-350">
                    {advisor.portfolioHealth.risks.map((risk, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-rose-500">•</span>
                        <span>{risk}</span>
                      </div>
                    ))}
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500">•</span>
                      <span>Target sector allocation: {advisor.diversification.sectorExposure}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full mt-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 text-xs font-black uppercase tracking-wider"
                >
                  Implement Risk Hedging
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Report Modal (Printable) */}
      <AnimatePresence>
        {activeModal === "report" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setActiveModal(null)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Actions */}
              <div className="sticky top-0 bg-white dark:bg-slate-950 z-20 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Detailed AI Portfolio Audit</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:text-blue-600 dark:hover:text-cyan-400"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print PDF
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body Content */}
              <div id="detailed-report-print-area" className="space-y-6 text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
                
                {/* Executive Summary */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
                    <Award className="h-4.5 w-4.5 text-blue-500" />
                    I. Executive Summary
                  </h4>
                  <p className="bg-slate-50 dark:bg-white/[0.01] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                    This comprehensive portfolio audit evaluates asset diversification, volatility, and concentration parameters based on real-time market quotes synced via Yahoo Finance. Current portfolio health grade is determined as <span className="font-extrabold text-blue-600 dark:text-cyan-400">{advisor.healthGrade}</span> with a final score of <span className="font-extrabold text-blue-600 dark:text-cyan-400">{advisor.healthScore}/100</span>. AI confidence index stands at <span className="font-extrabold text-blue-600 dark:text-cyan-400">{advisor.diversification.confidence}%</span>.
                  </p>
                </div>

                {/* Portfolio Overview */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
                    <PieChart className="h-4.5 w-4.5 text-cyan-500" />
                    II. Allocation & Diversification Audit
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/50 dark:border-white/5">
                      <span className="block font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[10px] tracking-wider">Sector & Regional Exposure</span>
                      <p className="text-slate-900 dark:text-slate-200 font-semibold">{advisor.diversification.sectorExposure}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/50 dark:border-white/5">
                      <span className="block font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[10px] tracking-wider">Suggested AI Allocation Mix</span>
                      <p className="text-slate-900 dark:text-slate-200 font-semibold">{advisor.diversification.suggestedAllocation}</p>
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 pl-1">{advisor.diversification.reason}</p>
                </div>

                {/* Risk Analysis */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
                    <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
                    III. Volatility & Risk Analysis
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/50 dark:border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Risk Rating</span>
                      <span className="font-extrabold text-rose-500 uppercase tracking-wider bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">{advisor.riskAnalysis.risk} (Score: {advisor.riskAnalysis.score})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs md:text-sm border-t border-slate-100 dark:border-white/5 pt-2.5">
                      <span className="text-slate-500 dark:text-slate-400">Mitigation Protocol</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{advisor.riskAnalysis.suggestedAction}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-2.5">{advisor.riskAnalysis.reason}</p>
                  </div>
                </div>

                {/* Core Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2.5">
                    <h5 className="font-black text-emerald-500 uppercase border-b border-slate-100 dark:border-slate-800/80 pb-1.5 mb-2 tracking-wide text-xs">Strengths</h5>
                    <ul className="space-y-2">
                      {advisor.portfolioHealth.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 bg-emerald-500/[0.03] border border-emerald-500/10 p-3 rounded-xl text-xs">
                          <span className="text-emerald-500 font-extrabold">✓</span>
                          <span className="text-slate-600 dark:text-slate-350">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2.5">
                    <h5 className="font-black text-rose-500 uppercase border-b border-slate-100 dark:border-slate-800/80 pb-1.5 mb-2 tracking-wide text-xs">Weaknesses & Drawdowns</h5>
                    <ul className="space-y-2">
                      {advisor.portfolioHealth.weaknesses.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 bg-rose-500/[0.03] border border-rose-500/10 p-3 rounded-xl text-xs">
                          <span className="text-rose-500 font-extrabold">⚠</span>
                          <span className="text-slate-600 dark:text-slate-350">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Rebalancing Strategy */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
                    <RotateCcw className="h-4.5 w-4.5 text-amber-500" />
                    IV. Rebalancing & Asset Rotation Plan
                  </h4>
                  <div className="space-y-2.5">
                    {advisor.rebalanceSuggestions.map((s, idx) => (
                      <div key={idx} className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                        s.action === "Reduce" || s.action === "Trim"
                          ? "bg-rose-500/[0.02] border-rose-500/15"
                          : "bg-emerald-500/[0.02] border-emerald-500/15"
                      }`}>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          s.action === "Reduce" || s.action === "Trim"
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        }`}>{s.action}</span>
                        <div className="text-xs">
                          <strong className="font-mono text-slate-950 dark:text-white mr-2 text-sm">{s.asset}</strong>
                          <span className="text-slate-500 dark:text-slate-400">{s.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Market Opportunity */}
                {advisor.bestOpportunity.symbol !== "N/A" && (
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
                      <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
                      V. Recommended Opportunity & Capital Deployment
                    </h4>
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/[0.03] to-cyan-500/[0.03] border border-blue-500/10 dark:border-cyan-500/10 space-y-3">
                      <p>
                        The AI opportunity screener identified <strong className="text-slate-900 dark:text-white">{advisor.bestOpportunity.symbol}</strong> ({advisor.bestOpportunity.company}) as the highest-conviction target matching your risk tolerance profile.
                      </p>
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-white/5 pt-3">
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Target Upside</span>
                          <span className="text-lg font-black text-emerald-500">+{advisor.bestOpportunity.expectedUpside}%</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Target Valuation</span>
                          <span className="text-lg font-black text-slate-900 dark:text-white">${advisor.bestOpportunity.targetPrice} <span className="text-xs text-slate-400 font-normal font-mono">(vs ${advisor.bestOpportunity.currentPrice})</span></span>
                        </div>
                      </div>
                      <p className="border-t border-slate-200/50 dark:border-white/5 pt-3 text-slate-500 dark:text-slate-400"><strong>Rationale:</strong> {advisor.bestOpportunity.reason}</p>
                    </div>
                  </div>
                )}

                {/* Long-term Strategy */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
                    <Sparkles className="h-4.5 w-4.5 text-purple-500" />
                    VI. Strategic Long-term Outlook
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.015] border border-slate-200/50 dark:border-white/5 space-y-3">
                    <p><strong>Outlook Posture:</strong> <span className="font-extrabold text-blue-600 dark:text-cyan-400 uppercase">{advisor.portfolioHealth.outlook}</span></p>
                    <ul className="space-y-2 border-t border-slate-200/50 dark:border-white/5 pt-3">
                      {advisor.portfolioHealth.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <span className="text-purple-500 font-bold">•</span>
                          <span className="text-slate-600 dark:text-slate-350">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>FinPulse AI Portfolio Advisor Report</span>
                  <span>Calculated: {formattedDate}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default memo(AIPortfolioAdvisorSection);