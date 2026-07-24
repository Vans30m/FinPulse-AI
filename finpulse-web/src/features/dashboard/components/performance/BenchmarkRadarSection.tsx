import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "../../../../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";
import API_BASE_URL from "../../../../config/api";
import {
  Award,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  ChevronDown
} from "lucide-react";
const BENCHMARK_NAMES = ["NIFTY 50", "S&P 500", "NASDAQ", "Gold", "Bitcoin"];

export default function BenchmarkRadarSection() {
  const { theme } = useTheme();
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>("S&P 500");
  const [loading, setLoading] = useState<boolean>(true);
  const [showPortfolio, setShowPortfolio] = useState<boolean>(true);
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [benchmarksData, setBenchmarksData] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
    const userId = storedUser.id;
    const headers = userId ? { 'X-User-Id': userId } : undefined;

    fetch(`${API_BASE_URL}/api/portfolio/benchmarks`, { headers })
      .then(res => res.json())
      .then(data => {
        setBenchmarksData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const benchmarkData = useMemo(() => {
    return benchmarksData ? benchmarksData[selectedBenchmark] : null;
  }, [benchmarksData, selectedBenchmark]);

  // Simulate loading skeleton on change
  const handleBenchmarkChange = (name: string) => {
    setLoading(true);
    setSelectedBenchmark(name);
    setDropdownOpen(false);
    setTimeout(() => {
      setLoading(false);
    }, 400);
  };

  // 1. Comparison Score Card details
  const comparisonDetails = useMemo(() => {
    if (!benchmarkData) return null;
    
    const outperformed: string[] = [];
    const underperformed: string[] = [];
    let bestMetric = benchmarkData.metrics[0];
    let weakestMetric = benchmarkData.metrics[0];
    let maxOutperformValue = -Infinity;
    let minUnderperformValue = Infinity;

    benchmarkData.metrics.forEach((m: any) => {
      const isOutperformed = m.higherIsBetter
        ? m.portfolioValue > m.benchmarkValue
        : m.portfolioValue < m.benchmarkValue;

      if (isOutperformed) {
        outperformed.push(m.name);
        
        // Calculate outperformance margin (percentage change basis)
        const diff = Math.abs(m.portfolioValue - m.benchmarkValue);
        if (diff > maxOutperformValue) {
          maxOutperformValue = diff;
          bestMetric = m;
        }
      } else {
        underperformed.push(m.name);
        const diff = Math.abs(m.portfolioValue - m.benchmarkValue);
        if (diff < minUnderperformValue) {
          minUnderperformValue = diff;
          weakestMetric = m;
        }
      }
    });

    return {
      outperformed,
      underperformed,
      bestMetric,
      weakestMetric,
    };
  }, [benchmarkData]);

  // Radar chart data mapper
  const chartData = useMemo(() => {
    if (!benchmarkData) return [];
    return benchmarkData.metrics.map((m: any) => ({
      subject: m.name,
      Portfolio: m.portfolioNormalized,
      Benchmark: m.benchmarkNormalized,
      // Pass actual values for custom tooltip rendering
      portfolioDisplay: m.portfolioDisplay,
      benchmarkDisplay: m.benchmarkDisplay,
    }));
  }, [benchmarkData]);

  // EXPORTS
  const exportCSV = (isExcel: boolean = false) => {
    if (!benchmarkData) return;
    const fileExt = isExcel ? "csv" : "csv";
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += `FinPulse Benchmark Radar Report - Comparing with ${selectedBenchmark}\n`;
    csvContent += `Export Date,${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    csvContent += `Overall Score,${benchmarkData.overallScore}/100\n`;
    csvContent += `Rating,${benchmarkData.rating}\n\n`;

    csvContent += "Metric,Portfolio Value,Benchmark Value,Outperformance\n";
    benchmarkData.metrics.forEach((m: any) => {
      const p = m.portfolioValue;
      const b = m.benchmarkValue;
      const out = m.higherIsBetter ? p > b : p < b;
      csvContent += `"${m.name}","${m.portfolioDisplay}","${m.benchmarkDisplay}","${out ? "Portfolio Outperformed" : "Benchmark Outperformed"}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `benchmark_radar_comparison_${selectedBenchmark.toLowerCase().replace(" ", "_")}.${fileExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPNG = () => {
    const container = document.getElementById("radar-chart-container");
    if (!container) return;
    const svgEl = container.querySelector("svg");
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgEl);

    if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgEl.clientWidth || 500;
      canvas.height = svgEl.clientHeight || 500;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw deep slate background matching FinPulse dashboard
        ctx.fillStyle = "#0d1527";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `benchmark_radar_chart_${selectedBenchmark.toLowerCase().replace(" ", "_")}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const exportPDF = () => {
    if (!benchmarkData || !comparisonDetails) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const metricsRows = benchmarkData.metrics
      .map((m: any) => {
        const isOut = m.higherIsBetter ? m.portfolioValue > m.benchmarkValue : m.portfolioValue < m.benchmarkValue;
        return `
          <tr>
            <td>${m.name}</td>
            <td align="right" style="font-weight: bold;">${m.portfolioDisplay}</td>
            <td align="right">${m.benchmarkDisplay}</td>
            <td align="center" style="color: ${isOut ? "#10b981" : "#ef4444"}; font-weight: bold;">
              ${isOut ? "OUTPERFORM" : "UNDERPERFORM"}
            </td>
          </tr>
        `;
      })
      .join("");

    const strengthItems = benchmarkData.aiInsights.strengths.map((s: any) => `<li>${s}</li>`).join("");
    const weaknessItems = benchmarkData.aiInsights.weaknesses.map((w: any) => `<li>${w}</li>`).join("");
    const recItems = benchmarkData.aiInsights.recommendations.map((r: any) => `<li>${r}</li>`).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Benchmark Radar Comparison Report: Portfolio vs ${selectedBenchmark}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; margin: 40px; }
            h1 { font-size: 24px; color: #0f172a; margin-bottom: 5px; }
            .subtitle { font-size: 12px; color: #64748b; margin-bottom: 25px; }
            .scorecard { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 25px; }
            .scorecard-header { display: flex; justify-content: space-between; align-items: center; }
            .rating { font-size: 20px; font-weight: 800; color: #10b981; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: left; }
            th { background-color: #f1f5f9; color: #475569; font-weight: 700; }
            .section-title { font-size: 16px; font-weight: 700; margin-top: 25px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
            ul { margin-top: 5px; padding-left: 20px; font-size: 13px; line-height: 1.6; }
            .footer { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 50px; }
          </style>
        </head>
        <body>
          <h1>FinPulse Benchmark Radar Report</h1>
          <div class="subtitle">Comparative Diagnostic Report | Generated on ${new Date().toLocaleDateString()}</div>
          
          <div class="scorecard">
            <div class="scorecard-header">
              <div>
                <strong>Benchmark Target:</strong> ${selectedBenchmark}<br/>
                <strong>Overall Rating:</strong> <span class="rating">${benchmarkData.rating}</span>
              </div>
              <div style="text-align: right;">
                <strong>Comparison Score:</strong> <span style="font-size: 20px; font-weight: 800;">${benchmarkData.overallScore}/100</span>
              </div>
            </div>
          </div>

          <table style="width: 100%">
            <thead>
              <tr>
                <th>Performance Metric</th>
                <th align="right">Portfolio</th>
                <th align="right">${selectedBenchmark}</th>
                <th align="center">Verdict</th>
              </tr>
            </thead>
            <tbody>
              ${metricsRows}
            </tbody>
          </table>

          <div class="section-title">AI Benchmark Insights</div>
          
          <strong style="color: #10b981; font-size: 13px; display: block; margin-top: 10px;">Strengths:</strong>
          <ul>${strengthItems}</ul>
          
          <strong style="color: #ef4444; font-size: 13px; display: block; margin-top: 10px;">Weaknesses:</strong>
          <ul>${weaknessItems}</ul>
          
          <strong style="color: #3b82f6; font-size: 13px; display: block; margin-top: 10px;">Recommendations to Outperform:</strong>
          <ul>${recItems}</ul>

          <div class="footer">
            FinPulse AI Analytics Engine • Strictly Confidential • This is an automated assessment report
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getScoreColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
      case "Good":
        return "text-cyan-400 border-cyan-500/20 bg-cyan-500/5";
      case "Average":
        return "text-amber-400 border-amber-500/20 bg-amber-500/5";
      default:
        return "text-rose-400 border-rose-500/20 bg-rose-500/5";
    }
  };

  return (
    <section className="bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-md relative overflow-hidden mt-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-slate-200 dark:border-slate-900 pb-5">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-800 dark:text-white tracking-tight uppercase flex items-center gap-2">
            <Award size={18} className="text-blue-400" />
            Benchmark Radar
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Compare portfolio efficiency metrics against major market benchmarks using normalized spider visualizations.
          </p>
        </div>

        {/* Dynamic Dropdown Select */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">Select Benchmark:</span>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-50 dark:bg-[#050711] border border-slate-200 dark:border-slate-900 rounded-xl text-xs font-extrabold uppercase text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors w-40"
            >
              <span>{selectedBenchmark}</span>
              <ChevronDown size={14} className={`text-slate-500 dark:text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-40 bg-slate-50 dark:bg-[#050711] border border-slate-200 dark:border-slate-900 rounded-xl overflow-hidden shadow-2xl z-50"
                >
                  {BENCHMARK_NAMES.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleBenchmarkChange(name)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-extrabold uppercase transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 block ${
                        selectedBenchmark === name ? "text-blue-400 bg-slate-200 dark:bg-slate-900/50" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {loading ? (
        // Loading Skeleton
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 animate-pulse">
          <div className="h-[400px] bg-slate-50/50 dark:bg-slate-50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-900 rounded-2xl flex items-center justify-center">
            <span className="text-xs text-slate-500 font-extrabold uppercase">Loading radar datasets...</span>
          </div>
          <div className="space-y-4">
            <div className="h-28 bg-slate-50/50 dark:bg-slate-50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-900 rounded-2xl" />
            <div className="h-44 bg-slate-50/50 dark:bg-slate-50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-900 rounded-2xl" />
            <div className="h-44 bg-slate-50/50 dark:bg-slate-50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-900 rounded-2xl" />
          </div>
        </div>
      ) : !benchmarkData ? (
        // Empty State
        <div className="bg-slate-50/50 dark:bg-slate-50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-12 text-center">
          <AlertTriangle className="text-amber-500 mx-auto mb-3" size={32} />
          <h4 className="text-sm font-black text-slate-900 dark:text-slate-800 dark:text-white uppercase">Benchmark Metrics Unavailable</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Unable to fetch relative index data. Please select another benchmark target or reload the panel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          
          {/* LEFT: RADAR CHART CONTAINER */}
          <div className="bg-slate-50/50 dark:bg-slate-50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Relative Alignment Spider</span>
              
              {/* Interactive Legend with toggle options */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPortfolio(!showPortfolio)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase transition-all ${
                    showPortfolio
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                      : "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-900 text-slate-500"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${showPortfolio ? "bg-blue-400" : "bg-slate-500"}`} />
                  Portfolio
                </button>
                <button
                  onClick={() => setShowBenchmark(!showBenchmark)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase transition-all ${
                    showBenchmark
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      : "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-900 text-slate-500"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${showBenchmark ? "bg-indigo-400" : "bg-slate-500"}`} />
                  {selectedBenchmark}
                </button>
              </div>
            </div>

            {/* Recharts Radar Chart */}
            <div id="radar-chart-container" className="h-[360px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                  <PolarGrid stroke={theme === "dark" ? "#0f172a" : "#cbd5e1"} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#475569", fontSize: 8 }}
                    axisLine={false}
                  />
                  
                  {showPortfolio && (
                    <Radar
                      name="Portfolio"
                      dataKey="Portfolio"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  )}

                  {showBenchmark && (
                    <Radar
                      name={selectedBenchmark}
                      dataKey="Benchmark"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  )}

                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-50 dark:bg-[#050711] border border-slate-200 dark:border-slate-900 rounded-xl p-3 shadow-2xl space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block border-b border-slate-200 dark:border-slate-200 dark:border-slate-900 pb-1">
                              {data.subject}
                            </span>
                            {showPortfolio && (
                              <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="text-blue-400 font-medium">Portfolio:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-800 dark:text-white">{data.portfolioDisplay}</span>
                              </div>
                            )}
                            {showBenchmark && (
                              <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="text-indigo-400 font-medium">{selectedBenchmark}:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-800 dark:text-white">{data.benchmarkDisplay}</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium italic mt-2">
              <Info size={11} className="text-blue-500 shrink-0" />
              <span>Chart values are normalized to a standard 0-100 scale for comparison. Tooltips reflect raw actual figures.</span>
            </div>
          </div>

          {/* RIGHT: COMPARISON STATS & SCORECARD */}
          <div className="space-y-4 flex flex-col justify-between">
            
            {/* Benchmark Scorecard */}
            <div className={`border rounded-2xl p-4 flex items-center justify-between transition-all ${getScoreColor(benchmarkData.rating)}`}>
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider block">Benchmark Verdict</span>
                <span className="text-base font-black uppercase mt-1 block">{benchmarkData.rating}</span>
                <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium mt-0.5 block">vs {selectedBenchmark}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider block">Comparison Score</span>
                <span className="text-2xl font-black font-mono block mt-1">{benchmarkData.overallScore}<span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/100</span></span>
              </div>
            </div>

            {/* Metrics outperformed/underperformed stats */}
            {comparisonDetails && (
              <div className="bg-slate-50/50 dark:bg-slate-50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block border-b border-slate-200 dark:border-slate-200 dark:border-slate-900 pb-2">Comparison Ledger</span>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 dark:bg-[#121a2a]/20 border border-slate-200 dark:border-slate-200 dark:border-slate-900/60 rounded-xl p-2.5">
                    <span className="text-[9px] font-black uppercase text-emerald-400 block">Outperformed</span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-800 dark:text-white font-mono mt-1 block">{comparisonDetails.outperformed.length}</span>
                    <span className="text-[8px] text-slate-500 font-medium uppercase mt-0.5 block">Metrics</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#121a2a]/20 border border-slate-200 dark:border-slate-200 dark:border-slate-900/60 rounded-xl p-2.5">
                    <span className="text-[9px] font-black uppercase text-rose-400 block">Underperformed</span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-800 dark:text-white font-mono mt-1 block">{comparisonDetails.underperformed.length}</span>
                    <span className="text-[8px] text-slate-500 font-medium uppercase mt-0.5 block">Metrics</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1.5 text-[11px]">
                  <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-200 dark:border-slate-900/40">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Best Lead Margin:</span>
                    <span className="font-bold text-emerald-400 uppercase font-mono">{comparisonDetails.bestMetric.name} ({comparisonDetails.bestMetric.portfolioDisplay})</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-200 dark:border-slate-900/40">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Narrowest Gap:</span>
                    <span className="font-bold text-amber-400 uppercase font-mono">{comparisonDetails.weakestMetric.name} ({comparisonDetails.weakestMetric.portfolioDisplay})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Export Engine Panel */}
            <div className="bg-slate-50/50 dark:bg-slate-50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block border-b border-slate-200 dark:border-slate-200 dark:border-slate-900 pb-2 mb-3">Export Comparison Report</span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={exportPNG}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#121a2a]/60 dark:hover:bg-[#121a2a] border border-slate-200 dark:border-slate-200 dark:border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-750 dark:text-slate-200 transition-colors"
                >
                  <ImageIcon size={12} className="text-blue-400" />
                  PNG Chart
                </button>
                <button
                  onClick={exportPDF}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#121a2a]/60 dark:hover:bg-[#121a2a] border border-slate-200 dark:border-slate-200 dark:border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-750 dark:text-slate-200 transition-colors"
                >
                  <FileText size={12} className="text-indigo-400" />
                  PDF Report
                </button>
                <button
                  onClick={() => exportCSV(false)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#121a2a]/60 dark:hover:bg-[#121a2a] border border-slate-200 dark:border-slate-200 dark:border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-750 dark:text-slate-200 transition-colors"
                >
                  <FileSpreadsheet size={12} className="text-emerald-400" />
                  CSV Data
                </button>
                <button
                  onClick={() => exportCSV(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#121a2a]/60 dark:hover:bg-[#121a2a] border border-slate-200 dark:border-slate-200 dark:border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-750 dark:text-slate-200 transition-colors"
                >
                  <FileSpreadsheet size={12} className="text-emerald-400" />
                  Excel Data
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. AI BENCHMARK INSIGHTS SECTION */}
      {benchmarkData && !loading && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-900 pt-5">
          
          {/* Strengths */}
          <div className="bg-slate-50 dark:bg-[#050711]/40 border border-slate-200 dark:border-slate-900/60 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 mb-2 border-b border-slate-200 dark:border-slate-200 dark:border-slate-900/40 pb-2">
                <CheckCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Outperformance Strengths</span>
              </div>
              <ul className="space-y-2">
                {benchmarkData.aiInsights.strengths.map((str: any, idx: any) => (
                  <li key={idx} className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed font-medium">
                    {str}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-[9px] text-slate-500 font-extrabold uppercase mt-4">Solvency Vector Gain</div>
          </div>

          {/* Weaknesses */}
          <div className="bg-slate-50 dark:bg-[#050711]/40 border border-slate-200 dark:border-slate-900/60 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-rose-400 mb-2 border-b border-slate-200 dark:border-slate-200 dark:border-slate-900/40 pb-2">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Comparative Weaknesses</span>
              </div>
              <ul className="space-y-2">
                {benchmarkData.aiInsights.weaknesses.map((weak: any, idx: any) => (
                  <li key={idx} className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed font-medium">
                    {weak}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-[9px] text-slate-500 font-extrabold uppercase mt-4">Risk Variance Warning</div>
          </div>

          {/* Recommendations */}
          <div className="bg-slate-50 dark:bg-[#050711]/40 border border-slate-200 dark:border-slate-900/60 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-xl pointer-events-none rounded-full" />
            <div>
              <div className="flex items-center gap-1.5 text-blue-400 mb-2 border-b border-slate-200 dark:border-slate-200 dark:border-slate-900/40 pb-2">
                <Sparkles size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Outperform Directives</span>
              </div>
              <ul className="space-y-2">
                {benchmarkData.aiInsights.recommendations.map((rec: any, idx: any) => (
                  <li key={idx} className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed font-medium">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-[9px] text-slate-500 font-extrabold uppercase mt-4">AI Optimizer Plan</div>
          </div>

        </div>
      )}
    </section>
  );
}
