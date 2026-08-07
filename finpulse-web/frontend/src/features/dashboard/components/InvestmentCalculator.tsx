import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';

export default function InvestmentCalculator() {
  const [isSip, setIsSip] = useState(false);

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

  // Format currency
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

  const toggleSip = (sipMode: boolean) => {
    setIsSip(sipMode);
    if (sipMode) {
      setAmountStr('5000');
    } else {
      setAmountStr('25000');
    }
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
        /* Custom styled slider tracks */
        .premium-slider {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        .premium-slider:focus {
          outline: none;
        }
        /* Webkit runnable track */
        .premium-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .dark .premium-slider::-webkit-slider-runnable-track {
          background: #334155;
        }
        /* Moz range track */
        .premium-slider::-moz-range-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .dark .premium-slider::-moz-range-track {
          background: #334155;
        }
        /* Webkit thumb */
        .premium-slider::-webkit-slider-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          -webkit-appearance: none;
          margin-top: -6px;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
          transition: transform 0.15s ease, background-color 0.15s ease;
        }
        .dark .premium-slider::-webkit-slider-thumb {
          background: #22d3ee;
          box-shadow: 0 4px 10px rgba(34, 211, 238, 0.4);
        }
        .premium-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        /* Moz thumb */
        .premium-slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
          transition: transform 0.15s ease, background-color 0.15s ease;
        }
        .dark .premium-slider::-moz-range-thumb {
          background: #22d3ee;
          box-shadow: 0 4px 10px rgba(34, 211, 238, 0.4);
        }
        .premium-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>
      
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.01] via-transparent to-cyan-500/[0.02] pointer-events-none" />
      
      {/* Header Row */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calculator className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
            Wealth Compound Calculator
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-455 mt-0.5">
            Project mutual fund and equity compounding returns dynamically.
          </p>
        </div>

        {/* SIP / Lumpsum Toggle Switch */}
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1 self-start sm:self-center">
          <button
            onClick={() => toggleSip(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isSip
                ? 'bg-blue-600 text-white dark:bg-cyan-500 dark:text-night-950 shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            SIP
          </button>
          <button
            onClick={() => toggleSip(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isSip
                ? 'bg-blue-600 text-white dark:bg-cyan-500 dark:text-night-950 shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Lumpsum
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="relative grid gap-5 sm:gap-6 lg:grid-cols-12 flex-1 items-center">
        {/* Left Side: Controls & Sliders */}
        <div className="space-y-5 lg:col-span-7 flex flex-col justify-center h-full">
          {/* Amount Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-500 dark:text-slate-455 uppercase tracking-wider">
                {isSip ? 'Monthly Investment' : 'Total Investment'}
              </label>
              <div className="relative flex items-center max-w-[160px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-3 py-1.5 focus-within:border-blue-500 dark:focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-blue-500/10 dark:focus-within:ring-cyan-400/10 transition-all">
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
              className="premium-slider"
            />
          </div>

          {/* Return Rate Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-500 dark:text-slate-455 uppercase tracking-wider">Expected Return Rate (p.a)</label>
              <div className="flex items-center max-w-[110px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-3 py-1.5 focus-within:border-blue-500 dark:focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-blue-500/10 dark:focus-within:ring-cyan-400/10 transition-all">
                <input
                  type="text"
                  value={rateStr}
                  onChange={(e) => handleRateStrChange(e.target.value)}
                  className="w-full bg-transparent text-right font-black text-sm text-blue-600 dark:text-cyan-400 outline-none"
                />
                <span className="text-xs text-slate-400 font-bold ml-1">%</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.1"
              value={rate}
              onChange={(e) => setRateStr(e.target.value)}
              className="premium-slider"
            />
          </div>

          {/* Time Period Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-500 dark:text-slate-455 uppercase tracking-wider">Time Period</label>
              <div className="flex items-center max-w-[110px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-3 py-1.5 focus-within:border-blue-500 dark:focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-blue-500/10 dark:focus-within:ring-cyan-400/10 transition-all">
                <input
                  type="text"
                  value={yearsStr}
                  onChange={(e) => handleYearsStrChange(e.target.value)}
                  className="w-full bg-transparent text-right font-black text-sm text-blue-600 dark:text-cyan-400 outline-none"
                />
                <span className="text-xs text-slate-400 font-bold ml-1">Yr</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={years}
              onChange={(e) => setYearsStr(e.target.value)}
              className="premium-slider"
            />
          </div>
        </div>

        {/* Right Side: Results Card with SVG Doughnut Visualizer */}
        <div className="lg:col-span-5 h-full bg-slate-50/50 dark:bg-[#0c1220]/40 rounded-3xl p-4 sm:p-5 border border-slate-200/50 dark:border-white/5 flex flex-col items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] via-transparent to-transparent pointer-events-none" />

          {/* Doughnut SVG */}
          <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center mt-1">
            <div className="absolute inset-0 bg-emerald-500/5 dark:bg-cyan-500/5 blur-2xl rounded-full pointer-events-none" />
            <svg viewBox="0 0 150 150" className="w-28 h-28 transform -rotate-90 filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.15)] z-10">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">Returns</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {results.returnsPercentage.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Breakdown labels */}
          <div className="w-full space-y-4 mt-4">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-700 block" />
                  Invested Amount
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{formatCurrency(results.totalInvested)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                  Est. Returns
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(results.estimatedReturns)}</span>
              </div>
            </div>

            <div className="h-px bg-slate-200/60 dark:bg-white/5" />

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Total Value</span>
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
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