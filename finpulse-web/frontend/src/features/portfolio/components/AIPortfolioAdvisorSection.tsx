import { memo, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  FileText,
  Layers3,
  PieChart,
  RotateCcw,
  ShieldAlert,
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
      currency?: string;
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
          stroke="#22d3ee"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
          <AnimatedNumber value={value} className="text-5xl font-black tracking-tight" />
          <span className="text-sm font-bold text-slate-400 dark:text-slate-500">/100</span>
        </div>
        <span className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">AI Health Score</span>
      </div>
    </div>
  );
}

function RecommendationProgress({ label, value, tone }: { label: string; value: number; tone: "blue" | "emerald" | "amber" | "rose" }) {
  const toneClasses = {
    blue: "bg-cyan-400",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#2a2a2a]">
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
  const [activeModal, setActiveModal] = useState<"rebalance" | "report" | "optimize" | "risk" | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  useEffect(() => {
    if (!activeModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeModal]);

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

  const handleCloseModal = () => {
    setActiveModal(null);
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
    link.setAttribute("download", `FinPulse_AI_Advisor_Report_${new Date().toISOString().slice(0, 10)}.csv`);
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
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>FinPulse AI Portfolio Advisor Report</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 32px; color: #1f2937; font: 14px/1.6 Arial, sans-serif; }
            h4, h5 { color: #111827; page-break-after: avoid; }
            p, li { page-break-inside: avoid; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
            @media print { body { margin: 20mm; } }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.addEventListener("afterprint", () => printWindow.close(), { once: true });
    printWindow.print();
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

  const formatOpportunityPrice = (value: number) => {
    const currency = advisor.bestOpportunity.currency || "USD";
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  };

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
    <section id="ai-advisor-section" className="relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#141414] p-4 text-white shadow-xl sm:p-5 lg:p-6">

      <div className="relative mb-5 flex flex-col justify-between gap-3 border-b border-[#2a2a2a] pb-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d8d8d]">AI Portfolio Advisor</span>
          <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Portfolio intelligence and actionable risk guidance</h2>
        </div>
        {advisor.generatedAt && (
          <div className="self-start rounded-lg border border-[#2a2a2a] bg-[#1d1d1d] px-3 py-1.5 font-mono text-[10px] font-bold text-[#8d8d8d] sm:self-center">
            Updated: {formattedDate}
          </div>
        )}
      </div>

      <div className="relative mb-5 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[minmax(220px,280px)_1fr]">
        <div className="flex flex-col justify-center rounded-xl border border-[#2a2a2a] bg-[#171717] p-4 sm:p-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <ProgressRing value={advisor.healthScore} />
            </div>

            <div>
              <p className="text-lg font-bold text-white">{advisor.healthGrade}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#8d8d8d]">Portfolio health index across diversification, concentration, and risk.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Card 1: Diversification */}
          <motion.article whileHover={{ y: -2 }} className="flex min-h-[270px] flex-col rounded-xl border border-[#2a2a2a] bg-[#171717] p-4 transition-colors hover:border-[#3a3a3a] sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Portfolio Diversification</h3>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Allocation balance and sector breadth</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${advisor.diversification.status === "Strong"
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
          <motion.article whileHover={{ y: -2 }} className="flex min-h-[270px] flex-col rounded-xl border border-[#2a2a2a] bg-[#171717] p-4 transition-colors hover:border-[#3a3a3a] sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Risk Analysis</h3>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Portfolio volatility and mitigation</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${advisor.riskAnalysis.risk === "Low"
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
            <motion.article whileHover={{ y: -2 }} className="flex min-h-[270px] flex-col rounded-xl border border-[#2a2a2a] bg-[#171717] p-4 transition-colors hover:border-[#3a3a3a] sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
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
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatOpportunityPrice(advisor.bestOpportunity.targetPrice)} (vs {formatOpportunityPrice(advisor.bestOpportunity.currentPrice)})</span>
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
          <motion.article whileHover={{ y: -2 }} className="flex min-h-[270px] flex-col rounded-xl border border-[#2a2a2a] bg-[#171717] p-4 transition-colors hover:border-[#3a3a3a] sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Portfolio Health</h3>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Strengths, weaknesses, and outlook</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${advisor.portfolioHealth.outlook === "Bullish"
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
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.type === "strength" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`} />
                  <span className="text-slate-800 dark:text-slate-200 truncate" title={item.text}>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.article>
        </div>
      </div>

      {/* Expandable Sections Accordion */}
      <div className="relative mt-5 space-y-2">
        <h3 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8d8d8d]">
          <Info className="h-3.5 w-3.5 text-cyan-400" />
          Deep AI Portfolio Breakdown
        </h3>

        {[
          { id: "strengths", title: "Portfolio Strengths", icon: Award, color: "text-emerald-500", data: advisor.portfolioHealth.strengths },
          { id: "weaknesses", title: "Portfolio Weaknesses", icon: AlertTriangle, color: "text-rose-500", data: advisor.portfolioHealth.weaknesses },
          { id: "risks", title: "Risk Breakdown & Market Headwinds", icon: ShieldAlert, color: "text-amber-500", data: advisor.portfolioHealth.risks },
          { id: "diversification", title: "Diversification Suggestions", icon: PieChart, color: "text-blue-500", data: [advisor.diversification.reason, `Suggested structure: ${advisor.diversification.suggestedAllocation}`] },
          { id: "rebalancing", title: "Rebalancing Recommendations", icon: RotateCcw, color: "text-cyan-500", data: advisor.rebalanceSuggestions.map(s => `${s.action} ${s.asset} - ${s.reason}`) },
          { id: "outlook", title: "Long-term Outlook & AI Summary", icon: BrainCircuit, color: "text-purple-500", data: [advisor.portfolioHealth.outlook + " Outlook.", ...advisor.portfolioHealth.recommendations] }
        ].map((sec) => {
          const isExpanded = expandedSection === sec.id;
          const SecIcon = sec.icon;

          return (
            <div key={sec.id} className="overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#171717] transition-colors hover:border-[#3a3a3a]">
              <button
                onClick={() => toggleSection(sec.id)}
                type="button"
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between px-3.5 py-3 text-left text-xs font-semibold text-[#d7d7d7] transition-colors hover:bg-[#1d1d1d] focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${sec.color.replace('text-', 'bg-')}`} />
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
                    className="overflow-hidden border-t border-[#2a2a2a] bg-[#141414]"
                  >
                    <div className="space-y-2 px-3.5 py-3">
                      {sec.data && sec.data.length > 0 ? (
                        sec.data.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs font-medium leading-relaxed text-[#bdbdbd] md:text-sm">
                            <span className="select-none font-extrabold text-cyan-400">•</span>
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

      {/* AI Action Center */}
      <div className="mt-5 rounded-xl border border-[#2a2a2a] bg-[#171717] p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-[#2a2a2a] pb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8d8d8d]">AI Action Center</span>
            </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
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
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1d1d1d] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#d7d7d7] transition-colors hover:border-cyan-500/40 hover:bg-[#222] hover:text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
                  >
                    {isActive && <RefreshCcw className="h-3.5 w-3.5 animate-spin text-cyan-400" />}
                    {action.label}
                  </button>
                );
              })}
            </div>

          <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#1d1d1d] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#bdbdbd] transition-colors hover:bg-[#222] hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
              >
                <FileText className="h-3.5 w-3.5 text-blue-500" /> PDF
              </button>
              <button
                onClick={downloadCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#1d1d1d] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#bdbdbd] transition-colors hover:bg-[#222] hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> CSV
              </button>
              <button
                onClick={downloadCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#1d1d1d] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#bdbdbd] transition-colors hover:bg-[#222] hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
              >
                <Download className="h-3.5 w-3.5 text-purple-500" /> Excel
              </button>
            </div>
          </div>

      {/* Rebalance Modal */}
      <AnimatePresence>
        {activeModal === "rebalance" && (
          <div role="dialog" aria-modal="true" aria-labelledby="rebalance-modal-title" className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center overflow-hidden bg-black/85 p-3 backdrop-blur-3xl backdrop-saturate-100 sm:p-4" onClick={handleCloseModal}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-[#333] bg-[#1d1d1d] p-4 text-[#d7d7d7] shadow-2xl custom-scrollbar sm:max-h-[calc(100dvh-2rem)] sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseModal}
                aria-label="Close rebalancing plan"
                className="absolute right-3 top-3 rounded-lg p-1.5 text-[#8d8d8d] transition-colors hover:bg-[#2a2a2a] hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <RotateCcw className="h-5 w-5 text-cyan-500" />
                <h3 id="rebalance-modal-title" className="text-base font-semibold text-white">AI Rebalancing Plan</h3>
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
          <div role="dialog" aria-modal="true" aria-labelledby="optimize-modal-title" className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center overflow-hidden bg-black/85 p-3 backdrop-blur-3xl backdrop-saturate-100 sm:p-4" onClick={handleCloseModal}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-[#333] bg-[#1d1d1d] p-4 text-[#d7d7d7] shadow-2xl custom-scrollbar sm:max-h-[calc(100dvh-2rem)] sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseModal}
                aria-label="Close portfolio optimization"
                className="absolute right-3 top-3 rounded-lg p-1.5 text-[#8d8d8d] transition-colors hover:bg-[#2a2a2a] hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <h3 id="optimize-modal-title" className="text-base font-semibold text-white">AI Portfolio Optimization</h3>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
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
                  onClick={handleCloseModal}
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
          <div role="dialog" aria-modal="true" aria-labelledby="risk-modal-title" className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center overflow-hidden bg-black/85 p-3 backdrop-blur-3xl backdrop-saturate-100 sm:p-4" onClick={handleCloseModal}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-[#333] bg-[#1d1d1d] p-4 text-[#d7d7d7] shadow-2xl custom-scrollbar sm:max-h-[calc(100dvh-2rem)] sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseModal}
                aria-label="Close risk mitigation"
                className="absolute right-3 top-3 rounded-lg p-1.5 text-[#8d8d8d] transition-colors hover:bg-[#2a2a2a] hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <h3 id="risk-modal-title" className="text-base font-semibold text-white">AI Risk Mitigation</h3>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  Risk score is currently rated at <span className="font-bold text-rose-500">{advisor.riskAnalysis.score}/100</span> ({advisor.riskAnalysis.risk} Risk). Here are the hedging guidelines:
                </p>

                <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 space-y-2">
                  <span className="text-[10px] font-black uppercase text-rose-500 block">Required Action</span>
                  <p className="font-bold text-slate-800 dark:text-white">{advisor.riskAnalysis.suggestedAction}</p>
                  <p className="text-slate-500 dark:text-slate-400 font-mono leading-relaxed">{advisor.riskAnalysis.reason}</p>
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
                  onClick={handleCloseModal}
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
          <div role="dialog" aria-modal="true" aria-labelledby="report-modal-title" className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center overflow-hidden bg-black/90 p-3 backdrop-blur-3xl backdrop-saturate-100 sm:p-4" onClick={handleCloseModal}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-xl border border-[#333] bg-[#1d1d1d] px-4 pb-4 text-[#d7d7d7] shadow-2xl custom-scrollbar sm:max-h-[calc(100dvh-2rem)] sm:px-6 sm:pb-6 md:px-8 md:pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseModal}
                aria-label="Close detailed portfolio audit"
                className="absolute right-3 top-3 z-30 rounded-lg p-1.5 text-[#8d8d8d] transition-colors hover:bg-[#2a2a2a] hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/60 sm:right-4 sm:top-4"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header Actions */}
              <div className="sticky top-0 z-20 mb-4 flex flex-col justify-between gap-3 border-b border-[#333] bg-[#1d1d1d] pb-4 pt-5 pr-10 sm:flex-row sm:items-center sm:pt-6 md:pt-8">
                <div>
                  <h3 id="report-modal-title" className="text-sm font-semibold text-white sm:text-base">Detailed AI Portfolio Audit</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:text-blue-600 dark:hover:text-cyan-400 transition-all active:scale-95 shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5 text-blue-500 dark:text-cyan-400" />
                    Print PDF
                  </button>
                </div>
              </div>

              {/* Printable Body Content */}
              <div id="detailed-report-print-area" className="space-y-6 text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed">

                {/* Executive Summary */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
                    I. Executive Summary
                  </h4>
                  <p className="bg-slate-50 dark:bg-white/[0.01] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                    This comprehensive portfolio audit evaluates asset diversification, volatility, and concentration parameters based on real-time market quotes synced via Yahoo Finance. Current portfolio health grade is determined as <span className="font-extrabold text-blue-600 dark:text-cyan-400">{advisor.healthGrade}</span> with a final score of <span className="font-extrabold text-blue-600 dark:text-cyan-400">{advisor.healthScore}/100</span>. AI confidence index stands at <span className="font-extrabold text-blue-600 dark:text-cyan-400">{advisor.diversification.confidence}%</span>.
                  </p>
                </div>

                {/* Portfolio Overview */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
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
                  <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
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
                  <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
                    IV. Rebalancing & Asset Rotation Plan
                  </h4>
                  <div className="space-y-2.5">
                    {advisor.rebalanceSuggestions.map((s, idx) => (
                      <div key={idx} className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${s.action === "Reduce" || s.action === "Trim"
                          ? "bg-rose-500/[0.02] border-rose-500/15"
                          : "bg-emerald-500/[0.02] border-emerald-500/15"
                        }`}>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${s.action === "Reduce" || s.action === "Trim"
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
                    <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
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
                          <span className="text-lg font-black text-slate-900 dark:text-white">{formatOpportunityPrice(advisor.bestOpportunity.targetPrice)} <span className="text-xs text-slate-400 font-normal font-mono">(vs {formatOpportunityPrice(advisor.bestOpportunity.currentPrice)})</span></span>
                        </div>
                      </div>
                      <p className="border-t border-slate-200/50 dark:border-white/5 pt-3 text-slate-500 dark:text-slate-400"><strong>Rationale:</strong> {advisor.bestOpportunity.reason}</p>
                    </div>
                  </div>
                )}

                {/* Long-term Strategy */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-slate-800/80 uppercase tracking-wider">
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