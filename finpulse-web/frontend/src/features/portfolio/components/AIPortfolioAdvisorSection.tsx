import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
import toast from "react-hot-toast";

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
  const size = 132;
  const strokeWidth = 8;
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
        <div className="flex items-baseline gap-0.5 text-slate-900 dark:text-white">
          <AnimatedNumber value={value} className="text-3xl sm:text-4xl font-black tracking-tight" />
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/100</span>
        </div>
        <span className="mt-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">AI Health Score</span>
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
    toast.success("AI Advisor Report exported successfully!");
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
    <section id="ai-advisor-section" className="glass-panel relative overflow-hidden p-4 sm:p-5 lg:p-6 shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-cyan-500/[0.04] pointer-events-none" />

      <div className="relative mb-5 flex flex-col justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">AI Portfolio Advisor</span>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">Portfolio intelligence and actionable risk guidance</h2>
        </div>
        {advisor.generatedAt && (
          <div className="self-start rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 sm:self-center">
            Updated: {formattedDate}
          </div>
        )}
      </div>

      <div className="relative mb-4 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[minmax(180px,240px)_1fr]">
        <div className="flex flex-col justify-center rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] backdrop-blur-sm p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative">
              <ProgressRing value={advisor.healthScore} />
            </div>

            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{advisor.healthGrade}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">Portfolio health index across diversification, concentration, and risk.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {/* Card 1: Diversification */}
          <motion.article whileHover={{ y: -2 }} className="flex flex-col rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] backdrop-blur-sm p-3.5 transition-all hover:border-blue-500/20 dark:hover:border-cyan-500/20 shadow-xs sm:p-4">
            <div className="flex items-center justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                  <PieChart className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Portfolio Diversification</h3>
                  <p className="text-[9px] font-medium text-slate-400">Allocation balance and sector breadth</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${advisor.diversification.status === "Strong"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : advisor.diversification.status === "Moderate"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}>
                {advisor.diversification.status}
              </span>
            </div>

            <div className="space-y-2">
              <RecommendationProgress label="Diversification Score" value={advisor.diversification.score} tone="blue" />

              <div className="flex flex-col gap-1 text-[11px] border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Sector Exposure</span>
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-snug bg-slate-50 dark:bg-white/[0.02] p-1.5 sm:p-2 rounded-lg border border-slate-100 dark:border-white/5">
                  {advisor.diversification.sectorExposure}
                </p>
              </div>

              <div className="flex flex-col gap-1 text-[11px] border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Suggested Allocation</span>
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-snug bg-slate-50 dark:bg-white/[0.02] p-1.5 sm:p-2 rounded-lg border border-slate-100 dark:border-white/5">
                  {advisor.diversification.suggestedAllocation}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="font-medium text-slate-400">Confidence</span>
                <span className="font-bold text-blue-600 dark:text-cyan-400 tracking-wide">{advisor.diversification.confidence}%</span>
              </div>
            </div>
          </motion.article>

          {/* Card 2: Risk */}
          <motion.article whileHover={{ y: -2 }} className="flex flex-col rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] backdrop-blur-sm p-3.5 transition-all hover:border-rose-500/20 dark:hover:border-rose-500/20 shadow-xs sm:p-4">
            <div className="flex items-center justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 dark:text-rose-400">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Risk Analysis</h3>
                  <p className="text-[9px] font-medium text-slate-400">Portfolio volatility and mitigation</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${advisor.riskAnalysis.risk === "Low"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : advisor.riskAnalysis.risk === "Moderate"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}>
                {advisor.riskAnalysis.risk}
              </span>
            </div>

            <div className="space-y-2">
              <RecommendationProgress label="Current Risk Level" value={advisor.riskAnalysis.score} tone="rose" />

              <div className="pt-1.5 border-t border-slate-100 dark:border-white/5 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Suggested Action</span>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-white/[0.015] p-2 rounded-lg border border-slate-100 dark:border-white/5 leading-snug">
                  {advisor.riskAnalysis.suggestedAction}
                </div>
              </div>

              <div className="pt-1 space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Analysis Summary</span>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug pl-0.5">
                  {advisor.riskAnalysis.reason}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-white/5">
                <span className="font-medium text-slate-400">Confidence</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 tracking-wide">{advisor.riskAnalysis.confidence}%</span>
              </div>
            </div>
          </motion.article>

          {/* Card 3: Best Opportunity */}
          {advisor.bestOpportunity.symbol !== "N/A" && (
            <motion.article whileHover={{ y: -2 }} className="flex flex-col rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] backdrop-blur-sm p-3.5 transition-all hover:border-emerald-500/20 dark:hover:border-emerald-500/20 shadow-xs sm:p-4">
              <div className="flex items-center justify-between gap-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Best Opportunity</h3>
                    <p className="text-[9px] font-medium text-slate-400">AI-ranked upside candidate</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {advisor.bestOpportunity.recommendation}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] border-b border-slate-100 dark:border-white/5 pb-1.5">
                  <span className="font-semibold text-slate-400">Asset</span>
                  <span className="font-bold text-slate-800 dark:text-white">{advisor.bestOpportunity.symbol} ({advisor.bestOpportunity.company})</span>
                </div>
                <div className="flex items-center justify-between text-[11px] border-b border-slate-100 dark:border-white/5 pb-1.5">
                  <span className="font-semibold text-slate-400">Target price</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatOpportunityPrice(advisor.bestOpportunity.targetPrice)} (vs {formatOpportunityPrice(advisor.bestOpportunity.currentPrice)})</span>
                </div>
                <div className="flex items-center justify-between text-[11px] border-b border-slate-100 dark:border-white/5 pb-1.5">
                  <span className="font-semibold text-slate-400">Expected Upside</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+{advisor.bestOpportunity.expectedUpside}%</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-400">AI Confidence</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{advisor.bestOpportunity.confidence}%</span>
                </div>
              </div>
            </motion.article>
          )}

          {/* Card 4: Portfolio Health Summary */}
          <motion.article whileHover={{ y: -2 }} className="flex flex-col rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] backdrop-blur-sm p-3.5 transition-all hover:border-blue-500/20 dark:hover:border-cyan-500/20 shadow-xs sm:p-4">
            <div className="flex items-center justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                  <Layers3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Portfolio Health</h3>
                  <p className="text-[9px] font-medium text-slate-400">Strengths, weaknesses, and outlook</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${advisor.portfolioHealth.outlook === "Bullish"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : advisor.portfolioHealth.outlook === "Bearish"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-blue-500/10 text-blue-600 dark:text-cyan-400"
                }`}>
                {advisor.portfolioHealth.outlook}
              </span>
            </div>

            <div className="space-y-1.5 pt-0.5">
              {displayPoints.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.type === "strength" ? "bg-emerald-500" : "bg-rose-500"
                    }`} />
                  <span className="text-slate-800 dark:text-slate-200 truncate" title={item.text}>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.article>
        </div>
      </div>

      {/* Expandable Sections Accordion */}
      <div className="relative mt-4 space-y-2">
        <h3 className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          <Info className="h-3 w-3 text-blue-600 dark:text-cyan-400" />
          Deep AI Portfolio Breakdown
        </h3>

        {[
          { id: "strengths", title: "Portfolio Strengths", icon: Award, color: "text-emerald-500", data: advisor.portfolioHealth.strengths },
          { id: "weaknesses", title: "Portfolio Weaknesses", icon: AlertTriangle, color: "text-rose-500", data: advisor.portfolioHealth.weaknesses },
          { id: "risks", title: "Risk Breakdown & Market Headwinds", icon: ShieldAlert, color: "text-amber-500", data: advisor.portfolioHealth.risks },
          { id: "diversification", title: "Diversification Suggestions", icon: PieChart, color: "text-cyan-500", data: [advisor.diversification.reason, `Suggested structure: ${advisor.diversification.suggestedAllocation}`] },
          { id: "rebalancing", title: "Rebalancing Recommendations", icon: RotateCcw, color: "text-cyan-500", data: advisor.rebalanceSuggestions.map(s => `${s.action} ${s.asset} - ${s.reason}`) },
          { id: "outlook", title: "Long-term Outlook & AI Summary", icon: BrainCircuit, color: "text-cyan-500", data: [advisor.portfolioHealth.outlook + " Outlook.", ...advisor.portfolioHealth.recommendations] }
        ].map((sec) => {
          const isExpanded = expandedSection === sec.id;

          return (
            <div key={sec.id} className="overflow-hidden rounded-xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] transition-all hover:border-slate-300 dark:hover:border-white/10 shadow-2xs">
              <button
                onClick={() => toggleSection(sec.id)}
                type="button"
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-800 dark:text-slate-200 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.03] focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${sec.color.replace('text-', 'bg-')}`} />
                  <span>{sec.title}</span>
                </div>
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.015]"
                  >
                    <div className="space-y-1.5 px-3.5 py-2.5">
                      {sec.data && sec.data.length > 0 ? (
                        sec.data.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                            <span className="select-none font-extrabold text-blue-600 dark:text-cyan-400">•</span>
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No specific insights generated for this category.</span>
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
      <div className="mt-4 rounded-xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] backdrop-blur-sm p-3 sm:p-4 shadow-2xs">
        <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">AI Action Center</span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { id: "full-report", label: "Generate Full Report", icon: FileText },
            { id: "optimize", label: "Optimize Portfolio", icon: BrainCircuit },
            { id: "risk-profile", label: "Improve Risk Profile", icon: ShieldAlert },
          ].map((action) => {
            const isActive = activeAction === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleAction(action.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] px-3.5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-all hover:border-blue-500/30 dark:hover:border-cyan-400/30 focus:outline-none"
              >
                {isActive && <RefreshCcw className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-cyan-400" />}
                {action.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all focus:outline-none"
          >
            <FileText className="h-3.5 w-3.5 text-blue-500" /> PDF
          </button>
          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all focus:outline-none"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> CSV
          </button>
          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all focus:outline-none"
          >
            <Download className="h-3.5 w-3.5 text-purple-500" /> Excel
          </button>
        </div>
      </div>

      {/* Modals rendered directly to document.body to ensure they break out of all parent stacking contexts */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {activeModal && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[99999] flex h-[100dvh] w-[100dvw] items-center justify-center overflow-y-auto bg-black/60 dark:bg-black/85 p-3 sm:p-6 backdrop-blur-md"
              onClick={handleCloseModal}
            >
              {/* 1. Rebalance Modal */}
              {activeModal === "rebalance" && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative flex flex-col max-h-[calc(100dvh-5rem)] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151b28] text-slate-800 dark:text-slate-200 shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-white/95 dark:bg-[#151b28]/95 px-4 py-3 sm:px-5 sm:py-3.5 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400">
                        <RotateCcw className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          AI Rebalancing Plan
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Optimize risk-adjusted return parameters</p>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      aria-label="Close"
                      className="rounded-xl p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 transition-all focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs custom-scrollbar">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Based on target allocations, the AI recommends the following actions to optimize risk adjusted returns.
                    </p>

                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {advisor.rebalanceSuggestions.length > 0 ? (
                        advisor.rebalanceSuggestions.map((s, idx) => (
                          <div key={idx} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5">
                            <div className="flex items-center justify-between text-xs font-extrabold uppercase">
                              <span className={s.action === "Reduce" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>{s.action} {s.asset}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Suggested Action</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">{s.reason}</p>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No rebalancing required. Asset mix looks optimal!</span>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/5 pt-3.5 grid grid-cols-2 gap-3 text-center">
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-500/20">
                        <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Risk Reduction</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">-12.4%</span>
                      </div>
                      <div className="bg-blue-50 dark:bg-cyan-500/10 p-3 rounded-xl border border-blue-200/70 dark:border-cyan-500/20">
                        <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Return Increase</span>
                        <span className="text-lg font-black text-blue-600 dark:text-cyan-400">+4.8%</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseModal}
                      className="w-full mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-3 text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Acknowledge & Close
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 2. Optimize Portfolio Modal */}
              {activeModal === "optimize" && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative flex flex-col max-h-[calc(100dvh-5rem)] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151b28] text-slate-800 dark:text-slate-200 shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-white/95 dark:bg-[#151b28]/95 px-4 py-3 sm:px-5 sm:py-3.5 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400">
                        <BrainCircuit className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 id="optimize-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          AI Portfolio Optimization
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Smart capital reallocation and alpha discovery</p>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseModal}
                      aria-label="Close portfolio optimization"
                      className="rounded-xl p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 transition-all focus:outline-none"
                    >
                      <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs custom-scrollbar">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Our model recommends reallocating capital to capture alpha opportunities and balance your sector exposures.
                    </p>

                    {advisor.bestOpportunity.symbol !== "N/A" && (
                      <div className="bg-emerald-50/80 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                            Top recommendation
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            High Conviction
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          Initiate or expand positions in <span className="underline text-emerald-700 dark:text-emerald-400">{advisor.bestOpportunity.symbol}</span> ({advisor.bestOpportunity.company})
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 font-mono leading-relaxed text-[11px] bg-white/70 dark:bg-black/20 p-2.5 rounded-lg border border-emerald-100 dark:border-white/5">
                          {advisor.bestOpportunity.reason}
                        </p>
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-emerald-200/50 dark:border-white/5">
                          <span className="text-slate-600 dark:text-slate-400 font-semibold">Expected Upside:</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">+{advisor.bestOpportunity.expectedUpside}%</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] p-3.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Suggested steps
                      </span>
                      <div className="space-y-2 text-slate-700 dark:text-slate-200">
                        <div className="flex items-start gap-2.5 text-xs">
                          <span className="text-blue-600 dark:text-cyan-400 font-black mt-0.5">•</span>
                          <span className="leading-relaxed">
                            <strong className="text-slate-900 dark:text-white">Adjust sector targets:</strong> {advisor.diversification.suggestedAllocation}
                          </span>
                        </div>
                        {advisor.rebalanceSuggestions.map((s, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs font-mono">
                            <span className="text-blue-600 dark:text-cyan-400 font-black mt-0.5">•</span>
                            <span className="leading-relaxed">
                              <span className={s.action === "Reduce" || s.action === "SELL" ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                                {s.action} {s.asset}
                              </span>{" "}
                              to decrease correlation.
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleCloseModal}
                      className="w-full mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-3 text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-[0.99]"
                    >
                      Apply Optimization Targets
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 3. Improve Risk Profile Modal */}
              {activeModal === "risk" && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative flex flex-col max-h-[calc(100dvh-5rem)] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151b28] text-slate-800 dark:text-slate-200 shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-white/95 dark:bg-[#151b28]/95 px-4 py-3 sm:px-5 sm:py-3.5 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 id="risk-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          AI Risk Mitigation
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Protect portfolio against downside exposure</p>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseModal}
                      aria-label="Close risk mitigation"
                      className="rounded-xl p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 transition-all focus:outline-none"
                    >
                      <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs custom-scrollbar">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Risk score is currently rated at{" "}
                      <span className="font-extrabold text-rose-600 dark:text-rose-400">{advisor.riskAnalysis.score}/100</span>{" "}
                      ({advisor.riskAnalysis.risk} Risk). Here are the hedging guidelines:
                    </p>

                    <div className="bg-rose-50/80 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-200 dark:border-rose-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-400 block">
                          Required Action
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">
                          Priority Alert
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {advisor.riskAnalysis.suggestedAction}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 font-mono leading-relaxed text-[11px] bg-white/70 dark:bg-black/20 p-2.5 rounded-lg border border-rose-100 dark:border-white/5">
                        {advisor.riskAnalysis.reason}
                      </p>
                    </div>

                    <div className="space-y-2.5 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] p-3.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Hedging Checklist
                      </span>
                      <div className="space-y-2 font-mono text-slate-700 dark:text-slate-200">
                        {advisor.portfolioHealth.risks.map((risk, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs">
                            <span className="text-rose-600 dark:text-rose-400 font-black mt-0.5">•</span>
                            <span className="leading-relaxed">{risk}</span>
                          </div>
                        ))}
                        <div className="flex items-start gap-2.5 text-xs">
                          <span className="text-rose-600 dark:text-rose-400 font-black mt-0.5">•</span>
                          <span className="leading-relaxed">
                            <strong className="text-slate-900 dark:text-white font-sans">Target sector allocation:</strong> {advisor.diversification.sectorExposure}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseModal}
                      className="w-full mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-3 text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-[0.99]"
                    >
                      Implement Risk Hedging
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 4. Detailed Report Modal (Printable) */}
              {activeModal === "report" && (
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  className="relative flex flex-col max-h-[calc(100dvh-5rem)] w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151b28] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sticky Header with visible Close Button & Actions */}
                  <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#151b28]/95 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur-md">
                <div>
                  <h3 id="report-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Detailed AI Portfolio Audit
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Comprehensive diagnostics and AI asset audit
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-blue-600 dark:hover:text-cyan-400 transition-all active:scale-95 shadow-2xs"
                  >
                    <Printer className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                    <span>Print PDF</span>
                  </button>

                  <button
                    onClick={handleCloseModal}
                    aria-label="Close detailed portfolio audit"
                    className="rounded-xl p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 transition-all focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Printable Body Content */}
              <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 custom-scrollbar">
                <div id="detailed-report-print-area" className="space-y-6 text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed">

                  {/* Executive Summary */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs sm:text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/10 uppercase tracking-wider">
                      I. Executive Summary
                    </h4>
                    <p className="bg-slate-50/80 dark:bg-white/[0.02] p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300">
                      This comprehensive portfolio audit evaluates asset diversification, volatility, and concentration parameters based on real-time market quotes synced via Yahoo Finance. Current portfolio health grade is determined as <span className="font-extrabold text-blue-600 dark:text-cyan-400">{advisor.healthGrade}</span> with a final score of <span className="font-extrabold text-blue-600 dark:text-cyan-400">{advisor.healthScore}/100</span>. AI confidence index stands at <span className="font-extrabold text-blue-600 dark:text-cyan-400">{advisor.diversification.confidence}%</span>.
                    </p>
                  </div>

                  {/* Portfolio Overview */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs sm:text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/10 uppercase tracking-wider">
                      II. Allocation & Diversification Audit
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-2">
                      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5">
                        <span className="block font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[9px] sm:text-[10px] tracking-wider">Sector & Regional Exposure</span>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold">{advisor.diversification.sectorExposure}</p>
                      </div>
                      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5">
                        <span className="block font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase text-[9px] sm:text-[10px] tracking-wider">Suggested AI Allocation Mix</span>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold">{advisor.diversification.suggestedAllocation}</p>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 pl-1">{advisor.diversification.reason}</p>
                  </div>

                  {/* Risk Analysis */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs sm:text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/10 uppercase tracking-wider">
                      III. Volatility & Risk Analysis
                    </h4>
                    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Risk Rating</span>
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/20">{advisor.riskAnalysis.risk} (Score: {advisor.riskAnalysis.score})</span>
                      </div>
                      <div className="flex items-center justify-between text-xs md:text-sm border-t border-slate-200/70 dark:border-white/5 pt-2.5">
                        <span className="text-slate-600 dark:text-slate-400">Mitigation Protocol</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{advisor.riskAnalysis.suggestedAction}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 border-t border-slate-200/70 dark:border-white/5 pt-2.5">{advisor.riskAnalysis.reason}</p>
                    </div>
                  </div>

                  {/* Core Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
                    <div className="space-y-2.5">
                      <h5 className="font-black text-emerald-600 dark:text-emerald-400 uppercase border-b border-slate-200 dark:border-white/10 pb-1.5 mb-2 tracking-wide text-xs">Strengths</h5>
                      <ul className="space-y-2">
                        {advisor.portfolioHealth.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 bg-emerald-50/70 dark:bg-emerald-500/[0.04] border border-emerald-200/70 dark:border-emerald-500/10 p-3 rounded-xl text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">✓</span>
                            <span className="text-slate-700 dark:text-slate-300">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2.5">
                      <h5 className="font-black text-rose-600 dark:text-rose-400 uppercase border-b border-slate-200 dark:border-white/10 pb-1.5 mb-2 tracking-wide text-xs">Weaknesses & Drawdowns</h5>
                      <ul className="space-y-2">
                        {advisor.portfolioHealth.weaknesses.map((w, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 bg-rose-50/70 dark:bg-rose-500/[0.04] border border-rose-200/70 dark:border-rose-500/10 p-3 rounded-xl text-xs">
                            <span className="text-rose-600 dark:text-rose-400 font-extrabold">⚠</span>
                            <span className="text-slate-700 dark:text-slate-300">{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Rebalancing Strategy */}
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs sm:text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/10 uppercase tracking-wider">
                      IV. Rebalancing & Asset Rotation Plan
                    </h4>
                    <div className="space-y-2.5">
                      {advisor.rebalanceSuggestions.map((s, idx) => (
                        <div key={idx} className={`p-3.5 rounded-xl border flex items-center gap-3.5 transition-all ${s.action === "Reduce" || s.action === "Trim"
                          ? "bg-rose-50/50 dark:bg-rose-500/[0.02] border-rose-200 dark:border-rose-500/15"
                          : "bg-emerald-50/50 dark:bg-emerald-500/[0.02] border-emerald-200 dark:border-emerald-500/15"
                          }`}>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${s.action === "Reduce" || s.action === "Trim"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            }`}>{s.action}</span>
                          <div className="text-xs">
                            <strong className="font-mono text-slate-950 dark:text-white mr-2 text-sm">{s.asset}</strong>
                            <span className="text-slate-600 dark:text-slate-400">{s.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best Market Opportunity */}
                  {advisor.bestOpportunity.symbol !== "N/A" && (
                    <div className="space-y-2.5 pt-2">
                      <h4 className="text-xs sm:text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/10 uppercase tracking-wider">
                        V. Recommended Opportunity & Capital Deployment
                      </h4>
                      <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-gradient-to-r dark:from-blue-500/[0.03] dark:to-cyan-500/[0.03] border border-blue-200/80 dark:border-cyan-500/10 space-y-3">
                        <p className="text-slate-700 dark:text-slate-300">
                          The AI opportunity screener identified <strong className="text-slate-950 dark:text-white">{advisor.bestOpportunity.symbol}</strong> ({advisor.bestOpportunity.company}) as the highest-conviction target matching your risk tolerance profile.
                        </p>
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-200/80 dark:border-white/5 pt-3">
                          <div>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider mb-0.5">Target Upside</span>
                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">+{advisor.bestOpportunity.expectedUpside}%</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider mb-0.5">Target Valuation</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">{formatOpportunityPrice(advisor.bestOpportunity.targetPrice)} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal font-mono">(vs {formatOpportunityPrice(advisor.bestOpportunity.currentPrice)})</span></span>
                          </div>
                        </div>
                        <p className="border-t border-slate-200/80 dark:border-white/5 pt-3 text-slate-600 dark:text-slate-400"><strong>Rationale:</strong> {advisor.bestOpportunity.reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Long-term Strategy */}
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs sm:text-sm font-extrabold pb-2 mb-3 text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/10 uppercase tracking-wider">
                      VI. Strategic Long-term Outlook
                    </h4>
                    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-white/[0.015] border border-slate-200/80 dark:border-white/5 space-y-3">
                      <p className="text-slate-700 dark:text-slate-300"><strong>Outlook Posture:</strong> <span className="font-extrabold text-blue-600 dark:text-cyan-400 uppercase">{advisor.portfolioHealth.outlook}</span></p>
                      <ul className="space-y-2 border-t border-slate-200/80 dark:border-white/5 pt-3">
                        {advisor.portfolioHealth.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                            <span className="text-slate-700 dark:text-slate-300">{rec}</span>
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
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  )}
    </section>
  );
}

export default memo(AIPortfolioAdvisorSection);