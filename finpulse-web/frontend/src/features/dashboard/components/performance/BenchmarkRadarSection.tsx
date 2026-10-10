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
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 450);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 450);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [benchmarksData, setBenchmarksData] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
    const userId = storedUser.id;
    const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
    const headers: any = {};
    if (userId) headers['X-User-Id'] = userId;
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
    let bestMetric: any = null;
    let weakestMetric: any = null;
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

  const bestMetricTone = comparisonDetails?.bestMetric
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-slate-400 dark:text-slate-500";

  const weakestMetricTone = comparisonDetails?.weakestMetric
    ? "text-amber-600 dark:text-amber-450"
    : "text-slate-400 dark:text-slate-500";

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
    const fileExt = isExcel ? "xls" : "csv";
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

    const blob = new Blob([csvContent], { type: isExcel ? "application/vnd.ms-excel" : "text/csv;charset=utf-8;" });
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
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-[#263247] dark:bg-[#0d1424]">
      
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between md:gap-6 dark:border-[#263247]">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-slate-900 dark:text-white sm:text-base">
            <Award size={17} className="text-cyan-600 dark:text-cyan-400" />
            Benchmark Radar
          </h3>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Compare portfolio efficiency metrics against major market benchmarks using normalized spider visualizations.
          </p>
        </div>

        {/* Dynamic Dropdown Select */}
        <div className="flex items-center gap-3">
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sm:inline">Benchmark</span>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex w-44 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-800 shadow-sm transition-colors hover:bg-slate-100 dark:border-[#263247] dark:bg-[#080d17] dark:text-white dark:hover:bg-[#111a2b]"
            >
              <span>{selectedBenchmark}</span>
              <ChevronDown size={14} className="text-slate-500 dark:text-slate-400 transition-transform" />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-[#263247] dark:bg-[#090e1a]"
                >
                  {BENCHMARK_NAMES.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleBenchmarkChange(name)}
                      className={`block w-full px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.06em] transition-colors hover:bg-slate-50 dark:hover:bg-[#111a2b] ${
                        selectedBenchmark === name ? "text-blue-500 dark:text-cyan-400 bg-slate-100 dark:bg-slate-800/50" : "text-slate-700 dark:text-slate-300"
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 animate-pulse">
          <div className="h-[400px] bg-slate-50/50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center">
            <span className="text-xs text-slate-500 font-extrabold uppercase">Loading radar datasets...</span>
          </div>
          <div className="space-y-4">
            <div className="h-28 bg-slate-50/50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-800 rounded-2xl" />
            <div className="h-44 bg-slate-50/50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-800 rounded-2xl" />
            <div className="h-44 bg-slate-50/50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-800 rounded-2xl" />
          </div>
        </div>
      ) : !benchmarkData ? (
        // Empty State
        <div className="bg-slate-50/50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <AlertTriangle className="text-amber-500 mx-auto mb-3" size={32} />
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">Benchmark Metrics Unavailable</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Unable to fetch relative index data. Please select another benchmark target or reload the panel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
          
          {/* LEFT: RADAR CHART CONTAINER */}
          <div className="flex min-h-[470px] flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#263247] dark:bg-[#080e19] sm:p-5">
            <div className="mb-2 flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#263247]">
              <div>
                <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Relative Alignment</span>
                <span className="mt-1 block text-[10px] font-medium text-slate-400 dark:text-slate-500">Normalized 0-100 efficiency scale</span>
              </div>
              
              {/* Interactive Legend with toggle options */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowPortfolio(!showPortfolio)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                    showPortfolio
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                      : "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${showPortfolio ? "bg-blue-500" : "bg-slate-500"}`} />
                  Portfolio
                </button>
                <button
                  onClick={() => setShowBenchmark(!showBenchmark)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                    showBenchmark
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                      : "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${showBenchmark ? "bg-indigo-500" : "bg-slate-500"}`} />
                  {selectedBenchmark}
                </button>
              </div>
            </div>

            {/* Recharts Radar Chart */}
            <div id="radar-chart-container" className="h-[430px] w-full flex items-center justify-center sm:h-[460px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "60%" : "78%"} data={chartData}>
                  <PolarGrid stroke={theme === "dark" ? "#263247" : "#cbd5e1"} strokeOpacity={0.9} radialLines={true} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: theme === "dark" ? "#b5c0d1" : "#475569", fontSize: isMobile ? 8 : 10, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: theme === "dark" ? "#64748b" : "#94a3b8", fontSize: 8 }}
                    axisLine={false}
                  />
                  
                  {showPortfolio && (
                    <Radar
                      name="Portfolio"
                      dataKey="Portfolio"
                      stroke="#818cf8"
                      fill="#818cf8"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  )}

                  {showBenchmark && (
                    <Radar
                      name={selectedBenchmark}
                      dataKey="Benchmark"
                      stroke="#38bdf8"
                      fill="#38bdf8"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  )}

                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-xl dark:border-[#263247] dark:bg-[#080d17]">
                            <span className="block border-b border-slate-200 pb-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 dark:border-[#263247] dark:text-slate-400">
                              {data.subject}
                            </span>
                            {showPortfolio && (
                              <div className="flex items-center justify-between gap-5 text-xs">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">Portfolio</span>
                                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{data.portfolioDisplay}</span>
                              </div>
                            )}
                            {showBenchmark && (
                              <div className="flex items-center justify-between gap-5 text-xs">
                                <span className="font-bold text-sky-600 dark:text-sky-400">{selectedBenchmark}</span>
                                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{data.benchmarkDisplay}</span>
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
            
            <div className="mt-2 flex items-start gap-1.5 text-[10px] font-medium leading-relaxed text-slate-500">
              <Info size={12} className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span>Chart values are normalized to a standard 0-100 scale for comparison. Tooltips reflect raw actual figures.</span>
            </div>
          </div>

          {/* RIGHT: COMPARISON STATS & SCORECARD */}
          <div className="flex flex-col gap-4">
            
            {/* Benchmark Verdict Scorecard */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm dark:border-[#263247] dark:bg-[#080e19]">
              <div className="flex items-start justify-between gap-4">
                <div className="text-left">
                <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Benchmark Verdict</span>
                <span className="mt-1 block text-lg font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                  {benchmarkData.rating}
                </span>
                <span className="mt-0.5 block text-[10px] font-medium text-slate-500 dark:text-slate-400">vs {selectedBenchmark}</span>
                </div>
                <div className="text-right">
                <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Comparison Score</span>
                <span className="mt-1 block font-mono text-xl font-black text-cyan-600 dark:text-cyan-400">
                  {benchmarkData.overallScore}
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-normal">/100</span>
                </span>
                </div>
              </div>
            </div>

            {/* Metrics outperformed/underperformed stats */}
            {comparisonDetails && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#263247] dark:bg-[#080e19]">
                <span className="block border-b border-slate-200 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:border-[#263247] dark:text-slate-400">Comparison Ledger</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-2 py-2.5 text-center">
                    <span className="block text-[9px] font-black uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-400">Outperformed</span>
                    <span className="mt-1 block font-mono text-xl font-black text-slate-900 dark:text-white">{comparisonDetails.outperformed.length}</span>
                    <span className="mt-0.5 block text-[8px] font-bold uppercase text-slate-400">Metrics</span>
                  </div>

                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.04] px-2 py-2.5 text-center">
                    <span className="block text-[9px] font-black uppercase tracking-[0.08em] text-rose-600 dark:text-rose-400">Underperformed</span>
                    <span className="mt-1 block font-mono text-xl font-black text-slate-900 dark:text-white">{comparisonDetails.underperformed.length}</span>
                    <span className="mt-0.5 block text-[8px] font-bold uppercase text-slate-400">Metrics</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  {/* Pills styled matching theme-aware style with rounded border */}
                  <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-[#263247] dark:bg-[#0c1422] sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Best Lead Margin</span>
                    {comparisonDetails.bestMetric ? (
                      <span className={`font-extrabold uppercase text-[10px] font-mono sm:text-right ${bestMetricTone}`}>
                        {comparisonDetails.bestMetric.name} ({comparisonDetails.bestMetric.portfolioDisplay})
                      </span>
                    ) : (
                      <span className="font-extrabold uppercase text-[10px] text-slate-400 dark:text-slate-500 font-mono sm:text-right">
                        N/A
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-[#263247] dark:bg-[#0c1422] sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Narrowest Gap</span>
                    {comparisonDetails.weakestMetric ? (
                      <span className={`font-extrabold uppercase text-[10px] font-mono sm:text-right ${weakestMetricTone}`}>
                        {comparisonDetails.weakestMetric.name} ({comparisonDetails.weakestMetric.portfolioDisplay})
                      </span>
                    ) : (
                      <span className="font-extrabold uppercase text-[10px] text-slate-400 dark:text-slate-500 font-mono sm:text-right">
                        N/A
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Export Engine Panel */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#263247] dark:bg-[#080e19]">
              <span className="mb-3 block border-b border-slate-200 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:border-[#263247] dark:text-slate-400">Export Comparison Report</span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={exportPNG}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-[#263247] dark:bg-[#0c1422] dark:text-slate-200 dark:hover:bg-[#111a2b]"
                >
                  <ImageIcon size={12} className="text-blue-500" />
                  PNG Chart
                </button>
                <button
                  onClick={exportPDF}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-[#263247] dark:bg-[#0c1422] dark:text-slate-200 dark:hover:bg-[#111a2b]"
                >
                  <FileText size={12} className="text-indigo-500" />
                  PDF Report
                </button>
                <button
                  onClick={() => exportCSV(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-[#263247] dark:bg-[#0c1422] dark:text-slate-200 dark:hover:bg-[#111a2b]"
                >
                  <FileSpreadsheet size={12} className="text-emerald-500" />
                  CSV Data
                </button>
                <button
                  onClick={() => exportCSV(true)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-[#263247] dark:bg-[#0c1422] dark:text-slate-200 dark:hover:bg-[#111a2b]"
                >
                  <FileSpreadsheet size={12} className="text-emerald-500" />
                  Excel Data
                </button>
              </div>
            </div>

          </div>
        </div>
      )}      {/* 2. AI BENCHMARK INSIGHTS SECTION */}
      {benchmarkData && !loading && (
        <div className="grid grid-cols-1 gap-3 border-t border-slate-200 px-4 pb-4 pt-4 sm:px-5 md:grid-cols-3 dark:border-[#263247]">
          
          {/* Strengths */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#263247] dark:bg-[#080e19]">
            <div>
              <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2.5 text-emerald-600 dark:border-[#263247] dark:text-emerald-400">
                <CheckCircle size={14} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em]">Outperformance Strengths</span>
              </div>
              <ul className="space-y-2.5">
                {benchmarkData.aiInsights.strengths.map((str: any, idx: any) => (
                  <li key={idx} className="border-l-2 border-emerald-500/30 pl-2.5 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                    {str}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Strength Highlight</div>
          </div>

          {/* Weaknesses */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#263247] dark:bg-[#080e19]">
            <div>
              <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2.5 text-rose-600 dark:border-[#263247] dark:text-rose-400">
                <AlertTriangle size={14} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em]">Comparative Weaknesses</span>
              </div>
              <ul className="space-y-2.5">
                {benchmarkData.aiInsights.weaknesses.map((weak: any, idx: any) => (
                  <li key={idx} className="border-l-2 border-rose-500/30 pl-2.5 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                    {weak}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Risk Variance Warning</div>
          </div>

          {/* Recommendations */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#263247] dark:bg-[#080e19]">
            <div>
              <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2.5 text-cyan-600 dark:border-[#263247] dark:text-cyan-400">
                <Award size={14} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em]">Outperform Directives</span>
              </div>
              <ul className="space-y-2.5">
                {benchmarkData.aiInsights.recommendations.map((rec: any, idx: any) => (
                  <li key={idx} className="border-l-2 border-cyan-500/30 pl-2.5 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">AI Optimizer Plan</div>
          </div>

        </div>
      )}
    </section>
  );
}
