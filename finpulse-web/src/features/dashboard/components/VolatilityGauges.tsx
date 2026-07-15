import { useEffect, useState } from "react";
import { getFundamentals } from "../../../services/marketService";

export default function VolatilityGauges() {
    const [vix, setVix] = useState({ value: "13.42", status: "Low", color: "text-emerald-500" });
    const [liquidity, setLiquidity] = useState({ value: "Normal", status: "Stable", color: "text-blue-500" });
    const [stress, setStress] = useState({ value: "0.18", status: "Minimal", color: "text-emerald-500" });

    useEffect(() => {
        async function fetchVix() {
            try {
                const fundamentals = await getFundamentals("^VIX");
                const price = fundamentals.price;
                const value = price.toFixed(2);
                
                // 1. VIX indicator details
                let vixStatus = "Low";
                let vixColor = "text-emerald-500";
                if (price > 25) {
                    vixStatus = "High";
                    vixColor = "text-rose-500";
                } else if (price > 15) {
                    vixStatus = "Moderate";
                    vixColor = "text-amber-500";
                }
                setVix({ value, status: vixStatus, color: vixColor });

                // 2. Compute Market Liquidity dynamically using VIX
                let liqValue = "Normal";
                let liqStatus = "Stable";
                let liqColor = "text-blue-500";
                if (price > 28) {
                    liqValue = "Low";
                    liqStatus = "Tight";
                    liqColor = "text-rose-500";
                } else if (price < 14) {
                    liqValue = "High";
                    liqStatus = "Liquid";
                    liqColor = "text-emerald-500";
                }
                setLiquidity({ value: liqValue, status: liqStatus, color: liqColor });

                // 3. Compute Systemic Stress dynamically using VIX
                const stressVal = Number((price / 80).toFixed(2));
                let stressStatus = "Minimal";
                let stressColor = "text-emerald-500";
                if (stressVal > 0.40) {
                    stressStatus = "High";
                    stressColor = "text-rose-500";
                } else if (stressVal > 0.22) {
                    stressStatus = "Moderate";
                    stressColor = "text-amber-500";
                }
                setStress({ value: stressVal.toFixed(2), status: stressStatus, color: stressColor });
            } catch (err) {
                console.error("Failed to fetch VIX from Yahoo Finance:", err);
            }
        }

        fetchVix();
        const interval = setInterval(fetchVix, 30000);
        return () => clearInterval(interval);
    }, []);

    const gauges = [
        { name: "VIX (Volatility)", value: vix.value, status: vix.status, color: vix.color },
        { name: "Market Liquidity", value: liquidity.value, status: liquidity.status, color: liquidity.color },
        { name: "Systemic Stress", value: stress.value, status: stress.status, color: stress.color }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.005]">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 font-display">Volatility Indicators</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                {gauges.map((gauge, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">{gauge.name}</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-lg font-black text-slate-800 dark:text-slate-100">{gauge.value}</span>
                            <span className={`text-xs font-bold ${gauge.color}`}>{gauge.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}