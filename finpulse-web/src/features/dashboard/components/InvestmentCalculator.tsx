import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, IndianRupee } from 'lucide-react';

export default function InvestmentCalculator() {
  const [isSip] = useState(false);

  // Use string states to allow natural typing, clearing, and backspacing
  const [amountStr, setAmountStr] = useState('25000');
  const [rateStr, setRateStr] = useState('12');
  const [yearsStr, setYearsStr] = useState('10');

  // Convert string values to numbers for calculation
  const amount = useMemo(() => parseFloat(amountStr) || 0, [amountStr]);
  const rate = useMemo(() => parseFloat(rateStr) || 0, [rateStr]);
  const years = useMemo(() => parseFloat(yearsStr) || 0, [yearsStr]);

  // Calculate Returns based on SIP or Lumpsum formulas
  const results = useMemo(() => {
    let totalInvested = 0;
    let totalValue = 0;

    if (isSip) {
      // SIP Calculation: P × ({[1 + i]n - 1} / i) × (1 + i)
      const monthlyRate = rate / 12 / 100;
      const months = years * 12;
      totalInvested = amount * months;
      if (monthlyRate === 0) {
        totalValue = totalInvested;
      } else {
        totalValue =
          amount *
          ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
          (1 + monthlyRate);
      }
    } else {
      // Lumpsum Calculation: P(1 + r/100)^t
      totalInvested = amount;
      totalValue = amount * Math.pow(1 + rate / 100, years);
    }

    const estimatedReturns = Math.max(totalValue - totalInvested, 0);
    const total = Math.max(totalValue, totalInvested);

    const investedPercentage = total > 0 ? (totalInvested / total) * 100 : 100;
    const returnsPercentage = total > 0 ? (estimatedReturns / total) * 100 : 0;

    // SVG Doughnut constants
    const radius = 60;
    const circumference = 2 * Math.PI * radius; // ~377
    const returnsStrokeOffset = circumference - (returnsPercentage / 100) * circumference;

    return {
      totalInvested: Math.round(totalInvested),
      estimatedReturns: Math.round(estimatedReturns),
      totalValue: Math.round(total),
      investedPercentage,
      returnsPercentage,
      circumference,
      returnsStrokeOffset
    };
  }, [isSip, amount, rate, years]);

  // Format currency for Indian Rupees
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // UI change handlers
  const handleAmountStrChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setAmountStr(clean);
  };

  const handleRateStrChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setRateStr(clean);
  };

  const handleYearsStrChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setYearsStr(clean);
  };

  return (
    <div className="glass-panel p-6 sm:p-8 overflow-hidden relative group h-full flex flex-col justify-between">
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.01] via-transparent to-cyan-500/[0.02] pointer-events-none" />
      {/* Header Row */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calculator className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-blue-600 dark:text-cyan-400" />
            Lumpsum Wealth Calculator
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Project your wealth growth compounding with mutual funds.
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="relative grid gap-4 sm:gap-6 lg:grid-cols-12 flex-1 items-center">
        {/* Left Side: Controls & Sliders */}
        <div className="space-y-4 lg:col-span-7 flex flex-col justify-center h-full">
          {/* Amount Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isSip ? 'Monthly Investment' : 'Total Investment'}
              </label>
              <div className="relative flex items-center max-w-[150px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1 focus-within:border-blue-500 dark:focus-within:border-cyan-400 transition-colors">
                <span className="text-xs text-slate-400 font-extrabold mr-1">₹</span>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => handleAmountStrChange(e.target.value)}
                  className="w-full bg-transparent text-right font-black text-sm text-blue-600 dark:text-cyan-400 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <input
              type="range"
              min={isSip ? 500 : 5000}
              max={isSip ? 1000000 : 10000000}
              step={isSip ? 500 : 5000}
              value={amount}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-cyan-400"
            />
          </div>

          {/* Return Rate Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expected Return Rate (p.a)</label>
              <div className="flex items-center max-w-[100px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1 focus-within:border-blue-500 dark:focus-within:border-cyan-400 transition-colors">
                <input
                  type="text"
                  value={rateStr}
                  onChange={(e) => handleRateStrChange(e.target.value)}
                  className="w-full bg-transparent text-right font-black text-sm text-blue-600 dark:text-cyan-400 outline-none"
                />
                <span className="text-xs text-slate-400 font-extrabold ml-1">%</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.1"
              value={rate}
              onChange={(e) => setRateStr(e.target.value)}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-cyan-400"
            />
          </div>

          {/* Time Period Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time Period</label>
              <div className="flex items-center max-w-[100px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1 focus-within:border-blue-500 dark:focus-within:border-cyan-400 transition-colors">
                <input
                  type="text"
                  value={yearsStr}
                  onChange={(e) => handleYearsStrChange(e.target.value)}
                  className="w-full bg-transparent text-right font-black text-sm text-blue-600 dark:text-cyan-400 outline-none"
                />
                <span className="text-xs text-slate-400 font-extrabold ml-1">Yr</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={years}
              onChange={(e) => setYearsStr(e.target.value)}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-cyan-400"
            />
          </div>
        </div>

        {/* Right Side: Results Card with SVG Doughnut Visualizer */}
        <div className="lg:col-span-5 h-full bg-slate-50/70 dark:bg-[#0c1220]/60 rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-white/5 flex flex-col items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] via-transparent to-transparent pointer-events-none" />

          {/* Doughnut SVG */}
          <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center mt-1">
            <svg viewBox="0 0 150 150" className="w-28 h-28 transform -rotate-90 filter drop-shadow-md">
              {/* Invested amount (gray background base) */}
              <circle
                cx="75"
                cy="75"
                r={60}
                fill="transparent"
                stroke="#64748b"
                strokeWidth="14"
                className="opacity-15 dark:opacity-25"
              />
              {/* Returns amount overlay */}
              <circle
                cx="75"
                cy="75"
                r={60}
                fill="transparent"
                stroke="#10b981"
                strokeWidth="14"
                strokeDasharray={results.circumference}
                strokeDashoffset={results.returnsStrokeOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">Returns</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-455 mt-0.5">
                {results.returnsPercentage.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Breakdown labels */}
          <div className="w-full space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-700 block" />
                  Invested Amount
                </span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-sm">{formatCurrency(results.totalInvested)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                  Est. Returns
                </span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-450 text-sm">{formatCurrency(results.estimatedReturns)}</span>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-white/10" />

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-450 tracking-wider">Total Value</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-blue-600 dark:text-cyan-400" />
                {formatCurrency(results.totalValue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}