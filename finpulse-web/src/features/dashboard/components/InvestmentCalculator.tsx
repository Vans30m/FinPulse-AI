import { useState, useMemo } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';

export default function InvestmentCalculator() {
  const [isSip, setIsSip] = useState(true);
  const [amount, setAmount] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  // Calculate Returns based on SIP or Lumpsum formulas
  const results = useMemo(() => {
    let totalInvested = 0;
    let totalValue = 0;

    if (isSip) {
      // SIP Calculation: P × ({[1 + i]n - 1} / i) × (1 + i)
      const monthlyRate = rate / 12 / 100;
      const months = years * 12;
      totalInvested = amount * months;
      totalValue =
        amount *
        ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
        (1 + monthlyRate);
    } else {
      // Lumpsum Calculation: P(1 + r/100)^t
      totalInvested = amount;
      totalValue = amount * Math.pow(1 + rate / 100, years);
    }

    const estimatedReturns = totalValue - totalInvested;
    const investedPercentage = (totalInvested / totalValue) * 100;
    const returnsPercentage = (estimatedReturns / totalValue) * 100;

    return {
      totalInvested: Math.round(totalInvested),
      estimatedReturns: Math.round(estimatedReturns),
      totalValue: Math.round(totalValue),
      investedPercentage,
      returnsPercentage,
    };
  }, [isSip, amount, rate, years]);

  // Format currency for Indian Rupees (or change to USD if needed)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
            Return Calculator
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Project your wealth compounding over time.
          </p>
        </div>
        
        {/* Toggle SIP / Lumpsum */}
        <div className="flex rounded-lg bg-white dark:bg-night-800/80 p-1 border border-slate-200 dark:border-white/10 w-full sm:w-auto">
          <button
            onClick={() => setIsSip(true)}
            className={`flex-1 sm:flex-none text-center px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              isSip ? 'bg-blue-50 text-blue-700 dark:bg-cyan-400/20 dark:text-cyan-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            SIP
          </button>
          <button
            onClick={() => setIsSip(false)}
            className={`flex-1 sm:flex-none text-center px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              !isSip ? 'bg-blue-50 text-blue-700 dark:bg-cyan-400/20 dark:text-cyan-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lumpsum
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Side: Sliders */}
        <div className="space-y-6">
          {/* Amount Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-slate-500 dark:text-slate-300">
                {isSip ? 'Monthly Investment' : 'Total Investment'}
              </label>
              <span className="text-sm font-semibold bg-blue-50 text-blue-700 dark:bg-cyan-400/10 dark:text-cyan-300 px-2 py-0.5 rounded">
                {formatCurrency(amount)}
              </span>
            </div>
            <input
              type="range"
              min={isSip ? 500 : 5000}
              max={isSip ? 100000 : 1000000}
              step={isSip ? 500 : 5000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-night-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-cyan-400"
            />
          </div>

          {/* Rate Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-slate-500 dark:text-slate-300">Expected Return Rate</label>
              <span className="text-sm font-semibold bg-blue-50 text-blue-700 dark:bg-cyan-400/10 dark:text-cyan-300 px-2 py-0.5 rounded">
                {rate}%
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-night-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-cyan-400"
            />
          </div>

          {/* Time Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-slate-500 dark:text-slate-300">Time Period</label>
              <span className="text-sm font-semibold bg-blue-50 text-blue-700 dark:bg-cyan-400/10 dark:text-cyan-300 px-2 py-0.5 rounded">
                {years} Yr
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-night-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-cyan-400"
            />
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="bg-slate-50 dark:bg-night-800/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5 flex flex-col justify-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 dark:bg-cyan-400/5 blur-[80px] rounded-full" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">Invested Amount</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(results.totalInvested)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">Est. Returns</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(results.estimatedReturns)}</span>
            </div>
            <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-slate-900 dark:text-white">Total Value</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
                {formatCurrency(results.totalValue)}
              </span>
            </div>
          </div>

          {/* Visual Distribution Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-[10px] uppercase tracking-wider mb-2">
              <span className="text-slate-500 dark:text-slate-400">Invested ({results.investedPercentage.toFixed(1)}%)</span>
              <span className="text-emerald-600 dark:text-emerald-400">Returns ({results.returnsPercentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full h-3 flex rounded-full overflow-hidden bg-slate-200 dark:bg-night-800">
              <div 
                className="h-full bg-slate-600 transition-all duration-500 ease-out" 
                style={{ width: `${results.investedPercentage}%` }} 
              />
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
                style={{ width: `${results.returnsPercentage}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}